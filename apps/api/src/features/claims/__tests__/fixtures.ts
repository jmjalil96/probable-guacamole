import type { ClaimStatus, CareType, ScopeType, Prisma } from "@prisma/client";
import { db } from "../../../config/db.js";
import { hashToken } from "../../auth/utils.js";

// =============================================================================
// Counter for unique claim numbers
// =============================================================================

let claimNumberCounter = 1000;

export async function resetClaimNumberCounter() {
  claimNumberCounter = 1000;
  await db.globalCounter.upsert({
    where: { id: "claim_number" },
    create: { id: "claim_number", value: 1000 },
    update: { value: 1000 },
  });
}

// =============================================================================
// Role and Permission Factories
// =============================================================================

export async function seedRoleWithClaimsPermission(
  scopeType: ScopeType = "UNLIMITED",
  name = `claims-role-${Date.now()}`
) {
  const permission = await db.permission.upsert({
    where: { resource_action: { resource: "claims", action: "read" } },
    update: {},
    create: {
      resource: "claims",
      action: "read",
    },
  });

  const role = await db.role.create({
    data: {
      name,
      displayName: "Claims Reader",
      description: "Role with claims:read permission",
      scopeType,
    },
  });

  await db.rolePermission.create({
    data: {
      roleId: role.id,
      permissionId: permission.id,
    },
  });

  return role;
}

export async function seedRoleWithoutPermission(
  scopeType: ScopeType = "SELF",
  name = `no-perm-role-${Date.now()}`
) {
  return db.role.create({
    data: {
      name,
      displayName: "No Permission Role",
      description: "Role without any permissions",
      scopeType,
    },
  });
}

export async function seedRoleWithClaimsCreatePermission(
  scopeType: ScopeType = "UNLIMITED",
  name = `claims-create-role-${Date.now()}`
) {
  const permission = await db.permission.upsert({
    where: { resource_action: { resource: "claims", action: "create" } },
    update: {},
    create: {
      resource: "claims",
      action: "create",
    },
  });

  const role = await db.role.create({
    data: {
      name,
      displayName: "Claims Creator",
      description: "Role with claims:create permission",
      scopeType,
    },
  });

  await db.rolePermission.create({
    data: {
      roleId: role.id,
      permissionId: permission.id,
    },
  });

  return role;
}

export async function seedRoleWithClaimsEditPermission(
  scopeType: ScopeType = "UNLIMITED",
  name = `claims-edit-role-${Date.now()}`
) {
  const permission = await db.permission.upsert({
    where: { resource_action: { resource: "claims", action: "edit" } },
    update: {},
    create: {
      resource: "claims",
      action: "edit",
    },
  });

  const role = await db.role.create({
    data: {
      name,
      displayName: "Claims Editor",
      description: "Role with claims:edit permission",
      scopeType,
    },
  });

  await db.rolePermission.create({
    data: {
      roleId: role.id,
      permissionId: permission.id,
    },
  });

  return role;
}

export async function seedRoleWithClaimsReadAndEditPermission(
  scopeType: ScopeType = "UNLIMITED",
  name = `claims-read-edit-role-${Date.now()}`
) {
  const readPermission = await db.permission.upsert({
    where: { resource_action: { resource: "claims", action: "read" } },
    update: {},
    create: {
      resource: "claims",
      action: "read",
    },
  });

  const editPermission = await db.permission.upsert({
    where: { resource_action: { resource: "claims", action: "edit" } },
    update: {},
    create: {
      resource: "claims",
      action: "edit",
    },
  });

  const role = await db.role.create({
    data: {
      name,
      displayName: "Claims Read/Edit",
      description: "Role with claims:read and claims:edit permissions",
      scopeType,
    },
  });

  await db.rolePermission.createMany({
    data: [
      { roleId: role.id, permissionId: readPermission.id },
      { roleId: role.id, permissionId: editPermission.id },
    ],
  });

  return role;
}

// =============================================================================
// User Factories
// =============================================================================

