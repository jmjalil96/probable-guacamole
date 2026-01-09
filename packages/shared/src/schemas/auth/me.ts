import { z } from "zod";

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
