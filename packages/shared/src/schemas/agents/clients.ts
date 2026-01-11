import { z } from "zod";
import {
  coercedInt,
  coercedEnum,
  optionalTrimmedString,
} from "../../lib/schema-helpers.js";
import { paginationSchema } from "../../lib/common.js";

// =============================================================================
// Params Schemas
// =============================================================================

export const agentClientsListParamsSchema = z.object({
  agentId: z.string().min(1),
});

export const agentClientParamsSchema = z.object({
  agentId: z.string().min(1),
  clientId: z.string().min(1),
});

export type AgentClientsListParams = z.infer<typeof agentClientsListParamsSchema>;
export type AgentClientParams = z.infer<typeof agentClientParamsSchema>;

// =============================================================================
// Response Schemas
// =============================================================================

export const agentClientSchema = z.object({
  clientId: z.string(),
  clientName: z.string(),
  assignedAt: z.string(),
});

export const listAgentClientsResponseSchema = z.object({
  data: z.array(agentClientSchema),
});

export const assignAgentClientResponseSchema = z.object({
  agentId: z.string(),
  clientId: z.string(),
  clientName: z.string(),
  assignedAt: z.string(),
});

export type AgentClient = z.infer<typeof agentClientSchema>;
export type ListAgentClientsResponse = z.infer<typeof listAgentClientsResponseSchema>;
export type AssignAgentClientResponse = z.infer<typeof assignAgentClientResponseSchema>;

// =============================================================================
// Available Clients (for assignment)
// =============================================================================

const availableClientsSortBySchema = z.enum(["name", "createdAt"]);
const availableClientsSortOrderSchema = z.enum(["asc", "desc"]);

export const listAvailableClientsQuerySchema = z.object({
  page: coercedInt(1, { min: 1 }),
  limit: coercedInt(20, { min: 1, max: 100 }),
  sortBy: coercedEnum(availableClientsSortBySchema, "name"),
  sortOrder: coercedEnum(availableClientsSortOrderSchema, "asc"),
  search: optionalTrimmedString,
});

export type ListAvailableClientsQuery = z.infer<typeof listAvailableClientsQuerySchema>;

export const availableClientSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const listAvailableClientsResponseSchema = z.object({
  data: z.array(availableClientSchema),
  pagination: paginationSchema,
});

export type AvailableClient = z.infer<typeof availableClientSchema>;
export type ListAvailableClientsResponse = z.infer<typeof listAvailableClientsResponseSchema>;