export async function createTestUser(
  roleId: string,
  options: {
    email?: string;
    isActive?: boolean;
    emailVerifiedAt?: Date | null;
  } = {}
) {
  const {
    email = `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    isActive = true,
    emailVerifiedAt = new Date(),
  } = options;

  return db.user.create({
    data: {
      email,
      passwordHash: "hashed-password",
      roleId,
      isActive,
      emailVerifiedAt,
    },
    include: {
      role: true,
    },
  });
}

// =============================================================================
// Session Factory
// =============================================================================

export async function createTestSession(
  userId: string,
  options: {
    token?: string;
    expiresAt?: Date;
    revokedAt?: Date | null;
  } = {}
) {
  const token =
    options.token ?? `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const tokenHash = hashToken(token);
  const expiresAt = options.expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const revokedAt = options.revokedAt ?? null;

  await db.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      revokedAt,
    },
  });

  return { token };
}

// =============================================================================
// Client Factory
// =============================================================================

export async function createTestClient(name = `Client-${Date.now()}`) {
  return db.client.create({
    data: {
      name,
      isActive: true,
    },
  });
}

// =============================================================================
// Affiliate Factory (used for both affiliate and patient)
// =============================================================================

export async function createTestAffiliate(
  clientId: string,
  options: {
    firstName?: string;
    lastName?: string;
    email?: string | null;
    isActive?: boolean;
    userId?: string | null;
  } = {}
) {
  const {
    firstName = "Test",
    lastName = `Affiliate-${Date.now()}`,
    email = `affiliate-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    isActive = true,
    userId = null,
  } = options;

  return db.affiliate.create({
    data: {
      firstName,
      lastName,
      email,
      isActive,
      userId,
      clientId,
    },
  });
}

// =============================================================================
// Agent Factory (for CLIENT scope testing)
// =============================================================================

export async function createTestAgent(options: {
  firstName?: string;
  lastName?: string;
  email?: string;
  isActive?: boolean;
  userId?: string | null;
  clientIds?: string[];
} = {}) {
  const {
    firstName = "Test",
    lastName = `Agent-${Date.now()}`,
    email = `agent-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    isActive = true,
    userId = null,
    clientIds = [],
  } = options;

  const agent = await db.agent.create({
    data: {
      firstName,
      lastName,
      email,
      isActive,
      userId,
    },
  });

  // Create agent-client relationships
  if (clientIds.length > 0) {
    await db.agentClient.createMany({
      data: clientIds.map((clientId) => ({
        agentId: agent.id,
        clientId,
      })),
    });
  }

  return agent;
}

// =============================================================================
// Employee Factory (for createdBy user profile)
// =============================================================================

