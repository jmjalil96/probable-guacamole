import { z } from "zod";

// =============================================================================
// Password Form Schema
// =============================================================================

/**
 * Shared password validation schema for reset-password and accept-invitation flows.
 * Requires minimum 12 characters for security.
 */
export const passwordFormSchema = z.object({
  password: z
    .string()
    .min(12, "La contraseña debe tener al menos 12 caracteres")
    .max(128),
});

export type PasswordFormData = z.infer<typeof passwordFormSchema>;

// =============================================================================
// Token Search Schema
// =============================================================================

/**
 * URL search params schema for token-based flows (reset-password, accept-invitation).
 */
export const tokenSearchSchema = z.object({
  token: z.string().optional(),
});

export type TokenSearch = z.infer<typeof tokenSearchSchema>;
