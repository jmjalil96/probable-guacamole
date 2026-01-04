import type { AuditSeverity } from "@prisma/client";
import { db } from "../../config/db.js";
import { AppError } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import * as audit from "../../services/audit/audit.js";
import { enqueue } from "../../services/jobs/index.js";
import {
  MAX_FAILED_LOGIN_ATTEMPTS,
  SESSION_EXPIRY_DAYS,
  PASSWORD_RESET_EXPIRY_HOURS,
} from "./constants.js";
import * as repo from "./repository.js";
import {
  verifyPasswordWithTiming,
  generateSessionToken,
  hashToken,
  hashPassword,
  performDummyPasswordWork,
} from "./utils.js";

// =============================================================================
// Helpers
// =============================================================================

function auditLoginFailed(
  reason: string,
  context: audit.AuditContext,
  opts?: { resourceId?: string; severity?: AuditSeverity; attempts?: number }
) {
  audit.log(
    {
      action: "LOGIN_FAILED",
      resource: "User",
      resourceId: opts?.resourceId ?? null,
      ...(opts?.severity && { severity: opts.severity }),
      metadata: {
        reason,
        ...(opts?.attempts != null && { attempts: opts.attempts }),
      },
    },
    context
  );
}

// =============================================================================
// Types
// =============================================================================

export interface LoginParams {
  email: string;
  password: string;
  ip: string | null;
  userAgent: string | null;
  requestId?: string;
}

export interface LoginResult {
  sessionToken: string;
  expiresAt: Date;
  user: {
    id: string;
    email: string;
    emailVerifiedAt: string | null;
    name: { firstName: string; lastName: string } | null;
    role: string;
    permissions: string[];
  };
}

// =============================================================================
// Service
// =============================================================================

