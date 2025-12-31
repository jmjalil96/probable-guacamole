import { randomBytes, createHash } from "node:crypto";
import type { Response } from "express";
import * as argon2 from "argon2";
import { env } from "../../config/env.js";
import {
  DUMMY_PASSWORD_HASH,
  SESSION_TOKEN_BYTES,
  SESSION_COOKIE_NAME,
} from "./constants.js";

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return argon2.verify(hash, password);
}

/**
 * Verify password with constant timing to prevent user enumeration.
 * Always runs argon2 verification, even if user doesn't exist.
 */
export async function verifyPasswordWithTiming(
  password: string,
  hash: string | null
): Promise<boolean> {
  const targetHash = hash ?? DUMMY_PASSWORD_HASH;
  const result = await argon2.verify(targetHash, password);
  return hash !== null && result;
}

export function generateSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function setSessionCookie(
  res: Response,
  sessionToken: string,
  expiresAt: Date
): void {
  res.cookie(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}
