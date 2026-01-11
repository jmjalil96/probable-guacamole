import { z } from "zod";

// =============================================================================
// URL Search Params Schema (for TanStack Router)
// =============================================================================

const sortBySchema = z.enum([
  "lastName",
  "firstName",
  "createdAt",
  "documentNumber",
]);

export const affiliatesSearchSchema = z.object({
  // Pagination
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),

  // Sorting
  sortBy: sortBySchema.optional().default("lastName"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),

  // Search
  search: z.string().optional(),

  // Filters
  clientId: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  hasPortalAccess: z.enum(["true", "false", "pending"]).optional(),
});

export type AffiliatesSearch = z.infer<typeof affiliatesSearchSchema>;
