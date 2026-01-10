import type { Prisma } from "@prisma/client";
import type {
  ListInsurersQuery,
  ListInsurersResponse,
  Insurer,
  CreateInsurerRequest,
  UpdateInsurerRequest,
} from "shared";
import { logger } from "../../lib/logger.js";
import { AppError } from "../../lib/errors.js";
import * as audit from "../../services/audit/audit.js";
import * as repo from "./repository.js";
import { mapInsurerToResponse } from "./utils.js";

// =============================================================================
// Types
// =============================================================================

export interface ListInsurersParams {
  query: ListInsurersQuery;
  user: { id: string };
  requestId?: string;
}

export interface GetInsurerParams {
  insurerId: string;
  user: { id: string };
  requestId?: string;
}

export interface CreateInsurerParams {
  request: CreateInsurerRequest;
  user: { id: string };
  requestId?: string;
}

export interface UpdateInsurerParams {
  insurerId: string;
  updates: UpdateInsurerRequest;
  user: { id: string };
  requestId?: string;
}

export interface DeleteInsurerParams {
  insurerId: string;
  user: { id: string };
  requestId?: string;
}

// =============================================================================
// Constants
// =============================================================================

const ORDER_BY_MAP: Record<string, string> = {
  name: "name",
  code: "code",
  type: "type",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
};

// =============================================================================
// Where Clause Building
// =============================================================================

