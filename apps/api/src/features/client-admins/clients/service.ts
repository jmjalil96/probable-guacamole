import type { Prisma } from "@prisma/client";
import type {
  ListClientAdminClientsResponse,
  AssignClientAdminClientResponse,
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

export interface ListClientAdminClientsParams {
  clientAdminId: string;
  user: { id: string };
  requestId?: string;
}

export interface AssignClientAdminClientParams {
  clientAdminId: string;
  clientId: string;
  user: { id: string };
  requestId?: string;
}

export interface RemoveClientAdminClientParams {
  clientAdminId: string;
  clientId: string;
  user: { id: string };
  requestId?: string;
}

export interface ListAvailableClientsParams {
  clientAdminId: string;
  query: ListAvailableClientsQuery;
  user: { id: string };
  requestId?: string;
}

// =============================================================================
// Validation Helpers
// =============================================================================

async function validateClientAdmin(clientAdminId: string, log: Logger): Promise<void> {
  const clientAdmin = await repo.findClientAdminById(clientAdminId);
  if (!clientAdmin) {
    log.debug({ clientAdminId }, "client admin not found");
    throw AppError.notFound("ClientAdmin");
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
// List ClientAdmin Clients
// =============================================================================

export async function listClientAdminClients(
  params: ListClientAdminClientsParams
): Promise<ListClientAdminClientsResponse> {
  const { clientAdminId, user, requestId } = params;
  const log = logger.child({ module: "client-admins/clients", requestId });

  log.debug({ clientAdminId, userId: user.id }, "list client admin clients started");

  // Validate client admin exists
  await validateClientAdmin(clientAdminId, log);

  const clientAdminClients = await repo.findClientAdminClients(clientAdminId);

  log.debug(
    { clientAdminId, count: clientAdminClients.length },
    "list client admin clients completed"
  );

  return {
    data: clientAdminClients.map((cac) => ({
      clientId: cac.client.id,
      clientName: cac.client.name,
      assignedAt: cac.assignedAt.toISOString(),
    })),
  };
}

// =============================================================================
// List Available Clients (for assignment)
// =============================================================================

export async function listAvailableClients(
  params: ListAvailableClientsParams
): Promise<ListAvailableClientsResponse> {
  const { clientAdminId, query, user, requestId } = params;
  const log = logger.child({ module: "client-admins/clients", requestId });

  log.debug(
    { clientAdminId, userId: user.id, query },
    "list available clients started"
  );

  // Validate client admin exists
  await validateClientAdmin(clientAdminId, log);

  // Build where clause - exclude clients already assigned to this client admin
  const where: Prisma.ClientWhereInput = {
    isActive: true,
    clientAdmins: { none: { clientAdminId } },
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
    { clientAdminId, count: clients.length, total },
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
// Assign ClientAdmin Client
// =============================================================================

export async function assignClientAdminClient(
  params: AssignClientAdminClientParams,
  context: audit.AuditContext
): Promise<AssignClientAdminClientResponse> {
  const { clientAdminId, clientId, user, requestId } = params;
  const log = logger.child({ module: "client-admins/clients", requestId });

  log.debug(
    { clientAdminId, clientId, userId: user.id },
    "assign client admin client started"
  );

  // Validate client admin exists
  await validateClientAdmin(clientAdminId, log);

  // Validate client exists
  await validateClient(clientId, log);

  // Check if already assigned
  const existing = await repo.findClientAdminClient(clientAdminId, clientId);
  if (existing) {
    log.debug({ clientAdminId, clientId }, "client already assigned to client admin");
    throw AppError.conflict("Client already assigned to client admin");
  }

  // Create assignment
  const clientAdminClient = await repo.assignClientAdminClient(clientAdminId, clientId);

  log.info({ clientAdminId, clientId }, "client admin client assigned");

  audit.log(
    {
      action: audit.AuditActions.CREATE,
      resource: "ClientAdminClient",
      resourceId: `${clientAdminId}:${clientId}`,
      metadata: {
        clientAdminId,
        clientId,
        clientName: clientAdminClient.client.name,
      },
    },
    context
  );

  log.debug({ clientAdminId, clientId }, "assign client admin client completed");

  return {
    clientAdminId,
    clientId: clientAdminClient.client.id,
    clientName: clientAdminClient.client.name,
    assignedAt: clientAdminClient.assignedAt.toISOString(),
  };
}

// =============================================================================
// Remove ClientAdmin Client
// =============================================================================

export async function removeClientAdminClient(
  params: RemoveClientAdminClientParams,
  context: audit.AuditContext
): Promise<void> {
  const { clientAdminId, clientId, user, requestId } = params;
  const log = logger.child({ module: "client-admins/clients", requestId });

  log.debug(
    { clientAdminId, clientId, userId: user.id },
    "remove client admin client started"
  );

  // Validate client admin exists
  await validateClientAdmin(clientAdminId, log);

  // Check if assignment exists
  const existing = await repo.findClientAdminClient(clientAdminId, clientId);
  if (!existing) {
    log.debug({ clientAdminId, clientId }, "client admin client not found");
    throw AppError.notFound("ClientAdminClient");
  }

  // Get client name for audit log before deletion
  const client = await repo.findClientById(clientId);

  // Remove assignment
  await repo.removeClientAdminClient(clientAdminId, clientId);

  log.info({ clientAdminId, clientId }, "client admin client removed");

  audit.log(
    {
      action: audit.AuditActions.DELETE,
      resource: "ClientAdminClient",
      resourceId: `${clientAdminId}:${clientId}`,
      metadata: {
        clientAdminId,
        clientId,
        clientName: client?.name,
      },
    },
    context
  );

  log.debug({ clientAdminId, clientId }, "remove client admin client completed");
}
