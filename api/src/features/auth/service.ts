import type { AuditSeverity } from "@prisma/client";
import { AppError } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import * as audit from "../../services/audit/audit.js";
import { enqueue } from "../../services/jobs/index.js";
import { MAX_FAILED_LOGIN_ATTEMPTS, SESSION_EXPIRY_DAYS } from "./constants.js";
import * as repo from "./repository.js";
import {
  verifyPasswordWithTiming,
  generateSessionToken,
  hashToken,
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

  return { sessionToken, expiresAt };
}
