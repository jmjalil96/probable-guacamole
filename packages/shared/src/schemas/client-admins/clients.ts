import { z } from "zod";

// =============================================================================
// Params Schemas
// =============================================================================

export const clientAdminClientsListParamsSchema = z.object({
  clientAdminId: z.string().min(1),
});

export const clientAdminClientParamsSchema = z.object({
  clientAdminId: z.string().min(1),
  clientId: z.string().min(1),
});

export type ClientAdminClientsListParams = z.infer<typeof clientAdminClientsListParamsSchema>;
export type ClientAdminClientParams = z.infer<typeof clientAdminClientParamsSchema>;

// =============================================================================
// Response Schemas
// =============================================================================

export const clientAdminClientSchema = z.object({
  clientId: z.string(),
  clientName: z.string(),
  assignedAt: z.string(),
});

export const listClientAdminClientsResponseSchema = z.object({
  data: z.array(clientAdminClientSchema),
});

export const assignClientAdminClientResponseSchema = z.object({
  clientAdminId: z.string(),
  clientId: z.string(),
  clientName: z.string(),
  assignedAt: z.string(),
});

export type ClientAdminClient = z.infer<typeof clientAdminClientSchema>;
export type ListClientAdminClientsResponse = z.infer<typeof listClientAdminClientsResponseSchema>;
export type AssignClientAdminClientResponse = z.infer<typeof assignClientAdminClientResponseSchema>;

// =============================================================================
// Re-export Available Clients schemas (shared with agents)
// =============================================================================

export {
  listAvailableClientsQuerySchema,
  listAvailableClientsResponseSchema,
  availableClientSchema,
  type ListAvailableClientsQuery,
  type ListAvailableClientsResponse,
  type AvailableClient,
} from "../agents/clients.js";
