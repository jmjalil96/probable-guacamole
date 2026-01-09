import { z } from "zod";
import {
  coercedInt,
  coercedEnum,
  optionalTrimmedString,
  optionalDateString,
  createCommaSeparatedArraySchema,
} from "../../lib/schema-helpers.js";
import { paginationSchema } from "../../lib/common.js";
import { claimStatusSchema, careTypeSchema, claimListItemSchema } from "./core.js";

// =============================================================================
// Sort Options
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

// =============================================================================
// Query Schema
// =============================================================================

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
  status: createCommaSeparatedArraySchema(claimStatusSchema),
  clientName: optionalTrimmedString,
  affiliateName: optionalTrimmedString,
  patientName: optionalTrimmedString,
  careType: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    careTypeSchema.optional()
  ),

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

export const listClaimsResponseSchema = z.object({
  data: z.array(claimListItemSchema),
  pagination: paginationSchema,
});

export type ListClaimsResponse = z.infer<typeof listClaimsResponseSchema>;
