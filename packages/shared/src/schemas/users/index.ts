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

export const userTypeSchema = z.enum([
  "employee",
  "agent",
  "client_admin",
  "affiliate",
]);

export type UserType = z.infer<typeof userTypeSchema>;

// =============================================================================
// Query Schema
// =============================================================================

const sortBySchema = z.enum(["name", "email", "type", "createdAt"]);
const sortOrderSchema = z.enum(["asc", "desc"]);

export const listUsersQuerySchema = z.object({
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
    userTypeSchema.optional()
  ),
  isActive: coercedBoolean(true),
  hasAccount: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val === "true"),
    z.boolean().optional()
  ),
  clientId: optionalTrimmedString,
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

// =============================================================================
// Response Schemas
// =============================================================================

export const userListItemSchema = z.object({
  id: z.string(),
  type: userTypeSchema,
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),

  // Account status
  hasAccount: z.boolean(),
  hasPendingInvitation: z.boolean(),
  accountIsActive: z.boolean().nullable(),

  // Type-specific fields (present only for relevant types)
  department: z.string().nullable().optional(), // employee
  licenseNumber: z.string().nullable().optional(), // agent
  agencyName: z.string().nullable().optional(), // agent
  jobTitle: z.string().nullable().optional(), // client_admin
  documentType: z.string().nullable().optional(), // affiliate
  documentNumber: z.string().nullable().optional(), // affiliate

  // Client relationships
  clients: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
      })
    )
    .optional(), // agent, client_admin
  client: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable()
    .optional(), // affiliate
});

export type UserListItem = z.infer<typeof userListItemSchema>;

export const listUsersResponseSchema = z.object({
  data: z.array(userListItemSchema),
  pagination: paginationSchema,
});

export type ListUsersResponse = z.infer<typeof listUsersResponseSchema>;