export async function createTestEmployee(options: {
  firstName?: string;
  lastName?: string;
  email?: string;
  isActive?: boolean;
  userId?: string | null;
} = {}) {
  const {
    firstName = "Test",
    lastName = `Employee-${Date.now()}`,
    email = `employee-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    isActive = true,
    userId = null,
  } = options;

  return db.employee.create({
    data: {
      firstName,
      lastName,
      email,
      isActive,
      userId,
    },
  });
}

// =============================================================================
// Claim Factory
// =============================================================================

export interface CreateClaimOptions {
  clientId: string;
  affiliateId: string;
  patientId: string;
  createdById: string;
  policyId?: string | null;
  status?: ClaimStatus;
  description?: string;
  careType?: CareType | null;
  diagnosis?: string | null;
  amountSubmitted?: number | null;
  amountApproved?: number | null;
  incidentDate?: Date | null;
  submittedDate?: Date | null;
  settlementDate?: Date | null;
  claimNumber?: number;
}

export async function createTestClaim(options: CreateClaimOptions) {
  const {
    clientId,
    affiliateId,
    patientId,
    createdById,
    policyId = null,
    status = "DRAFT",
    description = `Test claim ${Date.now()}`,
    careType = null,
    diagnosis = null,
    amountSubmitted = null,
    amountApproved = null,
    incidentDate = null,
    submittedDate = null,
    settlementDate = null,
    claimNumber = claimNumberCounter++,
  } = options;

  return db.claim.create({
    data: {
      claimNumber,
      clientId,
      affiliateId,
      patientId,
      createdById,
      policyId,
      status,
      description,
      careType,
      diagnosis,
      amountSubmitted,
      amountApproved,
      incidentDate,
      submittedDate,
      settlementDate,
    },
    include: {
      client: true,
      affiliate: true,
      patient: true,
      createdBy: true,
    },
  });
}

// =============================================================================
// Bulk Claim Factory (for pagination/filtering tests)
// =============================================================================

export async function createTestClaims(
  baseOptions: Omit<CreateClaimOptions, "claimNumber">,
  count: number
) {
  const claims = [];
  for (let i = 0; i < count; i++) {
    claims.push(await createTestClaim(baseOptions));
  }
  return claims;
}

// =============================================================================
// Scope Setup Helpers
// =============================================================================

export async function setupUnlimitedScopeUser() {
  const role = await seedRoleWithClaimsPermission("UNLIMITED");
  const employee = await createTestEmployee();
  const user = await createTestUser(role.id);

  // Link employee to user
  await db.employee.update({
    where: { id: employee.id },
    data: { userId: user.id },
  });

  const { token } = await createTestSession(user.id);

  return { user, role, employee, token };
}

export async function setupClientScopeUser(clientIds: string[]) {
  const role = await seedRoleWithClaimsPermission("CLIENT");
  const agent = await createTestAgent({ clientIds });
  const user = await createTestUser(role.id);

  // Link agent to user
  await db.agent.update({
    where: { id: agent.id },
    data: { userId: user.id },
  });

  const { token } = await createTestSession(user.id);

  return { user, role, agent, token };
}

export async function setupSelfScopeUser(clientId: string) {
  const role = await seedRoleWithClaimsPermission("SELF");
  const user = await createTestUser(role.id);
  const affiliate = await createTestAffiliate(clientId, { userId: user.id });

  const { token } = await createTestSession(user.id);

  return { user, role, affiliate, token };
}

// =============================================================================
// Scope Setup Helpers for Create Permission
// =============================================================================

export async function setupUnlimitedScopeCreateUser() {
  const role = await seedRoleWithClaimsCreatePermission("UNLIMITED");
  const employee = await createTestEmployee();
  const user = await createTestUser(role.id);
  await db.employee.update({
    where: { id: employee.id },
    data: { userId: user.id },
  });
  const { token } = await createTestSession(user.id);
  return { user, role, employee, token };
}

export async function setupClientScopeCreateUser(clientIds: string[]) {
  const role = await seedRoleWithClaimsCreatePermission("CLIENT");
  const agent = await createTestAgent({ clientIds });
  const user = await createTestUser(role.id);
  await db.agent.update({
    where: { id: agent.id },
    data: { userId: user.id },
  });
  const { token } = await createTestSession(user.id);
  return { user, role, agent, token };
}

export async function setupSelfScopeCreateUser(clientId: string) {
  const role = await seedRoleWithClaimsCreatePermission("SELF");
  const user = await createTestUser(role.id);
  const affiliate = await createTestAffiliate(clientId, { userId: user.id });
  const { token } = await createTestSession(user.id);
  return { user, role, affiliate, token };
}

// =============================================================================
// Scope Setup Helpers for Edit Permission
// =============================================================================

export async function setupUnlimitedScopeEditUser() {
  const role = await seedRoleWithClaimsEditPermission("UNLIMITED");
  const employee = await createTestEmployee();
  const user = await createTestUser(role.id);
  await db.employee.update({
    where: { id: employee.id },
    data: { userId: user.id },
  });
  const { token } = await createTestSession(user.id);
  return { user, role, employee, token };
}

export async function setupClientScopeEditUser(clientIds: string[]) {
  const role = await seedRoleWithClaimsEditPermission("CLIENT");
  const agent = await createTestAgent({ clientIds });
  const user = await createTestUser(role.id);
  await db.agent.update({
    where: { id: agent.id },
    data: { userId: user.id },
  });
  const { token } = await createTestSession(user.id);
  return { user, role, agent, token };
}

export async function setupSelfScopeEditUser(clientId: string) {
  const role = await seedRoleWithClaimsEditPermission("SELF");
  const user = await createTestUser(role.id);
  const affiliate = await createTestAffiliate(clientId, { userId: user.id });
  const { token } = await createTestSession(user.id);
  return { user, role, affiliate, token };
}

// =============================================================================
// Dependent Factory
// =============================================================================

export async function createTestDependent(
  clientId: string,
  primaryAffiliateId: string,
  options: { firstName?: string; lastName?: string } = {}
) {
  return db.affiliate.create({
    data: {
      firstName: options.firstName ?? "Dependent",
      lastName: options.lastName ?? `Test-${Date.now()}`,
      email: `dependent-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      isActive: true,
      clientId,
      primaryAffiliateId,
    },
  });
}

// =============================================================================
// PendingUpload Factory
// =============================================================================

