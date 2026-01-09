import { z } from "zod";
import { claimStatusSchema, careTypeSchema } from "shared";

// =============================================================================
// URL Search Params Schema (for TanStack Router)
// =============================================================================

// This schema is specifically for URL search params validation with TanStack Router.
// It differs from the backend's listClaimsQuerySchema in:
// 1. Uses .catch(undefined) for graceful URL param recovery
// 2. Single status values are kept as-is (backend handles comma-separation)
// 3. Date validation is lenient (backend does strict calendar validation)

const isoDateString = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" })
  .optional()
  .catch(undefined);

const sortBySchema = z.enum([
  "claimNumber",
  "submittedDate",
  "incidentDate",
  "createdAt",
  "status",
  "amountSubmitted",
]);

const viewSchema = z.enum(["list", "kanban"]);

const getDefaultView = (): "list" | "kanban" => {
  if (typeof window === "undefined") return "list";
  const stored = localStorage.getItem("claims-view");
  return stored === "kanban" ? "kanban" : "list";
};

export const claimsSearchSchema = z.object({
  // View mode
  view: viewSchema.optional().default(getDefaultView),

  // Pagination
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),

  // Sorting
  sortBy: sortBySchema.optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),

  // Search
  search: z.string().optional(),

  // Filters - use shared enums for type safety
  status: z
    .union([
      claimStatusSchema.transform((val) => [val]),
      z.array(claimStatusSchema),
    ])
    .optional(),
  careType: careTypeSchema.optional(),

  // Date ranges
  submittedDateFrom: isoDateString,
  submittedDateTo: isoDateString,
  incidentDateFrom: isoDateString,
  incidentDateTo: isoDateString,
});

export type ClaimsSearch = z.infer<typeof claimsSearchSchema>;
