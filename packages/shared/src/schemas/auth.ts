import { z } from "zod";

// =============================================================================
// Login
// =============================================================================

export const loginRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((e) => e.toLowerCase()),
  password: z.string().min(1),
});

export const loginResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  emailVerifiedAt: z.string().nullable(),
  name: z
    .object({
      firstName: z.string(),
      lastName: z.string(),
    })
    .nullable(),
  role: z.string(),
  permissions: z.array(z.string()),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;

// =============================================================================
// Current User (GET /me)
// =============================================================================

export const meResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  emailVerifiedAt: z.string().nullable(),
  name: z
    .object({
      firstName: z.string(),
      lastName: z.string(),
    })
    .nullable(),
  role: z.string(),
  permissions: z.array(z.string()),
});

export type MeResponse = z.infer<typeof meResponseSchema>;

// =============================================================================
// Password Reset Request
// =============================================================================

export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((e) => e.toLowerCase()),
});

export const passwordResetRequestResponseSchema = z.object({
  message: z.literal("If an account exists, you will receive an email"),
});

export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetRequestResponse = z.infer<
  typeof passwordResetRequestResponseSchema
>;

// =============================================================================
// Validate Reset Token (GET /:token)
// =============================================================================

export const validateResetTokenParamsSchema = z.object({
  token: z.string().min(1),
});

export const validateResetTokenResponseSchema = z.object({
  expiresAt: z.string(),
});

export type ValidateResetTokenParams = z.infer<
  typeof validateResetTokenParamsSchema
>;
export type ValidateResetTokenResponse = z.infer<
  typeof validateResetTokenResponseSchema
>;

// =============================================================================
// Confirm Password Reset
// =============================================================================

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(12).max(128),
});

export const passwordResetConfirmResponseSchema = z.object({
  message: z.literal("Password reset successful"),
});

export type PasswordResetConfirm = z.infer<typeof passwordResetConfirmSchema>;
export type PasswordResetConfirmResponse = z.infer<
  typeof passwordResetConfirmResponseSchema
>;
