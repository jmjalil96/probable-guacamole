import { z } from "zod";
import { parseISO, isValid } from "date-fns";

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
// Query Schema
// =============================================================================

const sortBySchema = z.enum([
  "claimNumber",
  "submittedDate",
  "incidentDate",
  "createdAt",
  "status",
  "amountSubmitted",
]);

const sortOrderSchema = z.enum(["asc", "desc"]);

// Helper to transform empty strings to undefined
const emptyToUndefined = (val: unknown) =>
  typeof val === "string" && val.trim() === "" ? undefined : val;

/**
 * Validates that a YYYY-MM-DD string is a real calendar date.
 * Uses date-fns for robust parsing - rejects invalid dates like 2024-02-30.
 */
const isValidCalendarDate = (val: string): boolean => isValid(parseISO(val));

/**
 * Coerced integer with empty string → default handling.
 * Fixes: ?page= returning 400 instead of using default.
 */
const coercedInt = (
  defaultVal: number,
  { min, max }: { min?: number; max?: number } = {}
) =>
  z.preprocess(
    emptyToUndefined,
    z.union([
      z.undefined().transform(() => defaultVal),
      z.coerce
        .number()
        .int()
        .min(min ?? Number.MIN_SAFE_INTEGER)
        .max(max ?? Number.MAX_SAFE_INTEGER),
    ])
  );

/**
 * Enum with empty string → default handling.
 * Fixes: ?sortBy= returning 400 instead of using default.
 */
const coercedEnum = <T extends z.ZodTypeAny>(schema: T, defaultVal: z.infer<T>) =>
  z.preprocess(
    emptyToUndefined,
    z.union([z.undefined().transform(() => defaultVal), schema])
  );

// Helper for trimmed optional string
const optionalTrimmedString = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .optional()
);

// Helper for date string with calendar validation
const optionalDateString = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .refine(isValidCalendarDate, "Invalid calendar date")
    .optional()
);

// Helper for status array (can be single value or comma-separated)
const statusArraySchema = z.preprocess((val) => {
  if (val === undefined || val === null || val === "") return undefined;
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    return val.split(",").map((s) => s.trim());
  }
  return [val];
}, z.array(claimStatusSchema).optional());

export const listClaimsQuerySchema = z.object({
  // Pagination
  page: coercedInt(1, { min: 1 }),
  limit: coercedInt(20, { min: 1, max: 100 }),

  // Sorting
  sortBy: coercedEnum(sortBySchema, "createdAt"),
  sortOrder: coercedEnum(sortOrderSchema, "desc"),

  // Search
  search: optionalTrimmedString,

  // Filters
  status: statusArraySchema,
  clientName: optionalTrimmedString,
  affiliateName: optionalTrimmedString,
  patientName: optionalTrimmedString,
  careType: z.preprocess(emptyToUndefined, careTypeSchema.optional()),

  // Date ranges
  submittedDateFrom: optionalDateString,
  submittedDateTo: optionalDateString,
  incidentDateFrom: optionalDateString,
  incidentDateTo: optionalDateString,
});

export type ListClaimsQuery = z.infer<typeof listClaimsQuerySchema>;

// =============================================================================
// Params Schema
// =============================================================================

export const getClaimParamsSchema = z.object({
  id: z.string().min(1),
});

export type GetClaimParams = z.infer<typeof getClaimParamsSchema>;

// =============================================================================
// Response Schema
// =============================================================================

const relatedEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
});

const relatedPolicySchema = z
  .object({
    id: z.string(),
    number: z.string(),
  })
  .nullable();

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

export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const listClaimsResponseSchema = z.object({
  data: z.array(claimListItemSchema),
  pagination: paginationSchema,
});

export type ClaimListItem = z.infer<typeof claimListItemSchema>;
export type ClaimDetail = z.infer<typeof claimDetailSchema>;
export type ListClaimsResponse = z.infer<typeof listClaimsResponseSchema>;

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
