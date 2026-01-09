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
