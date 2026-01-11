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
  "department",
  "createdAt",
]);
const sortOrderSchema = z.enum(["asc", "desc"]);

export const listEmployeesQuerySchema = z.object({
  // Pagination
  page: coercedInt(1, { min: 1 }),
  limit: coercedInt(20, { min: 1, max: 100 }),

  // Sorting
  sortBy: coercedEnum(sortBySchema, "lastName"),
  sortOrder: coercedEnum(sortOrderSchema, "asc"),

  // Filters
  search: optionalTrimmedString,
  department: optionalTrimmedString,
  isActive: coercedBoolean(true),
  hasAccount: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val === "true"),
    z.boolean().optional()
  ),
});

export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;

// =============================================================================
// Params Schemas
// =============================================================================

export const employeeParamsSchema = z.object({
  id: z.string().min(1),
});

export type EmployeeParams = z.infer<typeof employeeParamsSchema>;

// =============================================================================
// Request Schemas
// =============================================================================

export const createEmployeeRequestSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z
    .string()
    .trim()
    .email("Invalid email")
    .max(255)
    .transform((e) => e.toLowerCase()),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  department: z.string().trim().max(100).optional().or(z.literal("")),
});

export const updateEmployeeRequestSchema = z.object({
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
  department: z.string().trim().max(100).nullable().optional(),
  isActive: z.boolean().optional(),
});

export type CreateEmployeeRequest = z.infer<typeof createEmployeeRequestSchema>;
export type UpdateEmployeeRequest = z.infer<typeof updateEmployeeRequestSchema>;

// =============================================================================
// Response Schemas
// =============================================================================

export const employeeSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  department: z.string().nullable(),
  isActive: z.boolean(),
  hasAccount: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listEmployeesResponseSchema = z.object({
  data: z.array(employeeSchema),
  pagination: paginationSchema,
});

export const createEmployeeResponseSchema = z.object({
  id: z.string(),
});

export type Employee = z.infer<typeof employeeSchema>;
export type ListEmployeesResponse = z.infer<typeof listEmployeesResponseSchema>;
export type CreateEmployeeResponse = z.infer<
  typeof createEmployeeResponseSchema
>;
