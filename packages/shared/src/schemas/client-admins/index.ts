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

const sortBySchema = z.enum([
  "firstName",
  "lastName",
  "email",
  "jobTitle",
  "createdAt",
]);
const sortOrderSchema = z.enum(["asc", "desc"]);

export const listClientAdminsQuerySchema = z.object({
  // Pagination
  page: coercedInt(1, { min: 1 }),
  limit: coercedInt(20, { min: 1, max: 100 }),

  // Sorting
  sortBy: coercedEnum(sortBySchema, "lastName"),
  sortOrder: coercedEnum(sortOrderSchema, "asc"),

  // Filters
  search: optionalTrimmedString,
  isActive: coercedBoolean(true),
  hasAccount: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val === "true"),
    z.boolean().optional()
  ),
});

export type ListClientAdminsQuery = z.infer<typeof listClientAdminsQuerySchema>;

// =============================================================================
// Params Schemas
// =============================================================================

export const clientAdminParamsSchema = z.object({
  id: z.string().min(1),
});

export type ClientAdminParams = z.infer<typeof clientAdminParamsSchema>;

// =============================================================================
// Request Schemas
// =============================================================================

export const createClientAdminRequestSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z
    .string()
    .trim()
    .email("Invalid email")
    .max(255)
    .transform((e) => e.toLowerCase()),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  jobTitle: z.string().trim().max(100).optional().or(z.literal("")),
});

export const updateClientAdminRequestSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name cannot be empty")
    .max(100)
    .optional(),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name cannot be empty")
    .max(100)
    .optional(),
  email: z
    .string()
    .trim()
    .email("Invalid email")
    .max(255)
    .transform((e) => e.toLowerCase())
    .optional(),
  phone: z.string().trim().max(50).nullable().optional(),
  jobTitle: z.string().trim().max(100).nullable().optional(),
  isActive: z.boolean().optional(),
});

export type CreateClientAdminRequest = z.infer<typeof createClientAdminRequestSchema>;
export type UpdateClientAdminRequest = z.infer<typeof updateClientAdminRequestSchema>;

// =============================================================================
// Response Schemas
// =============================================================================

export const clientAdminSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  jobTitle: z.string().nullable(),
  isActive: z.boolean(),
  hasAccount: z.boolean(),
  clientCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listClientAdminsResponseSchema = z.object({
  data: z.array(clientAdminSchema),
  pagination: paginationSchema,
});

export const createClientAdminResponseSchema = z.object({
  id: z.string(),
});

export type ClientAdmin = z.infer<typeof clientAdminSchema>;
export type ListClientAdminsResponse = z.infer<typeof listClientAdminsResponseSchema>;
export type CreateClientAdminResponse = z.infer<typeof createClientAdminResponseSchema>;

// =============================================================================
// Re-export client relation schemas
// =============================================================================

export * from "./clients.js";
