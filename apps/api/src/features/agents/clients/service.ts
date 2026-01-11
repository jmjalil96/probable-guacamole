import type { Prisma } from "@prisma/client";
import type {
  ListAgentClientsResponse,
  AssignAgentClientResponse,
  ListAvailableClientsQuery,
  ListAvailableClientsResponse,
} from "shared";
import type { Logger } from "pino";
import { logger } from "../../../lib/logger.js";
import { AppError } from "../../../lib/errors.js";
import * as audit from "../../../services/audit/audit.js";
import * as repo from "./repository.js";

// =============================================================================
// Types
// =============================================================================

export interface ListAgentClientsParams {
  agentId: string;
  user: { id: string };
  requestId?: string;
}

export interface AssignAgentClientParams {
  agentId: string;
  clientId: string;
  user: { id: string };
  requestId?: string;
}

export interface RemoveAgentClientParams {
  agentId: string;
  clientId: string;
  user: { id: string };
  requestId?: string;
}

export interface ListAvailableClientsParams {
  agentId: string;
  query: ListAvailableClientsQuery;
  user: { id: string };
  requestId?: string;
}

// =============================================================================
// Validation Helpers
// =============================================================================

async function validateAgent(agentId: string, log: Logger): Promise<void> {
  const agent = await repo.findAgentById(agentId);
  if (!agent) {
    log.debug({ agentId }, "agent not found");
    throw AppError.notFound("Agent");
  }
}

async function validateClient(
  clientId: string,
  log: Logger
): Promise<{ id: string; name: string }> {
  const client = await repo.findClientById(clientId);
  if (!client) {
    log.debug({ clientId }, "client not found");
    throw AppError.notFound("Client");
  }
  return client;
}

// =============================================================================
// List Agent Clients
// =============================================================================

export async function listAgentClients(
  params: ListAgentClientsParams
): Promise<ListAgentClientsResponse> {
  const { agentId, user, requestId } = params;
  const log = logger.child({ module: "agents/clients", requestId });

  log.debug({ agentId, userId: user.id }, "list agent clients started");

  // Validate agent exists
  await validateAgent(agentId, log);

  const agentClients = await repo.findAgentClients(agentId);

  log.debug(
    { agentId, count: agentClients.length },
    "list agent clients completed"
  );

  return {
    data: agentClients.map((ac) => ({
      clientId: ac.client.id,
      clientName: ac.client.name,
      assignedAt: ac.assignedAt.toISOString(),
    })),
  };
}

// =============================================================================
// List Available Clients (for assignment)
// =============================================================================

export async function listAvailableClients(
  params: ListAvailableClientsParams
): Promise<ListAvailableClientsResponse> {
  const { agentId, query, user, requestId } = params;
  const log = logger.child({ module: "agents/clients", requestId });

  log.debug(
    { agentId, userId: user.id, query },
    "list available clients started"
  );

  // Validate agent exists
  await validateAgent(agentId, log);

  // Build where clause - exclude clients already assigned to this agent
  const where: Prisma.ClientWhereInput = {
    isActive: true,
    agents: { none: { agentId } },
  };

  // Add search filter
  if (query.search) {
    where.name = { contains: query.search, mode: "insensitive" };
  }

  // Build order by
  const orderBy: Prisma.ClientOrderByWithRelationInput =
    query.sortBy === "createdAt"
      ? { createdAt: query.sortOrder }
      : { name: query.sortOrder };

  // Get total count and clients
  const [total, clients] = await Promise.all([
    repo.countAvailableClients(where),
    repo.findAvailableClients({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy,
    }),
  ]);

  const totalPages = Math.ceil(total / query.limit);

  log.debug(
    { agentId, count: clients.length, total },
    "list available clients completed"
  );

  return {
    data: clients.map((c) => ({
      id: c.id,
      name: c.name,
    })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
    },
  };
}

// =============================================================================
// Assign Agent Client
// =============================================================================

export async function assignAgentClient(
  params: AssignAgentClientParams,
  context: audit.AuditContext
): Promise<AssignAgentClientResponse> {
  const { agentId, clientId, user, requestId } = params;
  const log = logger.child({ module: "agents/clients", requestId });

  log.debug(
    { agentId, clientId, userId: user.id },
    "assign agent client started"
  );

  // Validate agent exists
  await validateAgent(agentId, log);

  // Validate client exists
  await validateClient(clientId, log);

  // Check if already assigned
  const existing = await repo.findAgentClient(agentId, clientId);
  if (existing) {
    log.debug({ agentId, clientId }, "client already assigned to agent");
    throw AppError.conflict("Client already assigned to agent");
  }

  // Create assignment
  const agentClient = await repo.assignAgentClient(agentId, clientId);

  log.info({ agentId, clientId }, "agent client assigned");

  audit.log(
    {
      action: audit.AuditActions.CREATE,
      resource: "AgentClient",
      resourceId: `${agentId}:${clientId}`,
      metadata: {
        agentId,
        clientId,
        clientName: agentClient.client.name,
      },
    },
    context
  );

  log.debug({ agentId, clientId }, "assign agent client completed");

  return {
    agentId,
    clientId: agentClient.client.id,
    clientName: agentClient.client.name,
    assignedAt: agentClient.assignedAt.toISOString(),
  };
}

// =============================================================================
// Remove Agent Client
// =============================================================================

export async function removeAgentClient(
  params: RemoveAgentClientParams,
  context: audit.AuditContext
): Promise<void> {
  const { agentId, clientId, user, requestId } = params;
  const log = logger.child({ module: "agents/clients", requestId });

  log.debug(
    { agentId, clientId, userId: user.id },
    "remove agent client started"
  );

  // Validate agent exists
  await validateAgent(agentId, log);

  // Check if assignment exists
  const existing = await repo.findAgentClient(agentId, clientId);
  if (!existing) {
    log.debug({ agentId, clientId }, "agent client not found");
    throw AppError.notFound("AgentClient");
  }

  // Get client name for audit log before deletion
  const client = await repo.findClientById(clientId);

  // Remove assignment
  await repo.removeAgentClient(agentId, clientId);

  log.info({ agentId, clientId }, "agent client removed");

  audit.log(
    {
      action: audit.AuditActions.DELETE,
      resource: "AgentClient",
      resourceId: `${agentId}:${clientId}`,
      metadata: {
        agentId,
        clientId,
        clientName: client?.name,
      },
    },
    context
  );

  log.debug({ agentId, clientId }, "remove agent client completed");
}
