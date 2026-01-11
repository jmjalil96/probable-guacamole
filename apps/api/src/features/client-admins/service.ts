import type { Prisma } from "@prisma/client";
import type {
  ListClientAdminsQuery,
  ListClientAdminsResponse,
  ClientAdmin,
  CreateClientAdminRequest,
  UpdateClientAdminRequest,
} from "shared";
import { logger } from "../../lib/logger.js";
import { AppError } from "../../lib/errors.js";
import * as audit from "../../services/audit/audit.js";
import * as repo from "./repository.js";
import { mapClientAdminToResponse } from "./utils.js";

// =============================================================================
// Types
// =============================================================================

export interface ListClientAdminsParams {
  query: ListClientAdminsQuery;
  user: { id: string };
  requestId?: string;
}

export interface GetClientAdminParams {
  clientAdminId: string;
  user: { id: string };
  requestId?: string;
}

export interface CreateClientAdminParams {
  request: CreateClientAdminRequest;
  user: { id: string };
  requestId?: string;
}

export interface UpdateClientAdminParams {
  clientAdminId: string;
  updates: UpdateClientAdminRequest;
  user: { id: string };
  requestId?: string;
}

export interface DeleteClientAdminParams {
  clientAdminId: string;
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
  jobTitle: "jobTitle",
  createdAt: "createdAt",
};

// =============================================================================
// Where Clause Building
// =============================================================================

function buildWhereClause(query: ListClientAdminsQuery): Prisma.ClientAdminWhereInput {
  const where: Prisma.ClientAdminWhereInput = {
    isActive: query.isActive,
  };

  // Add search filter (firstName, lastName, email, jobTitle)
  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: "insensitive" } },
      { lastName: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { jobTitle: { contains: query.search, mode: "insensitive" } },
    ];
  }

  // Add hasAccount filter
  if (query.hasAccount !== undefined) {
    where.userId = query.hasAccount ? { not: null } : null;
  }

  return where;
}

// =============================================================================
// List ClientAdmins
// =============================================================================

