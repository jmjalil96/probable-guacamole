import type { Prisma } from "@prisma/client";
import type {
  ListClientsQuery,
  ListClientsResponse,
  Client,
  CreateClientRequest,
  UpdateClientRequest,
} from "shared";
import { logger } from "../../lib/logger.js";
import { AppError } from "../../lib/errors.js";
import * as audit from "../../services/audit/audit.js";
import * as repo from "./repository.js";
import { mapClientToResponse } from "./utils.js";

// =============================================================================
// Types
// =============================================================================

export interface ListClientsParams {
  query: ListClientsQuery;
  user: { id: string };
  requestId?: string;
}

export interface GetClientParams {
  clientId: string;
  user: { id: string };
  requestId?: string;
}

export interface CreateClientParams {
  request: CreateClientRequest;
  user: { id: string };
  requestId?: string;
}

export interface UpdateClientParams {
  clientId: string;
  updates: UpdateClientRequest;
  user: { id: string };
  requestId?: string;
}

export interface DeleteClientParams {
  clientId: string;
  user: { id: string };
  requestId?: string;
}

// =============================================================================
// Constants
// =============================================================================

const ORDER_BY_MAP: Record<string, string> = {
  name: "name",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
};

// =============================================================================
// Where Clause Building
// =============================================================================

function buildWhereClause(query: ListClientsQuery): Prisma.ClientWhereInput {
  const where: Prisma.ClientWhereInput = {
    isActive: query.isActive,
  };

  // Add search filter
  if (query.search) {
    where.name = { contains: query.search, mode: "insensitive" };
  }

  return where;
}

// =============================================================================
// List Clients
// =============================================================================

