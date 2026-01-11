import { z } from "zod";
import {
  coercedInt,
  coercedEnum,
  coercedBoolean,
  optionalTrimmedString,
  emptyToUndefined,
} from "../../lib/schema-helpers.js";
import { paginationSchema } from "../../lib/common.js";
import { affiliateListItemSchema } from "./core.js";

// =============================================================================
// Sort Options
// =============================================================================

const sortBySchema = z.enum([
  "lastName",
  "firstName",
  "createdAt",
  "documentNumber",
]);

const sortOrderSchema = z.enum(["asc", "desc"]);

// =============================================================================
// Query Schema
// =============================================================================

export const listAffiliatesQuerySchema = z.object({
  // Pagination
  page: coercedInt(1, { min: 1 }),
  limit: coercedInt(20, { min: 1, max: 100 }),

  // Sorting
  sortBy: coercedEnum(sortBySchema, "lastName"),
  sortOrder: coercedEnum(sortOrderSchema, "asc"),

  // Search (name, document number, email)
  search: optionalTrimmedString,

  // Filters
  clientId: optionalTrimmedString,
  isActive: coercedBoolean(true),
  hasPortalAccess: z.preprocess(
    emptyToUndefined,
    z.enum(["true", "false", "pending"]).optional()
  ),
});

export type ListAffiliatesQuery = z.infer<typeof listAffiliatesQuerySchema>;

// =============================================================================
// Params Schema
// =============================================================================

export const getAffiliateParamsSchema = z.object({
  id: z.string().min(1),
});

export type GetAffiliateParams = z.infer<typeof getAffiliateParamsSchema>;

// =============================================================================
// Response Schema
// =============================================================================

export const listAffiliatesResponseSchema = z.object({
  data: z.array(affiliateListItemSchema),
  pagination: paginationSchema,
});

export type ListAffiliatesResponse = z.infer<typeof listAffiliatesResponseSchema>;
