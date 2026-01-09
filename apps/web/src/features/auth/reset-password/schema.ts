import { z } from "zod";

// =============================================================================
// URL Search Schema
// =============================================================================

/**
 * URL search params schema for reset-password route.
 */
export const resetPasswordSearchSchema = z.object({
  token: z.string().optional(),
});

export type ResetPasswordSearch = z.infer<typeof resetPasswordSearchSchema>;