function buildWhereClause(query: ListInsurersQuery): Prisma.InsurerWhereInput {
  const where: Prisma.InsurerWhereInput = {
    isActive: query.isActive,
  };

  // Add type filter
  if (query.type) {
    where.type = query.type;
  }

  // Add search filter
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { code: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return where;
}

// =============================================================================
// List Insurers
// =============================================================================

export async function listInsurers(
  params: ListInsurersParams
): Promise<ListInsurersResponse> {
  const { query, user, requestId } = params;
  const log = logger.child({ module: "insurers", requestId });

  log.debug({ userId: user.id }, "list insurers started");

  const where = buildWhereClause(query);
  const orderBy = [
    { [ORDER_BY_MAP[query.sortBy] ?? "name"]: query.sortOrder },
    { id: "asc" as const },
  ];

  const [insurers, total] = await Promise.all([
    repo.findInsurers({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy,
    }),
    repo.countInsurers(where),
  ]);

  log.debug({ count: insurers.length, total }, "list insurers completed");

  return {
    data: insurers.map(mapInsurerToResponse),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

// =============================================================================
// Get Insurer
// =============================================================================

export async function getInsurer(
  params: GetInsurerParams,
  context: audit.AuditContext
): Promise<Insurer> {
  const { insurerId, user, requestId } = params;
  const log = logger.child({ module: "insurers", requestId });

  log.debug({ insurerId, userId: user.id }, "get insurer started");

  const insurer = await repo.findInsurerById(insurerId);

  if (!insurer) {
    log.debug({ insurerId }, "insurer not found");
    throw AppError.notFound("Insurer");
  }

  audit.log(
    {
      action: audit.AuditActions.READ,
      resource: "Insurer",
      resourceId: insurer.id,
    },
    context
  );

  log.debug({ insurerId }, "get insurer completed");

  return mapInsurerToResponse(insurer);
}

// =============================================================================
// Create Insurer
// =============================================================================

export interface CreateInsurerResult {
  id: string;
}

export async function createInsurer(
  params: CreateInsurerParams,
  context: audit.AuditContext
): Promise<CreateInsurerResult> {
  const { request, user, requestId } = params;
  const log = logger.child({ module: "insurers", requestId });

  log.debug({ name: request.name, userId: user.id }, "create insurer started");

  // Check name uniqueness
  const existingByName = await repo.findInsurerByName(request.name);
  if (existingByName) {
    log.debug({ name: request.name }, "insurer name already exists");
    throw AppError.conflict("Insurer with this name already exists");
  }

  // Check code uniqueness if provided
  if (request.code) {
    const existingByCode = await repo.findInsurerByCode(request.code);
    if (existingByCode) {
      log.debug({ code: request.code }, "insurer code already exists");
      throw AppError.conflict("Insurer with this code already exists");
    }
  }

  // Create insurer
  const insurer = await repo.createInsurer({
    name: request.name,
    code: request.code ?? null,
    email: request.email && request.email !== "" ? request.email : null,
    phone: request.phone ?? null,
    website: request.website && request.website !== "" ? request.website : null,
    type: request.type,
  });

  log.info({ insurerId: insurer.id, name: insurer.name }, "insurer created");

  audit.log(
    {
      action: audit.AuditActions.CREATE,
      resource: "Insurer",
      resourceId: insurer.id,
      metadata: { name: insurer.name, type: insurer.type },
    },
    context
  );

  log.debug({ insurerId: insurer.id }, "create insurer completed");

  return { id: insurer.id };
}

// =============================================================================
// Update Insurer
// =============================================================================

export async function updateInsurer(
  params: UpdateInsurerParams,
  context: audit.AuditContext
): Promise<Insurer> {
  const { insurerId, updates, user, requestId } = params;
  const log = logger.child({ module: "insurers", requestId });

  log.debug({ insurerId, userId: user.id }, "update insurer started");

  // Fetch existing
  const existing = await repo.findInsurerById(insurerId);
  if (!existing) {
    log.debug({ insurerId }, "insurer not found");
    throw AppError.notFound("Insurer");
  }

  // Check name uniqueness if changed
  if (updates.name !== undefined && updates.name !== existing.name) {
    const existingByName = await repo.findInsurerByName(updates.name);
    if (existingByName) {
      log.debug({ name: updates.name }, "insurer name already exists");
      throw AppError.conflict("Insurer with this name already exists");
    }
  }

  // Check code uniqueness if changed
  if (updates.code !== undefined && updates.code !== existing.code) {
    if (updates.code !== null) {
      const existingByCode = await repo.findInsurerByCode(updates.code);
      if (existingByCode) {
        log.debug({ code: updates.code }, "insurer code already exists");
        throw AppError.conflict("Insurer with this code already exists");
      }
    }
  }

  // Build update data
  const updateData: Record<string, unknown> = {};
  const updatedFields: string[] = [];

  if (updates.name !== undefined) {
    updateData.name = updates.name;
    updatedFields.push("name");
  }
  if (updates.code !== undefined) {
    updateData.code = updates.code;
    updatedFields.push("code");
  }
  if (updates.email !== undefined) {
    updateData.email = updates.email === "" ? null : updates.email;
    updatedFields.push("email");
  }
  if (updates.phone !== undefined) {
    updateData.phone = updates.phone;
    updatedFields.push("phone");
  }
  if (updates.website !== undefined) {
    updateData.website = updates.website === "" ? null : updates.website;
    updatedFields.push("website");
  }
  if (updates.type !== undefined) {
    updateData.type = updates.type;
    updatedFields.push("type");
  }
  if (updates.isActive !== undefined) {
    updateData.isActive = updates.isActive;
    updatedFields.push("isActive");
  }

  // Check for empty update
  if (updatedFields.length === 0) {
    log.debug({ insurerId }, "no fields to update");
    return mapInsurerToResponse(existing);
  }

  // Update insurer
  const updated = await repo.updateInsurer(insurerId, updateData);

  log.info({ insurerId, fields: updatedFields }, "insurer updated");

  // Extract old/new values for audit
  const extractFields = (record: Record<string, unknown>, fields: string[]) =>
    Object.fromEntries(fields.map((f) => [f, record[f]]));

  audit.log(
    {
      action: audit.AuditActions.UPDATE,
      resource: "Insurer",
      resourceId: insurerId,
      oldValue: extractFields(existing as unknown as Record<string, unknown>, updatedFields),
      newValue: extractFields(updated as unknown as Record<string, unknown>, updatedFields),
      metadata: { updatedFields },
    },
    context
  );

  log.debug({ insurerId }, "update insurer completed");

  return mapInsurerToResponse(updated);
}

// =============================================================================
// Delete Insurer
// =============================================================================

export async function deleteInsurer(
  params: DeleteInsurerParams,
  context: audit.AuditContext
): Promise<void> {
  const { insurerId, user, requestId } = params;
  const log = logger.child({ module: "insurers", requestId });

  log.debug({ insurerId, userId: user.id }, "delete insurer started");

  // Fetch existing
  const existing = await repo.findInsurerById(insurerId);
  if (!existing) {
    log.debug({ insurerId }, "insurer not found");
    throw AppError.notFound("Insurer");
  }

  // Check for related policies
  const policyCount = await repo.countInsurerPolicies(insurerId);
  if (policyCount > 0) {
    log.debug({ insurerId, policyCount }, "insurer has related policies");
    throw AppError.conflict(
      `Cannot delete insurer with ${policyCount} related policies`
    );
  }

  // Delete insurer
  await repo.deleteInsurer(insurerId);

  log.info({ insurerId, name: existing.name }, "insurer deleted");

  audit.log(
    {
      action: audit.AuditActions.DELETE,
      resource: "Insurer",
      resourceId: insurerId,
      metadata: { name: existing.name, type: existing.type },
    },
    context
  );

  log.debug({ insurerId }, "delete insurer completed");
}
