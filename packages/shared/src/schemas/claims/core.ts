import { z } from "zod";
import { relatedEntitySchema } from "../../lib/common.js";

// =============================================================================
// Enums (matching Prisma schema)
// =============================================================================

export const claimStatusSchema = z.enum([
  "DRAFT",
  "SUBMITTED",
  "IN_REVIEW",
  "PENDING_INFO",
  "RETURNED",
  "CANCELLED",
  "SETTLED",
]);

export const careTypeSchema = z.enum(["AMBULATORY", "HOSPITALARY", "OTHER"]);

export type ClaimStatus = z.infer<typeof claimStatusSchema>;
export type CareType = z.infer<typeof careTypeSchema>;

// =============================================================================
// Related Entity Schemas (internal to claims)
// =============================================================================

const relatedPolicySchema = z
  .object({
    id: z.string(),
    number: z.string(),
  })
  .nullable();

// =============================================================================
// Response Schemas
// =============================================================================

export const claimListItemSchema = z.object({
  id: z.string(),
  claimNumber: z.number(),
  status: claimStatusSchema,
  description: z.string(),
  careType: careTypeSchema.nullable(),
  diagnosis: z.string().nullable(),
  amountSubmitted: z.string().nullable(),
  amountApproved: z.string().nullable(),
  amountDenied: z.string().nullable(),
  amountUnprocessed: z.string().nullable(),
  deductibleApplied: z.string().nullable(),
  copayApplied: z.string().nullable(),
  incidentDate: z.string().nullable(),
  submittedDate: z.string().nullable(),
  settlementDate: z.string().nullable(),
  businessDays: z.number().nullable(),
  settlementNumber: z.string().nullable(),
  settlementNotes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),

  patient: relatedEntitySchema,
  affiliate: relatedEntitySchema,
  client: relatedEntitySchema,
  policy: relatedPolicySchema,
  createdBy: relatedEntitySchema,
  updatedBy: relatedEntitySchema.nullable(),
});

export const claimDetailSchema = z.object({
  id: z.string(),
  claimNumber: z.number(),
  status: claimStatusSchema,
  description: z.string(),
  careType: careTypeSchema.nullable(),
  diagnosis: z.string().nullable(),
  amountSubmitted: z.string().nullable(),
  amountApproved: z.string().nullable(),
  amountDenied: z.string().nullable(),
  amountUnprocessed: z.string().nullable(),
  deductibleApplied: z.string().nullable(),
  copayApplied: z.string().nullable(),
  incidentDate: z.string().nullable(),
  submittedDate: z.string().nullable(),
  settlementDate: z.string().nullable(),
  businessDays: z.number().nullable(),
  settlementNumber: z.string().nullable(),
  settlementNotes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),

  patient: relatedEntitySchema,
  affiliate: relatedEntitySchema,
  client: relatedEntitySchema,
  policy: relatedPolicySchema,
  createdBy: relatedEntitySchema,
  updatedBy: relatedEntitySchema.nullable(),
});

export type ClaimListItem = z.infer<typeof claimListItemSchema>;
export type ClaimDetail = z.infer<typeof claimDetailSchema>;
