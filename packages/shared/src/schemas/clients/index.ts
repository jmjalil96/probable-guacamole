import { z } from "zod";
import {
  coercedInt,
  coercedEnum,
  coercedBoolean,
  optionalTrimmedString,
} from "../../lib/schema-helpers.js";
import { paginationSchema } from "../../lib/common.js";

// =============================================================================
// Query Schema
// =============================================================================

const sortBySchema = z.enum(["name", "createdAt", "updatedAt"]);
const sortOrderSchema = z.enum(["asc", "desc"]);

export const listClientsQuerySchema = z.object({
  // Pagination
  page: coercedInt(1, { min: 1 }),
  limit: coercedInt(20, { min: 1, max: 100 }),

  // Sorting
  sortBy: coercedEnum(sortBySchema, "name"),
  sortOrder: coercedEnum(sortOrderSchema, "asc"),

  // Filters
  search: optionalTrimmedString,
  isActive: coercedBoolean(true),
});

export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>;

// =============================================================================
// Params Schemas
// =============================================================================

export const clientParamsSchema = z.object({
  id: z.string().min(1),
});

export type ClientParams = z.infer<typeof clientParamsSchema>;

// =============================================================================
// Request Schemas
// =============================================================================

export const createClientRequestSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
});

export const updateClientRequestSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").max(255).optional(),
  isActive: z.boolean().optional(),
});

export type CreateClientRequest = z.infer<typeof createClientRequestSchema>;
export type UpdateClientRequest = z.infer<typeof updateClientRequestSchema>;

// =============================================================================
// Response Schemas
// =============================================================================

export const clientSchema = z.object({
  id: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listClientsResponseSchema = z.object({
  data: z.array(clientSchema),
  pagination: paginationSchema,
});

export const createClientResponseSchema = z.object({
  id: z.string(),
});

export type Client = z.infer<typeof clientSchema>;
export type ListClientsResponse = z.infer<typeof listClientsResponseSchema>;
export type CreateClientResponse = z.infer<typeof createClientResponseSchema>;
