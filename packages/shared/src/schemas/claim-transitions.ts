import { z } from "zod";
import { claimStatusSchema } from "./claims.js";

// =============================================================================
// Params Schema
// =============================================================================

export const claimTransitionParamsSchema = z.object({
  id: z.string().min(1),
});

// =============================================================================
// Request Schemas
// =============================================================================

export const claimTransitionSchema = z.object({
  notes: z.string().trim().max(2000).optional(),
});

export const claimTransitionWithReasonSchema = z.object({
  reason: z.string().trim().min(1).max(1000),
  notes: z.string().trim().max(2000).optional(),
});

// =============================================================================
// Response Schema
// =============================================================================

export const claimTransitionResponseSchema = z.object({
  id: z.string(),
  status: claimStatusSchema,
  previousStatus: claimStatusSchema,
});

// =============================================================================
// Types
// =============================================================================

export type ClaimTransitionParams = z.infer<typeof claimTransitionParamsSchema>;
export type ClaimTransition = z.infer<typeof claimTransitionSchema>;
export type ClaimTransitionWithReason = z.infer<typeof claimTransitionWithReasonSchema>;
export type ClaimTransitionResponse = z.infer<typeof claimTransitionResponseSchema>;