export async function createTestPendingUpload(
  userId: string,
  options: {
    entityType?: string | null;
    category?: string | null;
    expiresAt?: Date;
    fileName?: string;
    fileSize?: number;
    contentType?: string;
  } = {}
) {
  const {
    entityType = "Claim",
    category = null,
    expiresAt = new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    fileName = `test-file-${Date.now()}.pdf`,
    fileSize = 1024,
    contentType = "application/pdf",
  } = options;

  const id = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return db.pendingUpload.create({
    data: {
      id,
      userId,
      sessionKey: `session-${Date.now()}`,
      fileKey: `uploads/${id}`,
      fileName,
      fileSize,
      contentType,
      entityType,
      category,
      expiresAt,
    },
  });
}

// =============================================================================
// ClaimInvoice Factory
// =============================================================================

export interface CreateClaimInvoiceOptions {
  claimId: string;
  createdById: string;
  invoiceNumber?: string;
  providerName?: string;
  amountSubmitted?: number;
}

export async function createTestClaimInvoice(options: CreateClaimInvoiceOptions) {
  const {
    claimId,
    createdById,
    invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    providerName = `Provider ${Date.now()}`,
    amountSubmitted = 500.0,
  } = options;

  return db.claimInvoice.create({
    data: {
      claimId,
      invoiceNumber,
      providerName,
      amountSubmitted,
      createdById,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          employee: { select: { firstName: true, lastName: true } },
          agent: { select: { firstName: true, lastName: true } },
          clientAdmin: { select: { firstName: true, lastName: true } },
          affiliate: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });
}

// =============================================================================
// ClaimFile Factory
// =============================================================================

export interface CreateClaimFileOptions {
  claimId: string;
  createdById: string;
  fileName?: string;
  fileSize?: number;
  contentType?: string;
  category?: string | null;
  status?: "PENDING" | "READY" | "FAILED";
}

export async function createTestClaimFile(options: CreateClaimFileOptions) {
  const {
    claimId,
    createdById,
    fileName = `test-file-${Date.now()}.pdf`,
    fileSize = 1024,
    contentType = "application/pdf",
    category = null,
    status = "READY",
  } = options;

  const id = `file-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return db.file.create({
    data: {
      id,
      entityType: "Claim",
      entityId: claimId,
      fileKey: `files/${id}`,
      fileName,
      fileSize,
      contentType,
      category,
      status,
      createdById,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          employee: { select: { firstName: true, lastName: true } },
          agent: { select: { firstName: true, lastName: true } },
          clientAdmin: { select: { firstName: true, lastName: true } },
          affiliate: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });
}

// =============================================================================
// AuditLog Factory
// =============================================================================

export interface CreateAuditLogOptions {
  resource?: string;
  resourceId: string;
  action?: string;
  severity?: "INFO" | "WARNING" | "CRITICAL";
  userId?: string | null;
  oldValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt?: Date;
}

export async function createTestAuditLog(options: CreateAuditLogOptions) {
  return db.auditLog.create({
    data: {
      resource: options.resource ?? "Claim",
      resourceId: options.resourceId,
      action: options.action ?? "UPDATE",
      severity: options.severity ?? "INFO",
      userId: options.userId ?? null,
      ...(options.oldValue !== undefined && { oldValue: options.oldValue }),
      ...(options.newValue !== undefined && { newValue: options.newValue }),
      ...(options.metadata !== undefined && { metadata: options.metadata }),
      ipAddress: options.ipAddress ?? null,
      userAgent: options.userAgent ?? null,
      createdAt: options.createdAt ?? new Date(),
    },
  });
}

// =============================================================================
// ClaimHistory Factory
// =============================================================================

export interface CreateClaimHistoryOptions {
  claimId: string;
  createdById: string;
  fromStatus?: ClaimStatus | null;
  toStatus: ClaimStatus;
  reason?: string | null;
  notes?: string | null;
  createdAt?: Date;
}

export async function createTestClaimHistory(options: CreateClaimHistoryOptions) {
  return db.claimHistory.create({
    data: {
      claimId: options.claimId,
      fromStatus: options.fromStatus ?? null,
      toStatus: options.toStatus,
      reason: options.reason ?? null,
      notes: options.notes ?? null,
      createdById: options.createdById,
      createdAt: options.createdAt ?? new Date(),
    },
  });
}

// =============================================================================
// Test Constants
// =============================================================================

export const SESSION_COOKIE_NAME = "sid";
