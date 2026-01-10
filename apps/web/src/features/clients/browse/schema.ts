import { z } from "zod";

// =============================================================================
// URL Search Params Schema (for TanStack Router)
// =============================================================================

// This schema is specifically for URL search params validation with TanStack Router.
// It differs from the backend's listClientsQuerySchema in:
// 1. Uses .catch(undefined) for graceful URL param recovery
// 2. Default isActive is true (show only active clients by default)

const sortBySchema = z.enum(["name", "createdAt", "updatedAt"]);

export const clientsSearchSchema = z.object({
  // Pagination
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),

  // Sorting
  sortBy: sortBySchema.optional().default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),

  // Search
  search: z.string().optional(),

  // Filters
  isActive: z.boolean().optional().default(true),
});

export type ClientsSearch = z.infer<typeof clientsSearchSchema>;
