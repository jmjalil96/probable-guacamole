import { z } from "zod";
import { isValidCalendarDate } from "../../lib/schema-helpers.js";
import { careTypeSchema } from "./core.js";

// =============================================================================
// Create Claim Schema
// =============================================================================

export const createClaimRequestSchema = z.object({
  clientId: z.string().min(1),
  affiliateId: z.string().min(1),
  patientId: z.string().min(1),
  description: z.string().trim().min(1).max(2000),
  pendingUploadIds: z.array(z.string().min(1)).max(20).optional(),
});

export const fileAttachmentErrorSchema = z.object({
  fileId: z.string(),
  error: z.string(),
});

export const createClaimResponseSchema = z.object({
  id: z.string(),
  claimNumber: z.number(),
  fileAttachmentErrors: z.array(fileAttachmentErrorSchema).optional(),
});

export type FileAttachmentError = z.infer<typeof fileAttachmentErrorSchema>;
export type CreateClaimRequest = z.infer<typeof createClaimRequestSchema>;
export type CreateClaimResponse = z.infer<typeof createClaimResponseSchema>;

// =============================================================================
// Update Claim Schema
// =============================================================================

const optionalDateStringField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
  .refine(isValidCalendarDate, "Invalid calendar date")
  .nullable()
  .optional();

const optionalDecimalStringField = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Invalid decimal format")
  .nullable()
  .optional();

export const updateClaimRequestSchema = z.object({
  policyId: z.string().min(1).nullable().optional(),
  description: z.string().trim().min(1).max(2000).optional(),
  careType: careTypeSchema.nullable().optional(),
  diagnosis: z.string().trim().max(1000).nullable().optional(),
  incidentDate: optionalDateStringField,
  amountSubmitted: optionalDecimalStringField,
  submittedDate: optionalDateStringField,
  amountApproved: optionalDecimalStringField,
  amountDenied: optionalDecimalStringField,
  amountUnprocessed: optionalDecimalStringField,
  deductibleApplied: optionalDecimalStringField,
  copayApplied: optionalDecimalStringField,
  settlementDate: optionalDateStringField,
  settlementNumber: z.string().trim().max(100).nullable().optional(),
  settlementNotes: z.string().trim().max(2000).nullable().optional(),
});

export type UpdateClaimRequest = z.infer<typeof updateClaimRequestSchema>;
