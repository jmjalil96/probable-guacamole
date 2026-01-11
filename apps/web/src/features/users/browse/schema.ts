import { z } from "zod";

const sortBySchema = z.enum(["name", "email", "type", "createdAt"]);
const userTypeSchema = z.enum(["employee", "agent", "client_admin", "affiliate"]);

export const usersSearchSchema = z.object({
  // Pagination
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),

  // Sorting
  sortBy: sortBySchema.optional().default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),

  // Search
  search: z.string().optional(),

  // Filters
  type: userTypeSchema.optional(),
  isActive: z.boolean().optional().default(true),
  hasAccount: z.boolean().optional(),
});

export type UsersSearch = z.infer<typeof usersSearchSchema>;