export async function login(params: LoginParams): Promise<LoginResult> {
  const { email, password, ip, userAgent, requestId } = params;
  const log = logger.child({ module: "auth", requestId });

  log.debug({ email, ip }, "login attempt started");

  // 1. Find user
  const user = await repo.findUserByEmail(email);

  // 2. Verify password (always runs to prevent timing attacks)
  const validPassword = await verifyPasswordWithTiming(
    password,
    user?.passwordHash ?? null
  );

  if (!user) {
    log.debug({ email }, "login failed: user not found");
    auditLoginFailed("not_found", { ipAddress: ip, userAgent });
    throw AppError.unauthorized("Invalid credentials");
  }

  const userId = user.id;
  const auditContext = { userId, ipAddress: ip, userAgent };

  log.debug({ userId, email }, "user found, checking account status");

  // 3. Check locked
  if (user.lockedAt) {
    log.debug({ userId }, "login failed: account locked");
    auditLoginFailed("locked", auditContext, { resourceId: userId });
    throw AppError.unauthorized("Invalid credentials");
  }

  // 4. Check email verified
  if (!user.emailVerifiedAt) {
    log.debug({ userId }, "login failed: email not verified");
    auditLoginFailed("unverified", auditContext, { resourceId: userId });
    throw AppError.unauthorized("Invalid credentials");
  }

  // 5. Check active
  if (!user.isActive) {
    log.debug({ userId }, "login failed: account inactive");
    auditLoginFailed("inactive", auditContext, { resourceId: userId });
    throw AppError.unauthorized("Invalid credentials");
  }

  log.debug({ userId }, "account status OK, checking password result");

  // 6. Check password verification result (already computed above)
  if (!validPassword) {
    // Atomic increment + conditional lock to prevent race conditions
    const { failedLoginAttempts } =
      await repo.incrementFailedAttemptsAndMaybeLock(
        userId,
        MAX_FAILED_LOGIN_ATTEMPTS
      );
    // Only the request that hits exactly the threshold triggers the email
    // Prevents duplicates when concurrent requests increment past the limit
    const justLocked = failedLoginAttempts === MAX_FAILED_LOGIN_ATTEMPTS;

    log.debug(
      { userId, attempts: failedLoginAttempts, justLocked },
      "login failed: wrong password"
    );

    if (justLocked) {
      log.warn(
        { userId, attempts: failedLoginAttempts },
        "account locked due to failed attempts"
      );

      // Fire-and-forget: email is nice-to-have, not critical
      enqueue("email:account-locked", { to: user.email, userId }).catch(
        (err) => {
          log.error({ err, userId }, "failed to queue account-locked email");
        }
      );

      auditLoginFailed("locked_now", auditContext, {
        resourceId: userId,
        severity: "WARNING",
        attempts: failedLoginAttempts,
      });
    } else {
      auditLoginFailed("wrong_password", auditContext, {
        resourceId: userId,
        attempts: failedLoginAttempts,
      });
    }

    throw AppError.unauthorized("Invalid credentials");
  }

  log.debug({ userId }, "password verified, creating session");

  // 7. Success - create session in transaction
  const sessionToken = generateSessionToken();
  const tokenHash = hashToken(sessionToken);
  const expiresAt = new Date(
    Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  const session = await repo.createSessionAndResetAttempts(userId, {
    tokenHash,
    expiresAt,
    ipAddress: ip,
    userAgent,
  });

  log.info({ userId, sessionId: session.id }, "login successful");

  audit.log(
    { action: "LOGIN", resource: "Session", resourceId: session.id },
    { ...auditContext, sessionId: session.id }
  );

  // Fetch user data with profile and permissions
  const userWithProfile = await repo.findUserWithProfileAndPermissions(userId);
  if (!userWithProfile) {
    throw AppError.unauthorized();
  }

  const profile =
    userWithProfile.employee ??
    userWithProfile.agent ??
    userWithProfile.clientAdmin ??
    userWithProfile.affiliate;
  const name = profile
    ? { firstName: profile.firstName, lastName: profile.lastName }
    : null;

  const permissions = userWithProfile.role.permissions.map(
    (rp) => `${rp.permission.resource}:${rp.permission.action}`
  );

  return {
    sessionToken,
    expiresAt,
    user: {
      id: userWithProfile.id,
      email: userWithProfile.email,
      emailVerifiedAt: userWithProfile.emailVerifiedAt?.toISOString() ?? null,
      name,
      role: userWithProfile.role.name,
      permissions,
    },
  };
}

// =============================================================================
// Logout
// =============================================================================

export interface LogoutParams {
  sessionId: string;
  requestId?: string;
}

export async function logout(
  params: LogoutParams,
  context: audit.AuditContext
): Promise<void> {
  const { sessionId, requestId } = params;
  const log = logger.child({ module: "auth", requestId });

  log.debug({ sessionId }, "logout started");

  await repo.revokeSession(sessionId);

  log.info({ sessionId }, "logout successful");

  audit.log(
    { action: "LOGOUT", resource: "Session", resourceId: sessionId },
    context
  );
}

// =============================================================================
// Logout All
// =============================================================================

export interface LogoutAllParams {
  userId: string;
  sessionId: string;
  requestId?: string;
}

export async function logoutAll(
  params: LogoutAllParams,
  context: audit.AuditContext
): Promise<void> {
  const { userId, sessionId, requestId } = params;
  const log = logger.child({ module: "auth", requestId });

  log.debug({ userId, sessionId }, "logout-all started");

  await db.$transaction(async (tx) => {
    await repo.revokeAllSessionsForUser(tx, userId, sessionId);
  });

  log.info({ userId, sessionId }, "logout-all successful");

  audit.log(
    {
      action: "LOGOUT",
      resource: "Session",
      resourceId: sessionId,
      metadata: { allSessions: true },
    },
    context
  );
}

// =============================================================================
// Get Current User
// =============================================================================

export interface GetCurrentUserParams {
  userId: string;
  requestId?: string;
}

export interface CurrentUserResult {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
  name: { firstName: string; lastName: string } | null;
  role: string;
  permissions: string[];
}

export async function getCurrentUser(
  params: GetCurrentUserParams
): Promise<CurrentUserResult> {
  const { userId, requestId } = params;
  const log = logger.child({ module: "auth", requestId });

  log.debug({ userId }, "get current user started");

  const user = await repo.findUserWithProfileAndPermissions(userId);
  if (!user) {
    throw AppError.unauthorized();
  }

  const profile =
    user.employee ?? user.agent ?? user.clientAdmin ?? user.affiliate;
  const name = profile
    ? { firstName: profile.firstName, lastName: profile.lastName }
    : null;

  const permissions = user.role.permissions.map(
    (rp) => `${rp.permission.resource}:${rp.permission.action}`
  );

  log.debug({ userId }, "get current user successful");

  return {
    id: user.id,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    name,
    role: user.role.name,
    permissions,
  };
}

// =============================================================================
// Password Reset
// =============================================================================

export interface RequestPasswordResetParams {
  email: string;
  requestId?: string;
}

export async function requestPasswordReset(
  params: RequestPasswordResetParams,
  context: audit.AuditContext
): Promise<void> {
  const { email, requestId } = params;
  const log = logger.child({ module: "auth", requestId });

  log.debug({ email }, "password reset requested");

  // 1. Find active user
  const user = await repo.findActiveUserByEmail(email);

  // 2. If no user, perform dummy work (timing-safe)
  if (!user) {
    await performDummyPasswordWork();
    log.debug({ email }, "password reset for non-existent user (dummy work)");
    return;
  }

  // 3. Generate token (32 bytes = 256 bits entropy)
  const rawToken = generateSessionToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000
  );

  // 4. Atomic: delete old tokens + create new one
  await db.$transaction(async (tx) => {
    await repo.deleteUnusedPasswordResetTokens(tx, user.id);
    await repo.createPasswordResetToken(tx, {
      userId: user.id,
      tokenHash,
      expiresAt,
    });
  });

  // 5. Queue email (fire-and-forget)
  enqueue("email:password-reset", {
    to: user.email,
    userId: user.id,
    token: rawToken,
  }).catch((err) => {
    log.error({ err, userId: user.id }, "failed to queue password-reset email");
  });

  // 6. Audit log (fire-and-forget)
  audit.log(
    {
      action: audit.AuditActions.PASSWORD_RESET_REQUESTED,
      resource: "User",
      resourceId: user.id,
      severity: "INFO",
    },
    context
  );

  log.info({ userId: user.id }, "password reset token created");
}

