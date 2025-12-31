import { db } from "../../../config/db.js";
import { generateSessionToken, hashToken } from "../utils.js";
import { PASSWORD_RESET_EXPIRY_HOURS } from "../constants.js";

export const TEST_PASSWORD = "TestPassword123!";
export const WRONG_PASSWORD = "WrongPassword456!";
export const NEW_PASSWORD = "NewSecurePassword123!";

export const validLoginPayload = {
  email: "test@example.com",
  password: TEST_PASSWORD,
};

export const invalidPayloads = {
  missingEmail: { password: TEST_PASSWORD },
  missingPassword: { email: "test@example.com" },
  invalidEmail: { email: "not-an-email", password: TEST_PASSWORD },
  emptyPassword: { email: "test@example.com", password: "" },
};

// =============================================================================
// Session Factory
// =============================================================================

export async function createTestSession(
  userId: string,
  options: {
    token?: string;
    expiresAt?: Date;
    revokedAt?: Date | null;
  } = {}
) {
  const token = options.token ?? generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt =
    options.expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const session = await db.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      revokedAt: options.revokedAt ?? null,
    },
  });

  return { session, token };
}

// =============================================================================
// Password Reset Token Factory
// =============================================================================

export async function createPasswordResetToken(
  userId: string,
  options: {
    token?: string;
    expiresAt?: Date;
    usedAt?: Date | null;
  } = {}
) {
  const token = options.token ?? generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt =
    options.expiresAt ??
    new Date(Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000);

  const verificationToken = await db.verificationToken.create({
    data: {
      userId,
      tokenHash,
      type: "PASSWORD_RESET",
      expiresAt,
      usedAt: options.usedAt ?? null,
    },
  });

  return { verificationToken, token };
}
