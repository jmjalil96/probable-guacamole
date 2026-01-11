import type { Prisma } from "@prisma/client";
import type {
  ListAgentsQuery,
  ListAgentsResponse,
  Agent,
  CreateAgentRequest,
  UpdateAgentRequest,
} from "shared";
import { logger } from "../../lib/logger.js";
import { AppError } from "../../lib/errors.js";
import * as audit from "../../services/audit/audit.js";
import * as repo from "./repository.js";
import { mapAgentToResponse } from "./utils.js";

// =============================================================================
// Types
// =============================================================================

export interface ListAgentsParams {
  query: ListAgentsQuery;
  user: { id: string };
  requestId?: string;
}

export interface GetAgentParams {
  agentId: string;
  user: { id: string };
  requestId?: string;
}

export interface CreateAgentParams {
  request: CreateAgentRequest;
  user: { id: string };
  requestId?: string;
}

export interface UpdateAgentParams {
  agentId: string;
  updates: UpdateAgentRequest;
  user: { id: string };
  requestId?: string;
}

export interface DeleteAgentParams {
  agentId: string;
  user: { id: string };
  requestId?: string;
}

// =============================================================================
// Constants
// =============================================================================

const ORDER_BY_MAP: Record<string, string> = {
  firstName: "firstName",
  lastName: "lastName",
  email: "email",
  agencyName: "agencyName",
  createdAt: "createdAt",
};

// =============================================================================
// Where Clause Building
// =============================================================================

function buildWhereClause(query: ListAgentsQuery): Prisma.AgentWhereInput {
  const where: Prisma.AgentWhereInput = {
    isActive: query.isActive,
  };

  // Add search filter (firstName, lastName, email, agencyName)
  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: "insensitive" } },
      { lastName: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { agencyName: { contains: query.search, mode: "insensitive" } },
    ];
  }

  // Add hasAccount filter
  if (query.hasAccount !== undefined) {
    where.userId = query.hasAccount ? { not: null } : null;
  }

  return where;
}

// =============================================================================
// List Agents
// =============================================================================

