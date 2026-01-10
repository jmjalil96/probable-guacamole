import { z } from "zod";
import { insurerTypeSchema } from "shared";

// =============================================================================
// URL Search Params Schema (for TanStack Router)
// =============================================================================

// This schema is specifically for URL search params validation with TanStack Router.
// It differs from the backend's listInsurersQuerySchema in:
// 1. Uses .catch(undefined) for graceful URL param recovery
// 2. Default isActive is true (show only active insurers by default)

const sortBySchema = z.enum(["name", "code", "type", "createdAt", "updatedAt"]);

export const insurersSearchSchema = z.object({
  // Pagination
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),

  // Sorting
  sortBy: sortBySchema.optional().default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),

  // Search
  search: z.string().optional(),

  // Filters
  type: insurerTypeSchema.optional(),
  isActive: z.boolean().optional().default(true),
});

export type InsurersSearch = z.infer<typeof insurersSearchSchema>;