export async function listClients(
  params: ListClientsParams
): Promise<ListClientsResponse> {
  const { query, user, requestId } = params;
  const log = logger.child({ module: "clients", requestId });

  log.debug({ userId: user.id }, "list clients started");

  const where = buildWhereClause(query);
  const orderBy = [
    { [ORDER_BY_MAP[query.sortBy] ?? "name"]: query.sortOrder },
    { id: "asc" as const },
  ];

  const [clients, total] = await Promise.all([
    repo.findClients({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy,
    }),
    repo.countClients(where),
  ]);

  log.debug({ count: clients.length, total }, "list clients completed");

  return {
    data: clients.map(mapClientToResponse),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

// =============================================================================
// Get Client
// =============================================================================

export async function getClient(
  params: GetClientParams,
  context: audit.AuditContext
): Promise<Client> {
  const { clientId, user, requestId } = params;
  const log = logger.child({ module: "clients", requestId });

  log.debug({ clientId, userId: user.id }, "get client started");

  const client = await repo.findClientById(clientId);

  if (!client) {
    log.debug({ clientId }, "client not found");
    throw AppError.notFound("Client");
  }

  audit.log(
    {
      action: audit.AuditActions.READ,
      resource: "Client",
      resourceId: client.id,
    },
    context
  );

  log.debug({ clientId }, "get client completed");

  return mapClientToResponse(client);
}

// =============================================================================
// Create Client
// =============================================================================

export interface CreateClientResult {
  id: string;
}

export async function createClient(
  params: CreateClientParams,
  context: audit.AuditContext
): Promise<CreateClientResult> {
  const { request, user, requestId } = params;
  const log = logger.child({ module: "clients", requestId });

  log.debug({ name: request.name, userId: user.id }, "create client started");

  // Check name uniqueness
  const existingByName = await repo.findClientByName(request.name);
  if (existingByName) {
    log.debug({ name: request.name }, "client name already exists");
    throw AppError.conflict("Client with this name already exists");
  }

  // Create client
  const client = await repo.createClient({
    name: request.name,
  });

  log.info({ clientId: client.id, name: client.name }, "client created");

  audit.log(
    {
      action: audit.AuditActions.CREATE,
      resource: "Client",
      resourceId: client.id,
      metadata: { name: client.name },
    },
    context
  );

  log.debug({ clientId: client.id }, "create client completed");

  return { id: client.id };
}

// =============================================================================
// Update Client
// =============================================================================

export async function updateClient(
  params: UpdateClientParams,
  context: audit.AuditContext
): Promise<Client> {
  const { clientId, updates, user, requestId } = params;
  const log = logger.child({ module: "clients", requestId });

  log.debug({ clientId, userId: user.id }, "update client started");

  // Fetch existing
  const existing = await repo.findClientById(clientId);
  if (!existing) {
    log.debug({ clientId }, "client not found");
    throw AppError.notFound("Client");
  }

  // Check name uniqueness if changed
  if (updates.name !== undefined && updates.name !== existing.name) {
    const existingByName = await repo.findClientByName(updates.name);
    if (existingByName) {
      log.debug({ name: updates.name }, "client name already exists");
      throw AppError.conflict("Client with this name already exists");
    }
  }

  // Build update data
  const updateData: Record<string, unknown> = {};
  const updatedFields: string[] = [];

  if (updates.name !== undefined) {
    updateData.name = updates.name;
    updatedFields.push("name");
  }
  if (updates.isActive !== undefined) {
    updateData.isActive = updates.isActive;
    updatedFields.push("isActive");
  }

  // Check for empty update
  if (updatedFields.length === 0) {
    log.debug({ clientId }, "no fields to update");
    return mapClientToResponse(existing);
  }

  // Update client
  const updated = await repo.updateClient(clientId, updateData);

  log.info({ clientId, fields: updatedFields }, "client updated");

  // Extract old/new values for audit
  const extractFields = (record: Record<string, unknown>, fields: string[]) =>
    Object.fromEntries(fields.map((f) => [f, record[f]]));

  audit.log(
    {
      action: audit.AuditActions.UPDATE,
      resource: "Client",
      resourceId: clientId,
      oldValue: extractFields(existing as unknown as Record<string, unknown>, updatedFields),
      newValue: extractFields(updated as unknown as Record<string, unknown>, updatedFields),
      metadata: { updatedFields },
    },
    context
  );

  log.debug({ clientId }, "update client completed");

  return mapClientToResponse(updated);
}

// =============================================================================
// Delete Client
// =============================================================================

export async function deleteClient(
  params: DeleteClientParams,
  context: audit.AuditContext
): Promise<void> {
  const { clientId, user, requestId } = params;
  const log = logger.child({ module: "clients", requestId });

  log.debug({ clientId, userId: user.id }, "delete client started");

  // Fetch existing
  const existing = await repo.findClientById(clientId);
  if (!existing) {
    log.debug({ clientId }, "client not found");
    throw AppError.notFound("Client");
  }

  // Check for related entities
  const [affiliateCount, claimCount, policyCount] = await Promise.all([
    repo.countClientAffiliates(clientId),
    repo.countClientClaims(clientId),
    repo.countClientPolicies(clientId),
  ]);

  if (affiliateCount > 0) {
    log.debug({ clientId, affiliateCount }, "client has related affiliates");
    throw AppError.conflict(
      `Cannot delete client with ${affiliateCount} related affiliates`
    );
  }

  if (claimCount > 0) {
    log.debug({ clientId, claimCount }, "client has related claims");
    throw AppError.conflict(
      `Cannot delete client with ${claimCount} related claims`
    );
  }

  if (policyCount > 0) {
    log.debug({ clientId, policyCount }, "client has related policies");
    throw AppError.conflict(
      `Cannot delete client with ${policyCount} related policies`
    );
  }

  // Delete client
  await repo.deleteClient(clientId);

  log.info({ clientId, name: existing.name }, "client deleted");

  audit.log(
    {
      action: audit.AuditActions.DELETE,
      resource: "Client",
      resourceId: clientId,
      metadata: { name: existing.name },
    },
    context
  );

  log.debug({ clientId }, "delete client completed");
}