export async function listAgents(
  params: ListAgentsParams
): Promise<ListAgentsResponse> {
  const { query, user, requestId } = params;
  const log = logger.child({ module: "agents", requestId });

  log.debug({ userId: user.id }, "list agents started");

  const where = buildWhereClause(query);
  const orderBy = [
    { [ORDER_BY_MAP[query.sortBy] ?? "lastName"]: query.sortOrder },
    { id: "asc" as const },
  ];

  const [agents, total] = await Promise.all([
    repo.findAgents({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy,
    }),
    repo.countAgents(where),
  ]);

  log.debug({ count: agents.length, total }, "list agents completed");

  return {
    data: agents.map(mapAgentToResponse),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

// =============================================================================
// Get Agent
// =============================================================================

export async function getAgent(
  params: GetAgentParams,
  context: audit.AuditContext
): Promise<Agent> {
  const { agentId, user, requestId } = params;
  const log = logger.child({ module: "agents", requestId });

  log.debug({ agentId, userId: user.id }, "get agent started");

  const agent = await repo.findAgentById(agentId);

  if (!agent) {
    log.debug({ agentId }, "agent not found");
    throw AppError.notFound("Agent");
  }

  audit.log(
    {
      action: audit.AuditActions.READ,
      resource: "Agent",
      resourceId: agent.id,
    },
    context
  );

  log.debug({ agentId }, "get agent completed");

  return mapAgentToResponse(agent);
}

// =============================================================================
// Create Agent
// =============================================================================

export interface CreateAgentResult {
  id: string;
}

export async function createAgent(
  params: CreateAgentParams,
  context: audit.AuditContext
): Promise<CreateAgentResult> {
  const { request, user, requestId } = params;
  const log = logger.child({ module: "agents", requestId });

  log.debug({ email: request.email, userId: user.id }, "create agent started");

  // Check email uniqueness (case-insensitive)
  const existingByEmail = await repo.findAgentByEmail(request.email);
  if (existingByEmail) {
    log.debug({ email: request.email }, "agent email already exists");
    throw AppError.conflict("Agent with this email already exists");
  }

  // Create agent
  const agent = await repo.createAgent({
    firstName: request.firstName,
    lastName: request.lastName,
    email: request.email,
    phone: request.phone && request.phone !== "" ? request.phone : null,
    licenseNumber:
      request.licenseNumber && request.licenseNumber !== ""
        ? request.licenseNumber
        : null,
    agencyName:
      request.agencyName && request.agencyName !== "" ? request.agencyName : null,
  });

  log.info({ agentId: agent.id, email: agent.email }, "agent created");

  audit.log(
    {
      action: audit.AuditActions.CREATE,
      resource: "Agent",
      resourceId: agent.id,
      metadata: {
        email: agent.email,
        firstName: agent.firstName,
        lastName: agent.lastName,
      },
    },
    context
  );

  log.debug({ agentId: agent.id }, "create agent completed");

  return { id: agent.id };
}

// =============================================================================
// Update Agent
// =============================================================================

export async function updateAgent(
  params: UpdateAgentParams,
  context: audit.AuditContext
): Promise<Agent> {
  const { agentId, updates, user, requestId } = params;
  const log = logger.child({ module: "agents", requestId });

  log.debug({ agentId, userId: user.id }, "update agent started");

  // Fetch existing
  const existing = await repo.findAgentById(agentId);
  if (!existing) {
    log.debug({ agentId }, "agent not found");
    throw AppError.notFound("Agent");
  }

  // Check email uniqueness if changed
  if (
    updates.email !== undefined &&
    updates.email.toLowerCase() !== existing.email.toLowerCase()
  ) {
    const existingByEmail = await repo.findAgentByEmail(updates.email);
    if (existingByEmail) {
      log.debug({ email: updates.email }, "agent email already exists");
      throw AppError.conflict("Agent with this email already exists");
    }
  }

  // Build update data
  const updateData: Record<string, unknown> = {};
  const updatedFields: string[] = [];

  if (updates.firstName !== undefined) {
    updateData.firstName = updates.firstName;
    updatedFields.push("firstName");
  }
  if (updates.lastName !== undefined) {
    updateData.lastName = updates.lastName;
    updatedFields.push("lastName");
  }
  if (updates.email !== undefined) {
    updateData.email = updates.email;
    updatedFields.push("email");
  }
  if (updates.phone !== undefined) {
    updateData.phone = updates.phone === "" ? null : updates.phone;
    updatedFields.push("phone");
  }
  if (updates.licenseNumber !== undefined) {
    updateData.licenseNumber =
      updates.licenseNumber === "" ? null : updates.licenseNumber;
    updatedFields.push("licenseNumber");
  }
  if (updates.agencyName !== undefined) {
    updateData.agencyName =
      updates.agencyName === "" ? null : updates.agencyName;
    updatedFields.push("agencyName");
  }
  if (updates.isActive !== undefined) {
    updateData.isActive = updates.isActive;
    updatedFields.push("isActive");
  }

  // Check for empty update
  if (updatedFields.length === 0) {
    log.debug({ agentId }, "no fields to update");
    return mapAgentToResponse(existing);
  }

  // Update agent
  const updated = await repo.updateAgent(agentId, updateData);

  log.info({ agentId, fields: updatedFields }, "agent updated");

  // Extract old/new values for audit
  const extractFields = (record: Record<string, unknown>, fields: string[]) =>
    Object.fromEntries(fields.map((f) => [f, record[f]]));

  audit.log(
    {
      action: audit.AuditActions.UPDATE,
      resource: "Agent",
      resourceId: agentId,
      oldValue: extractFields(
        existing as unknown as Record<string, unknown>,
        updatedFields
      ),
      newValue: extractFields(
        updated as unknown as Record<string, unknown>,
        updatedFields
      ),
      metadata: { updatedFields },
    },
    context
  );

  log.debug({ agentId }, "update agent completed");

  return mapAgentToResponse(updated);
}

// =============================================================================
// Delete Agent
// =============================================================================

export async function deleteAgent(
  params: DeleteAgentParams,
  context: audit.AuditContext
): Promise<void> {
  const { agentId, user, requestId } = params;
  const log = logger.child({ module: "agents", requestId });

  log.debug({ agentId, userId: user.id }, "delete agent started");

  // Fetch existing
  const existing = await repo.findAgentById(agentId);
  if (!existing) {
    log.debug({ agentId }, "agent not found");
    throw AppError.notFound("Agent");
  }

  // Check for related invitations
  const invitationCount = await repo.countAgentInvitations(agentId);
  if (invitationCount > 0) {
    log.debug({ agentId, invitationCount }, "agent has related invitations");
    throw AppError.conflict(
      `Cannot delete agent with ${invitationCount} related invitations`
    );
  }

  // Delete agent (AgentClient records will cascade delete)
  await repo.deleteAgent(agentId);

  log.info({ agentId, email: existing.email }, "agent deleted");

  audit.log(
    {
      action: audit.AuditActions.DELETE,
      resource: "Agent",
      resourceId: agentId,
      metadata: {
        email: existing.email,
        firstName: existing.firstName,
        lastName: existing.lastName,
      },
    },
    context
  );

  log.debug({ agentId }, "delete agent completed");
}
