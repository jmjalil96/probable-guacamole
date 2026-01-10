import { z } from "zod";
import {
  coercedInt,
  coercedEnum,
  coercedBoolean,
  optionalTrimmedString,
} from "../../lib/schema-helpers.js";
import { paginationSchema } from "../../lib/common.js";

// =============================================================================
// Enums
// =============================================================================

export const insurerTypeSchema = z.enum([
  "MEDICINA_PREPAGADA",
  "COMPANIA_DE_SEGUROS",
]);

export type InsurerType = z.infer<typeof insurerTypeSchema>;

// =============================================================================
// Query Schema
// =============================================================================

const sortBySchema = z.enum(["name", "code", "type", "createdAt", "updatedAt"]);
const sortOrderSchema = z.enum(["asc", "desc"]);

export const listInsurersQuerySchema = z.object({
  // Pagination
  page: coercedInt(1, { min: 1 }),
  limit: coercedInt(20, { min: 1, max: 100 }),

  // Sorting
  sortBy: coercedEnum(sortBySchema, "name"),
  sortOrder: coercedEnum(sortOrderSchema, "asc"),

  // Filters
  search: optionalTrimmedString,
  type: z.preprocess(
    (val) => (val === "" ? undefined : val),
    insurerTypeSchema.optional()
  ),
  isActive: coercedBoolean(true),
});

export type ListInsurersQuery = z.infer<typeof listInsurersQuerySchema>;

// =============================================================================
// Params Schemas
// =============================================================================

export const insurerParamsSchema = z.object({
  id: z.string().min(1),
});

export type InsurerParams = z.infer<typeof insurerParamsSchema>;

// =============================================================================
// Request Schemas
// =============================================================================

export const createInsurerRequestSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  code: z.string().trim().max(50).optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  type: insurerTypeSchema,
});

export const updateInsurerRequestSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").max(255).optional(),
  code: z.string().trim().max(50).nullable().optional(),
  email: z.string().email("Invalid email").nullable().optional().or(z.literal("")),
  phone: z.string().trim().max(50).nullable().optional(),
  website: z.string().url("Invalid URL").nullable().optional().or(z.literal("")),
  type: insurerTypeSchema.optional(),
  isActive: z.boolean().optional(),
});

export type CreateInsurerRequest = z.infer<typeof createInsurerRequestSchema>;
export type UpdateInsurerRequest = z.infer<typeof updateInsurerRequestSchema>;

// =============================================================================
// Response Schemas
// =============================================================================

export const insurerSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  type: insurerTypeSchema,
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listInsurersResponseSchema = z.object({
  data: z.array(insurerSchema),
  pagination: paginationSchema,
});

export const createInsurerResponseSchema = z.object({
  id: z.string(),
});

export type Insurer = z.infer<typeof insurerSchema>;
export type ListInsurersResponse = z.infer<typeof listInsurersResponseSchema>;
export type CreateInsurerResponse = z.infer<typeof createInsurerResponseSchema>;
