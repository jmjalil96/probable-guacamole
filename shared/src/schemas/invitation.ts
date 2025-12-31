import { z } from "zod";

// =============================================================================
// Request Schemas
// =============================================================================

const profileIdFields = z.object({
  employeeId: z.string().min(1).optional(),
  agentId: z.string().min(1).optional(),
  clientAdminId: z.string().min(1).optional(),
  affiliateId: z.string().min(1).optional(),
});

export const createInvitationRequestSchema = z
  .object({
    roleId: z.string().min(1),
    email: z
      .string()
      .trim()
      .email()
      .transform((e) => e.toLowerCase())
      .optional(),
  })
  .merge(profileIdFields)
  .refine(
    (data) => {
      const profileIds = [
        data.employeeId,
        data.agentId,
        data.clientAdminId,
        data.affiliateId,
      ].filter(Boolean);
      return profileIds.length === 1;
    },
    {
      message: "Exactly one profile ID must be provided",
      path: ["profileId"],
    }
  );

export const validateInvitationParamsSchema = z.object({
  token: z.string().min(1),
});

export const acceptInvitationRequestSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(12).max(128),
});

export const resendInvitationParamsSchema = z.object({
  id: z.string().min(1),
});

// =============================================================================
// Response Schemas
// =============================================================================

export const createInvitationResponseSchema = z.object({
  invitationId: z.string(),
  expiresAt: z.string().datetime(),
});

export const validateInvitationResponseSchema = z.object({
  expiresAt: z.string().datetime(),
  role: z.object({
    displayName: z.string(),
  }),
});

export const acceptInvitationResponseSchema = z.object({
  success: z.literal(true),
});

export const resendInvitationResponseSchema = z.object({
  invitationId: z.string(),
  expiresAt: z.string().datetime(),
});

// =============================================================================
// Types
// =============================================================================

export type CreateInvitationRequest = z.infer<
  typeof createInvitationRequestSchema
>;
export type CreateInvitationResponse = z.infer<
  typeof createInvitationResponseSchema
>;

export type ValidateInvitationParams = z.infer<
  typeof validateInvitationParamsSchema
>;
export type ValidateInvitationResponse = z.infer<
  typeof validateInvitationResponseSchema
>;

export type AcceptInvitationRequest = z.infer<
  typeof acceptInvitationRequestSchema
>;
export type AcceptInvitationResponse = z.infer<
  typeof acceptInvitationResponseSchema
>;

export type ResendInvitationParams = z.infer<
  typeof resendInvitationParamsSchema
>;
export type ResendInvitationResponse = z.infer<
  typeof resendInvitationResponseSchema
>;
