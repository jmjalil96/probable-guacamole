import { z } from "zod";

// =============================================================================
// Common Reference Schemas
// =============================================================================

/**
 * User reference schema - used across multiple domains
 * for createdBy, updatedBy, etc.
 */
export const userRefSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type UserRef = z.infer<typeof userRefSchema>;

/**
 * Related entity schema - generic id/name reference
 */
export const relatedEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type RelatedEntity = z.infer<typeof relatedEntitySchema>;

// =============================================================================
// Pagination
// =============================================================================

/**
 * Standard pagination response schema
 */
export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export type Pagination = z.infer<typeof paginationSchema>;
