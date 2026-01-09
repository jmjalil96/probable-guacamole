import { z } from "zod";
import { careTypeSchema } from "shared";

// =============================================================================
// Edit Claim Schema
// =============================================================================

/**
 * Validation schema for editing a claim.
 * Matches the updateClaimRequestSchema from shared but with frontend-specific handling.
 */
export const editClaimSchema = z.object({
  // Relations
  policyId: z.string().nullable(),

  // Claim info
  careType: careTypeSchema.nullable(),
  diagnosis: z.string().max(1000, "Máximo 1000 caracteres").nullable(),
  description: z
    .string()
    .min(1, "Ingrese una descripción")
    .max(2000, "Máximo 2000 caracteres"),

  // Dates (YYYY-MM-DD strings)
  incidentDate: z.string().nullable(),
  submittedDate: z.string().nullable(),
  settlementDate: z.string().nullable(),

  // Financial fields (decimal strings like "1234.56")
  amountSubmitted: z.string().nullable(),
  amountApproved: z.string().nullable(),
  amountDenied: z.string().nullable(),
  amountUnprocessed: z.string().nullable(),
  deductibleApplied: z.string().nullable(),
  copayApplied: z.string().nullable(),

  // Settlement
  settlementNumber: z.string().max(100, "Máximo 100 caracteres").nullable(),
  settlementNotes: z.string().max(2000, "Máximo 2000 caracteres").nullable(),
});

export type EditClaimForm = z.infer<typeof editClaimSchema>;
