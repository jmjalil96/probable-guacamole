import { db } from "../../config/db.js";

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