export async function listClientAdmins(
  params: ListClientAdminsParams
): Promise<ListClientAdminsResponse> {
  const { query, user, requestId } = params;
  const log = logger.child({ module: "client-admins", requestId });

  log.debug({ userId: user.id }, "list client admins started");

  const where = buildWhereClause(query);
  const orderBy = [
    { [ORDER_BY_MAP[query.sortBy] ?? "lastName"]: query.sortOrder },
    { id: "asc" as const },
  ];

  const [clientAdmins, total] = await Promise.all([
    repo.findClientAdmins({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy,
    }),
    repo.countClientAdmins(where),
  ]);

  log.debug({ count: clientAdmins.length, total }, "list client admins completed");

  return {
    data: clientAdmins.map(mapClientAdminToResponse),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

// =============================================================================
// Get ClientAdmin
// =============================================================================

export async function getClientAdmin(
  params: GetClientAdminParams,
  context: audit.AuditContext
): Promise<ClientAdmin> {
  const { clientAdminId, user, requestId } = params;
  const log = logger.child({ module: "client-admins", requestId });

  log.debug({ clientAdminId, userId: user.id }, "get client admin started");

  const clientAdmin = await repo.findClientAdminById(clientAdminId);

  if (!clientAdmin) {
    log.debug({ clientAdminId }, "client admin not found");
    throw AppError.notFound("ClientAdmin");
  }

  audit.log(
    {
      action: audit.AuditActions.READ,
      resource: "ClientAdmin",
      resourceId: clientAdmin.id,
    },
    context
  );

  log.debug({ clientAdminId }, "get client admin completed");

  return mapClientAdminToResponse(clientAdmin);
}

// =============================================================================
// Create ClientAdmin
// =============================================================================

export interface CreateClientAdminResult {
  id: string;
}

export async function createClientAdmin(
  params: CreateClientAdminParams,
  context: audit.AuditContext
): Promise<CreateClientAdminResult> {
  const { request, user, requestId } = params;
  const log = logger.child({ module: "client-admins", requestId });

  log.debug({ email: request.email, userId: user.id }, "create client admin started");

  // Check email uniqueness (case-insensitive)
  const existingByEmail = await repo.findClientAdminByEmail(request.email);
  if (existingByEmail) {
    log.debug({ email: request.email }, "client admin email already exists");
    throw AppError.conflict("ClientAdmin with this email already exists");
  }

  // Create client admin
  const clientAdmin = await repo.createClientAdmin({
    firstName: request.firstName,
    lastName: request.lastName,
    email: request.email,
    phone: request.phone && request.phone !== "" ? request.phone : null,
    jobTitle:
      request.jobTitle && request.jobTitle !== ""
        ? request.jobTitle
        : null,
  });

  log.info({ clientAdminId: clientAdmin.id, email: clientAdmin.email }, "client admin created");

  audit.log(
    {
      action: audit.AuditActions.CREATE,
      resource: "ClientAdmin",
      resourceId: clientAdmin.id,
      metadata: {
        email: clientAdmin.email,
        firstName: clientAdmin.firstName,
        lastName: clientAdmin.lastName,
      },
    },
    context
  );

  log.debug({ clientAdminId: clientAdmin.id }, "create client admin completed");

  return { id: clientAdmin.id };
}

// =============================================================================
// Update ClientAdmin
// =============================================================================

export async function updateClientAdmin(
  params: UpdateClientAdminParams,
  context: audit.AuditContext
): Promise<ClientAdmin> {
  const { clientAdminId, updates, user, requestId } = params;
  const log = logger.child({ module: "client-admins", requestId });

  log.debug({ clientAdminId, userId: user.id }, "update client admin started");

  // Fetch existing
  const existing = await repo.findClientAdminById(clientAdminId);
  if (!existing) {
    log.debug({ clientAdminId }, "client admin not found");
    throw AppError.notFound("ClientAdmin");
  }

  // Check email uniqueness if changed
  if (
    updates.email !== undefined &&
    updates.email.toLowerCase() !== existing.email.toLowerCase()
  ) {
    const existingByEmail = await repo.findClientAdminByEmail(updates.email);
    if (existingByEmail) {
      log.debug({ email: updates.email }, "client admin email already exists");
      throw AppError.conflict("ClientAdmin with this email already exists");
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
  if (updates.jobTitle !== undefined) {
    updateData.jobTitle =
      updates.jobTitle === "" ? null : updates.jobTitle;
    updatedFields.push("jobTitle");
  }
  if (updates.isActive !== undefined) {
    updateData.isActive = updates.isActive;
    updatedFields.push("isActive");
  }

  // Check for empty update
  if (updatedFields.length === 0) {
    log.debug({ clientAdminId }, "no fields to update");
    return mapClientAdminToResponse(existing);
  }

  // Update client admin
  const updated = await repo.updateClientAdmin(clientAdminId, updateData);

  log.info({ clientAdminId, fields: updatedFields }, "client admin updated");

  // Extract old/new values for audit
  const extractFields = (record: Record<string, unknown>, fields: string[]) =>
    Object.fromEntries(fields.map((f) => [f, record[f]]));

  audit.log(
    {
      action: audit.AuditActions.UPDATE,
      resource: "ClientAdmin",
      resourceId: clientAdminId,
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

  log.debug({ clientAdminId }, "update client admin completed");

  return mapClientAdminToResponse(updated);
}

// =============================================================================
// Delete ClientAdmin
// =============================================================================

export async function deleteClientAdmin(
  params: DeleteClientAdminParams,
  context: audit.AuditContext
): Promise<void> {
  const { clientAdminId, user, requestId } = params;
  const log = logger.child({ module: "client-admins", requestId });

  log.debug({ clientAdminId, userId: user.id }, "delete client admin started");

  // Fetch existing
  const existing = await repo.findClientAdminById(clientAdminId);
  if (!existing) {
    log.debug({ clientAdminId }, "client admin not found");
    throw AppError.notFound("ClientAdmin");
  }

  // Check for related invitations
  const invitationCount = await repo.countClientAdminInvitations(clientAdminId);
  if (invitationCount > 0) {
    log.debug({ clientAdminId, invitationCount }, "client admin has related invitations");
    throw AppError.conflict(
      `Cannot delete client admin with ${invitationCount} related invitations`
    );
  }

  // Delete client admin (ClientAdminClient records will cascade delete)
  await repo.deleteClientAdmin(clientAdminId);

  log.info({ clientAdminId, email: existing.email }, "client admin deleted");

  audit.log(
    {
      action: audit.AuditActions.DELETE,
      resource: "ClientAdmin",
      resourceId: clientAdminId,
      metadata: {
        email: existing.email,
        firstName: existing.firstName,
        lastName: existing.lastName,
      },
    },
    context
  );

  log.debug({ clientAdminId }, "delete client admin completed");
}
