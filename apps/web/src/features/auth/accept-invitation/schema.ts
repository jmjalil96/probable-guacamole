import { z } from "zod";

// =============================================================================
// URL Search Schema
// =============================================================================

/**
 * URL search params schema for accept-invitation route.
 */
export const acceptInvitationSearchSchema = z.object({
  token: z.string().optional(),
});

export type AcceptInvitationSearch = z.infer<
  typeof acceptInvitationSearchSchema
>;