// =============================================================================
// Validate Reset Token
// =============================================================================

interface ValidateResetTokenServiceParams {
  token: string;
  requestId?: string;
}

export interface ValidateResetTokenResult {
  expiresAt: Date;
}

export async function validateResetToken(
  params: ValidateResetTokenServiceParams
): Promise<ValidateResetTokenResult> {
  const { token, requestId } = params;
  const log = logger.child({ module: "auth", requestId });

  const tokenHash = hashToken(token);
  const tokenRecord = await repo.findValidPasswordResetToken(tokenHash);

  if (!tokenRecord) {
    log.debug("invalid or expired reset token");
    throw AppError.notFound("Invalid or expired token", {
      code: "INVALID_RESET_TOKEN",
    });
  }

  return { expiresAt: tokenRecord.expiresAt };
}

// =============================================================================
// Confirm Password Reset
// =============================================================================

export interface ConfirmPasswordResetParams {
  token: string;
  password: string;
  requestId?: string;
}

export async function confirmPasswordReset(
  params: ConfirmPasswordResetParams,
  context: audit.AuditContext
): Promise<void> {
  const { token, password, requestId } = params;
  const log = logger.child({ module: "auth", requestId });

  // 1. Validate token exists and is valid
  const tokenHash = hashToken(token);
  const tokenRecord = await repo.findValidPasswordResetToken(tokenHash);

  if (!tokenRecord) {
    log.debug("invalid or expired reset token on confirm");
    throw AppError.notFound("Invalid or expired token", {
      code: "INVALID_RESET_TOKEN",
    });
  }

  // 2. Hash new password
  const passwordHash = await hashPassword(password);

  // 3. Atomic: consume token + update password + invalidate sessions
  const success = await db.$transaction(async (tx) => {
    return repo.consumeTokenAndResetPassword(
      tx,
      tokenRecord.id,
      tokenRecord.userId,
      passwordHash
    );
  });

  if (!success) {
    log.warn({ tokenId: tokenRecord.id }, "token already consumed (race)");
    throw AppError.notFound("Invalid or expired token", {
      code: "INVALID_RESET_TOKEN",
    });
  }

  // 4. Audit log (fire-and-forget)
  audit.log(
    {
      action: audit.AuditActions.PASSWORD_CHANGED,
      resource: "User",
      resourceId: tokenRecord.userId,
      severity: "CRITICAL",
      metadata: { via: "password_reset" },
    },
    context
  );

  log.info({ userId: tokenRecord.userId }, "password reset completed");
}
