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
  "agencyName",
  "createdAt",
]);
const sortOrderSchema = z.enum(["asc", "desc"]);

export const listAgentsQuerySchema = z.object({
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

export type ListAgentsQuery = z.infer<typeof listAgentsQuerySchema>;

// =============================================================================
// Params Schemas
// =============================================================================

export const agentParamsSchema = z.object({
  id: z.string().min(1),
});

export type AgentParams = z.infer<typeof agentParamsSchema>;

// =============================================================================
// Request Schemas
// =============================================================================

export const createAgentRequestSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z
    .string()
    .trim()
    .email("Invalid email")
    .max(255)
    .transform((e) => e.toLowerCase()),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  licenseNumber: z.string().trim().max(100).optional().or(z.literal("")),
  agencyName: z.string().trim().max(255).optional().or(z.literal("")),
});

export const updateAgentRequestSchema = z.object({
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
  licenseNumber: z.string().trim().max(100).nullable().optional(),
  agencyName: z.string().trim().max(255).nullable().optional(),
  isActive: z.boolean().optional(),
});

export type CreateAgentRequest = z.infer<typeof createAgentRequestSchema>;
export type UpdateAgentRequest = z.infer<typeof updateAgentRequestSchema>;

// =============================================================================
// Response Schemas
// =============================================================================

export const agentSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  licenseNumber: z.string().nullable(),
  agencyName: z.string().nullable(),
  isActive: z.boolean(),
  hasAccount: z.boolean(),
  clientCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listAgentsResponseSchema = z.object({
  data: z.array(agentSchema),
  pagination: paginationSchema,
});

export const createAgentResponseSchema = z.object({
  id: z.string(),
});

export type Agent = z.infer<typeof agentSchema>;
export type ListAgentsResponse = z.infer<typeof listAgentsResponseSchema>;
export type CreateAgentResponse = z.infer<typeof createAgentResponseSchema>;

// =============================================================================
// Re-export client relation schemas
// =============================================================================

export * from "./clients.js";
