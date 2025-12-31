import type { PrismaClient } from "@prisma/client";
import { db } from "../../config/db.js";

export type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export async function findUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
    include: { role: true },
  });
}

/**
 * Atomically increments failed login attempts and locks the account if threshold is reached.
 * Uses raw SQL to avoid race conditions where concurrent requests could bypass locking.
 */
export async function incrementFailedAttemptsAndMaybeLock(
  userId: string,
  maxAttempts: number
): Promise<{ failedLoginAttempts: number; lockedAt: Date | null }> {
  const result = await db.$queryRaw<
    { failedLoginAttempts: number; lockedAt: Date | null }[]
  >`
    UPDATE users
    SET
      "failedLoginAttempts" = "failedLoginAttempts" + 1,
      "lockedAt" = CASE
        WHEN "failedLoginAttempts" + 1 >= ${maxAttempts} AND "lockedAt" IS NULL
        THEN NOW()
        ELSE "lockedAt"
      END,
      "sessionsInvalidBefore" = CASE
        WHEN "failedLoginAttempts" + 1 >= ${maxAttempts} AND "lockedAt" IS NULL
        THEN NOW()
        ELSE "sessionsInvalidBefore"
      END,
      "updatedAt" = NOW()
    WHERE id = ${userId}
    RETURNING "failedLoginAttempts", "lockedAt"
  `;

  const row = result[0];
  if (!row) {
    throw new Error(`User not found: ${userId}`);
  }

  return {
    failedLoginAttempts: row.failedLoginAttempts,
    lockedAt: row.lockedAt,
  };
}

export async function resetFailedAttempts(userId: string) {
  return db.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0 },
  });
}

export async function createSessionAndResetAttempts(
  userId: string,
  sessionData: {
    tokenHash: string;
    expiresAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
  }
) {
  return db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0 },
    });

    return tx.session.create({
      data: { userId, ...sessionData },
    });
  });
}

/**
 * Revoke a single session. Idempotent - only updates if not already revoked.
 */
export async function revokeSession(sessionId: string): Promise<void> {
  await db.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Revoke all sessions for a user within a transaction.
 * Sets sessionsInvalidBefore and explicitly revokes current session.
 */
export async function revokeAllSessionsForUser(
  tx: TransactionClient,
  userId: string,
  currentSessionId: string
): Promise<void> {
  await tx.user.update({
    where: { id: userId },
    data: { sessionsInvalidBefore: new Date() },
  });

  await tx.session.updateMany({
    where: { id: currentSessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Find user with profile and permissions for /me endpoint.
 */
export async function findUserWithProfileAndPermissions(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
      employee: { select: { firstName: true, lastName: true } },
      agent: { select: { firstName: true, lastName: true } },
      clientAdmin: { select: { firstName: true, lastName: true } },
      affiliate: { select: { firstName: true, lastName: true } },
    },
  });
}

// =============================================================================
// Password Reset
// =============================================================================

/**
 * Find an active user by email for password reset.
 */
export async function findActiveUserByEmail(email: string) {
  return db.user.findFirst({
    where: { email, isActive: true },
    select: { id: true, email: true },
  });
}

/**
 * Delete existing unused password reset tokens for a user.
 */
export async function deleteUnusedPasswordResetTokens(
  tx: TransactionClient,
  userId: string
) {
  return tx.verificationToken.deleteMany({
    where: {
      userId,
      type: "PASSWORD_RESET",
      usedAt: null,
    },
  });
}

/**
 * Create a new password reset token.
 */
export async function createPasswordResetToken(
  tx: TransactionClient,
  data: { userId: string; tokenHash: string; expiresAt: Date }
) {
  return tx.verificationToken.create({
    data: {
      userId: data.userId,
      tokenHash: data.tokenHash,
      type: "PASSWORD_RESET",
      expiresAt: data.expiresAt,
    },
  });
}

/**
 * Find a valid (not used, not expired) password reset token.
 */
export async function findValidPasswordResetToken(tokenHash: string) {
  return db.verificationToken.findFirst({
    where: {
      tokenHash,
      type: "PASSWORD_RESET",
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
    },
  });
}

/**
 * Atomically consume token, update password, and invalidate all sessions.
 * Returns false if the token was already used (race condition).
 */
export async function consumeTokenAndResetPassword(
  tx: TransactionClient,
  tokenId: string,
  userId: string,
  passwordHash: string
): Promise<boolean> {
  // Conditional update - only if usedAt is still null
  const result = await tx.verificationToken.updateMany({
    where: {
      id: tokenId,
      usedAt: null,
    },
    data: { usedAt: new Date() },
  });

  if (result.count === 0) {
    return false; // Token already used (race condition)
  }

  // Update password and invalidate all sessions
  await tx.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      sessionsInvalidBefore: new Date(),
    },
  });

  return true;
}
