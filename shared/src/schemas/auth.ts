import { z } from "zod";

export const loginRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((e) => e.toLowerCase()),
  password: z.string().min(1),
});

export const loginResponseSchema = z.object({
  success: z.literal(true),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
