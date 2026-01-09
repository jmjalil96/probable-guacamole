import * as argon2 from "argon2";
import { db } from "../src/config/db.js";
import { hashToken } from "../src/features/auth/utils.js";

// =============================================================================
// Constants
// =============================================================================

const TEST_PASSWORD = "TestPassword123!";

// Plain tokens for testing (these get hashed before storage)
const SESSION_TOKENS = {
  admin: "session-token-admin-seed",
  employee1: "session-token-employee1-seed",
  employee2: "session-token-employee2-seed",
  agent1: "session-token-agent1-seed",
  agent2: "session-token-agent2-seed",
  clientAdmin: "session-token-clientadmin-seed",
  affiliate1: "session-token-affiliate1-seed",
  affiliate2: "session-token-affiliate2-seed",
  expired: "session-token-expired-seed",
  revoked: "session-token-revoked-seed",
};

const INVITATION_TOKEN = "invitation-token-pending-seed";
const PASSWORD_RESET_TOKEN = "password-reset-token-seed";
const PASSWORD_RESET_TOKEN_EXPIRED = "password-reset-token-expired-seed";

// =============================================================================
// Main Seed Function
// =============================================================================

async function seed() {
  console.log("Clearing existing data...");

  // Clear all data in reverse FK order
  await db.$transaction([
    db.auditLog.deleteMany(),
    db.note.deleteMany(),
    db.file.deleteMany(),
    db.pendingUpload.deleteMany(),
    db.documentAccess.deleteMany(),
    db.document.deleteMany(),
    db.ticketMessage.deleteMany(),
    db.ticket.deleteMany(),
    db.invoiceDiscrepancyCause.deleteMany(),
    db.invoicePolicy.deleteMany(),
    db.invoiceHistory.deleteMany(),
    db.invoice.deleteMany(),
    db.enrollmentDependent.deleteMany(),
    db.policyEnrollment.deleteMany(),
    db.policyHistory.deleteMany(),
    db.policy.deleteMany(),
    db.claimHistory.deleteMany(),
    db.claimInvoice.deleteMany(),
    db.claim.deleteMany(),
    db.invitation.deleteMany(),
    db.clientAdminClient.deleteMany(),
    db.agentClient.deleteMany(),
    db.affiliate.deleteMany(),
    db.clientAdmin.deleteMany(),
    db.agent.deleteMany(),
    db.employee.deleteMany(),
    db.insurer.deleteMany(),
    db.client.deleteMany(),
    db.session.deleteMany(),
    db.verificationToken.deleteMany(),
    db.user.deleteMany(),
    db.rolePermission.deleteMany(),
    db.permission.deleteMany(),
    db.role.deleteMany(),
    db.globalCounter.deleteMany(),
  ]);

  console.log("Data cleared. Starting seed...");

  // Hash password once for all users
  const passwordHash = await argon2.hash(TEST_PASSWORD, { type: argon2.argon2id });

  // =========================================================================
  // Phase 1: RBAC Foundation
  // =========================================================================
  console.log("Phase 1: Creating roles and permissions...");

  // Create all permissions
  const permissionDefs = [
    { resource: "users", action: "read" },
    { resource: "users", action: "create" },
    { resource: "users", action: "edit" },
    { resource: "users", action: "delete" },
    { resource: "users", action: "invite" },
    { resource: "claims", action: "read" },
    { resource: "claims", action: "create" },
    { resource: "claims", action: "edit" },
    { resource: "claims", action: "delete" },
    { resource: "policies", action: "read" },
    { resource: "policies", action: "create" },
    { resource: "policies", action: "edit" },
    { resource: "invoices", action: "read" },
    { resource: "invoices", action: "create" },
    { resource: "invoices", action: "edit" },
    { resource: "invoices", action: "reconcile" },
    { resource: "tickets", action: "read" },
    { resource: "tickets", action: "create" },
    { resource: "tickets", action: "edit" },
    { resource: "tickets", action: "close" },
    { resource: "documents", action: "read" },
    { resource: "documents", action: "create" },
    { resource: "documents", action: "edit" },
    { resource: "audit", action: "read" },
  ];

  const permissions: Record<string, { id: string }> = {};
  for (const { resource, action } of permissionDefs) {
    const perm = await db.permission.create({
      data: { resource, action },
    });
    permissions[`${resource}:${action}`] = perm;
  }

  // Create roles
  const roles = {
    superAdmin: await db.role.create({
      data: {
        name: "super_admin",
        displayName: "Super Admin",
        description: "Full system access with all permissions",
        scopeType: "UNLIMITED",
        isPortalRole: false,
      },
    }),
    employee: await db.role.create({
      data: {
        name: "employee",
        displayName: "Employee",
        description: "Internal staff with operational access",
        scopeType: "UNLIMITED",
        isPortalRole: false,
      },
    }),
    agent: await db.role.create({
      data: {
        name: "agent",
        displayName: "Agent",
        description: "External insurance broker with client-scoped access",
        scopeType: "CLIENT",
        isPortalRole: true,
      },
    }),
    clientAdmin: await db.role.create({
      data: {
        name: "client_admin",
        displayName: "Client Admin",
        description: "Client HR administrator with limited access",
        scopeType: "CLIENT",
        isPortalRole: true,
      },
    }),
    affiliate: await db.role.create({
      data: {
        name: "affiliate",
        displayName: "Affiliate",
        description: "Policy holder with self-scoped access",
        scopeType: "SELF",
        isPortalRole: true,
      },
    }),
    readonly: await db.role.create({
      data: {
        name: "readonly",
        displayName: "Read Only",
        description: "View-only access for auditing",
        scopeType: "SELF",
        isPortalRole: true,
      },
    }),
  };

  // Assign permissions to roles
  // super_admin: ALL permissions
  await db.rolePermission.createMany({
    data: Object.values(permissions).map((p) => ({
      roleId: roles.superAdmin.id,
      permissionId: p.id,
    })),
  });

  // employee: claims:*, policies:read, invoices:*, tickets:*, documents:*, audit:read
  const employeePerms = [
    "claims:read", "claims:create", "claims:edit", "claims:delete",
    "policies:read",
    "invoices:read", "invoices:create", "invoices:edit", "invoices:reconcile",
    "tickets:read", "tickets:create", "tickets:edit", "tickets:close",
    "documents:read", "documents:create", "documents:edit",
    "audit:read",
  ];
  await db.rolePermission.createMany({
    data: employeePerms.map((p) => ({
      roleId: roles.employee.id,
      permissionId: permissions[p].id,
    })),
  });

  // agent: claims:read+create, policies:read, tickets:read+create
  const agentPerms = ["claims:read", "claims:create", "policies:read", "tickets:read", "tickets:create"];
  await db.rolePermission.createMany({
    data: agentPerms.map((p) => ({
      roleId: roles.agent.id,
      permissionId: permissions[p].id,
    })),
  });

  // client_admin: claims:read, policies:read, tickets:read+create, documents:read
  const clientAdminPerms = ["claims:read", "policies:read", "tickets:read", "tickets:create", "documents:read"];
  await db.rolePermission.createMany({
    data: clientAdminPerms.map((p) => ({
      roleId: roles.clientAdmin.id,
      permissionId: permissions[p].id,
    })),
  });

  // affiliate: claims:read+create
  const affiliatePerms = ["claims:read", "claims:create"];
  await db.rolePermission.createMany({
    data: affiliatePerms.map((p) => ({
      roleId: roles.affiliate.id,
      permissionId: permissions[p].id,
    })),
  });

  // readonly: claims:read, policies:read
  const readonlyPerms = ["claims:read", "policies:read"];
  await db.rolePermission.createMany({
    data: readonlyPerms.map((p) => ({
      roleId: roles.readonly.id,
      permissionId: permissions[p].id,
    })),
  });

  // =========================================================================
  // Phase 2: Users
  // =========================================================================
  console.log("Phase 2: Creating users...");

  const users = {
    admin: await db.user.create({
      data: {
        email: "admin@example.com",
        passwordHash,
        roleId: roles.superAdmin.id,
        isActive: true,
        emailVerifiedAt: new Date(),
      },
    }),
    employee1: await db.user.create({
      data: {
        email: "employee1@example.com",
        passwordHash,
        roleId: roles.employee.id,
        isActive: true,
        emailVerifiedAt: new Date(),
      },
    }),
    employee2: await db.user.create({
      data: {
        email: "employee2@example.com",
        passwordHash,
        roleId: roles.employee.id,
        isActive: true,
        emailVerifiedAt: new Date(),
      },
    }),
    agent1: await db.user.create({
      data: {
        email: "agent1@example.com",
        passwordHash,
        roleId: roles.agent.id,
        isActive: true,
        emailVerifiedAt: new Date(),
      },
    }),
    agent2: await db.user.create({
      data: {
        email: "agent2@example.com",
        passwordHash,
        roleId: roles.agent.id,
        isActive: true,
        emailVerifiedAt: new Date(),
      },
    }),
    clientAdmin: await db.user.create({
      data: {
        email: "clientadmin@example.com",
        passwordHash,
        roleId: roles.clientAdmin.id,
        isActive: true,
        emailVerifiedAt: new Date(),
      },
    }),
    affiliate1: await db.user.create({
      data: {
        email: "affiliate1@example.com",
        passwordHash,
        roleId: roles.affiliate.id,
        isActive: true,
        emailVerifiedAt: new Date(),
      },
    }),
    affiliate2: await db.user.create({
      data: {
        email: "affiliate2@example.com",
        passwordHash,
        roleId: roles.affiliate.id,
        isActive: true,
        emailVerifiedAt: new Date(),
      },
    }),
    locked: await db.user.create({
      data: {
        email: "locked@example.com",
        passwordHash,
        roleId: roles.employee.id,
        isActive: true,
        emailVerifiedAt: new Date(),
        lockedAt: new Date(),
        failedLoginAttempts: 5,
      },
    }),
    unverified: await db.user.create({
      data: {
        email: "unverified@example.com",
        passwordHash,
        roleId: roles.affiliate.id,
        isActive: true,
        emailVerifiedAt: null,
      },
    }),
  };

  // =========================================================================
  // Phase 2.2: Sessions
  // =========================================================================
  console.log("Phase 2.2: Creating sessions...");

  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Active sessions for active users
  for (const [key, user] of Object.entries(users)) {
    if (key !== "locked" && key !== "unverified") {
      const tokenKey = key as keyof typeof SESSION_TOKENS;
      if (SESSION_TOKENS[tokenKey]) {
        await db.session.create({
          data: {
            userId: user.id,
            tokenHash: hashToken(SESSION_TOKENS[tokenKey]),
            expiresAt: thirtyDaysFromNow,
            ipAddress: "127.0.0.1",
            userAgent: "Seed Script/1.0",
          },
        });
      }
    }
  }

  // Expired session (for testing)
  await db.session.create({
    data: {
      userId: users.admin.id,
      tokenHash: hashToken(SESSION_TOKENS.expired),
      expiresAt: oneDayAgo,
      ipAddress: "127.0.0.1",
      userAgent: "Seed Script/1.0 (Expired)",
    },
  });

  // Revoked session (for testing)
  await db.session.create({
    data: {
      userId: users.admin.id,
      tokenHash: hashToken(SESSION_TOKENS.revoked),
      expiresAt: thirtyDaysFromNow,
      revokedAt: new Date(),
      ipAddress: "127.0.0.1",
      userAgent: "Seed Script/1.0 (Revoked)",
    },
  });

  // =========================================================================
  // Phase 2.3: Verification Tokens
  // =========================================================================
  console.log("Phase 2.3: Creating verification tokens...");

  // Email verification for unverified user
  await db.verificationToken.create({
    data: {
      userId: users.unverified.id,
      tokenHash: hashToken("email-verify-token-seed"),
      type: "EMAIL_VERIFICATION",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  // Valid password reset token
  await db.verificationToken.create({
    data: {
      userId: users.admin.id,
      tokenHash: hashToken(PASSWORD_RESET_TOKEN),
      type: "PASSWORD_RESET",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  // Expired password reset token
  await db.verificationToken.create({
    data: {
      userId: users.employee1.id,
      tokenHash: hashToken(PASSWORD_RESET_TOKEN_EXPIRED),
      type: "PASSWORD_RESET",
      expiresAt: oneDayAgo,
    },
  });

  // Magic link token
  await db.verificationToken.create({
    data: {
      userId: users.affiliate1.id,
      tokenHash: hashToken("magic-link-token-seed"),
      type: "MAGIC_LINK",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    },
  });

  // =========================================================================
  // Phase 3: Business Entities
  // =========================================================================
  console.log("Phase 3: Creating clients and insurers...");

  const clients = {
    acme: await db.client.create({
      data: {
        name: "Acme Corporation",
        isActive: true,
      },
    }),
    beta: await db.client.create({
      data: {
        name: "Beta Industries",
        isActive: true,
      },
    }),
    inactive: await db.client.create({
      data: {
        name: "Inactive Corp",
        isActive: false,
      },
    }),
  };

  const insurers = {
    healthFirst: await db.insurer.create({
      data: {
        name: "HealthFirst Insurance",
        code: "HFI",
        email: "contact@healthfirst.com",
        phone: "+1-800-555-0100",
        website: "https://healthfirst.example.com",
        type: "MEDICINA_PREPAGADA",
        isActive: true,
      },
    }),
    safeGuard: await db.insurer.create({
      data: {
        name: "SafeGuard Life",
        code: "SGL",
        email: "support@safeguard.com",
        phone: "+1-800-555-0200",
        website: "https://safeguard.example.com",
        type: "COMPANIA_DE_SEGUROS",
        isActive: true,
      },
    }),
  };

  // =========================================================================
  // Phase 4: Profile Entities
  // =========================================================================
  console.log("Phase 4: Creating profiles...");

  // Employees
  const employees = {
    john: await db.employee.create({
      data: {
        firstName: "John",
        lastName: "Admin",
        email: "admin@example.com",
        phone: "+1-555-0001",
        department: "Administration",
        userId: users.admin.id,
        isActive: true,
      },
    }),
    jane: await db.employee.create({
      data: {
        firstName: "Jane",
        lastName: "Employee",
        email: "employee1@example.com",
        phone: "+1-555-0002",
        department: "Claims",
        userId: users.employee1.id,
        isActive: true,
      },
    }),
    bob: await db.employee.create({
      data: {
        firstName: "Bob",
        lastName: "Staff",
        email: "employee2@example.com",
        phone: "+1-555-0003",
        department: "Support",
        userId: users.employee2.id,
        isActive: true,
      },
    }),
  };

  // Agents
  const agents = {
    alice: await db.agent.create({
      data: {
        firstName: "Alice",
        lastName: "Agent",
        email: "agent1@example.com",
        phone: "+1-555-0010",
        licenseNumber: "LIC001",
        agencyName: "Premier Agency",
        userId: users.agent1.id,
        isActive: true,
      },
    }),
    charlie: await db.agent.create({
      data: {
        firstName: "Charlie",
        lastName: "Broker",
        email: "agent2@example.com",
        phone: "+1-555-0011",
        licenseNumber: "LIC002",
        agencyName: "Elite Brokers",
        userId: users.agent2.id,
        isActive: true,
      },
    }),
  };

  // Agent-Client assignments
  await db.agentClient.createMany({
    data: [
      { agentId: agents.alice.id, clientId: clients.acme.id },
      { agentId: agents.alice.id, clientId: clients.beta.id },
      { agentId: agents.charlie.id, clientId: clients.beta.id },
    ],
  });

  // Client Admins
  const clientAdmins = {
    diana: await db.clientAdmin.create({
      data: {
        firstName: "Diana",
        lastName: "HR",
        email: "clientadmin@example.com",
        phone: "+1-555-0020",
        jobTitle: "HR Director",
        userId: users.clientAdmin.id,
        isActive: true,
      },
    }),
  };

  // ClientAdmin-Client assignment
  await db.clientAdminClient.create({
    data: {
      clientAdminId: clientAdmins.diana.id,
      clientId: clients.acme.id,
    },
  });

  // Affiliates (primaries first, then dependents)
  const affiliates = {
    eduardo: await db.affiliate.create({
      data: {
        firstName: "Eduardo",
        lastName: "Holder",
        documentType: "CC",
        documentNumber: "12345678",
        email: "affiliate1@example.com",
        phone: "+1-555-0030",
        dateOfBirth: new Date("1985-03-15"),
        gender: "MALE",
        maritalStatus: "MARRIED",
        clientId: clients.acme.id,
        userId: users.affiliate1.id,
        isActive: true,
      },
    }),
    gabriel: await db.affiliate.create({
      data: {
        firstName: "Gabriel",
        lastName: "Holder",
        documentType: "CC",
        documentNumber: "56789012",
        email: "gabriel@example.com",
        phone: "+1-555-0034",
        dateOfBirth: new Date("1975-12-01"),
        gender: "MALE",
        maritalStatus: "MARRIED",
        clientId: clients.acme.id,
        isActive: true,
      },
    }),
    fernanda: await db.affiliate.create({
      data: {
        firstName: "Fernanda",
        lastName: "Member",
        documentType: "CC",
        documentNumber: "45678901",
        email: "affiliate2@example.com",
        phone: "+1-555-0033",
        dateOfBirth: new Date("1990-05-10"),
        gender: "FEMALE",
        maritalStatus: "SINGLE",
        clientId: clients.beta.id,
        userId: users.affiliate2.id,
        isActive: true,
      },
    }),
  };

  // Dependents (after primaries exist)
  const dependents = {
    maria: await db.affiliate.create({
      data: {
        firstName: "Maria",
        lastName: "Spouse",
        documentType: "CC",
        documentNumber: "23456789",
        email: "maria@example.com",
        phone: "+1-555-0031",
        dateOfBirth: new Date("1988-07-22"),
        gender: "FEMALE",
        maritalStatus: "MARRIED",
        relationship: "SPOUSE",
        primaryAffiliateId: affiliates.eduardo.id,
        clientId: clients.acme.id,
        isActive: true,
      },
    }),
    carlos: await db.affiliate.create({
      data: {
        firstName: "Carlos",
        lastName: "Child",
        documentType: "TI",
        documentNumber: "34567890",
        email: null,
        phone: null,
        dateOfBirth: new Date("2015-11-08"),
        gender: "MALE",
        maritalStatus: "SINGLE",
        relationship: "CHILD",
        primaryAffiliateId: affiliates.eduardo.id,
        clientId: clients.acme.id,
        isActive: true,
      },
    }),
    helena: await db.affiliate.create({
      data: {
        firstName: "Helena",
        lastName: "Sibling",
        documentType: "CC",
        documentNumber: "67890123",
        email: "helena@example.com",
        phone: "+1-555-0035",
        dateOfBirth: new Date("1977-08-25"),
        gender: "FEMALE",
        maritalStatus: "SINGLE",
        relationship: "SIBLING",
        primaryAffiliateId: affiliates.gabriel.id,
        clientId: clients.acme.id,
        isActive: true,
      },
    }),
  };

  // =========================================================================
  // Phase 5: Policies & Enrollments
  // =========================================================================
  console.log("Phase 5: Creating policies and enrollments...");

  const policies = {
    health2024: await db.policy.create({
      data: {
        policyNumber: "POL-2024-001",
        clientId: clients.acme.id,
        insurerId: insurers.healthFirst.id,
        type: "HEALTH",
        status: "ACTIVE",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        ambulatoryCoinsurancePct: 20.0,
        hospitalaryCoinsurancePct: 10.0,
        tPremium: 500.0,
        tplus1Premium: 750.0,
        tplusfPremium: 1200.0,
        benefitsCostPerPerson: 150.0,
      },
    }),
    life2024: await db.policy.create({
      data: {
        policyNumber: "POL-2024-002",
        clientId: clients.acme.id,
        insurerId: insurers.safeGuard.id,
        type: "LIFE",
        status: "ACTIVE",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        ambulatoryCoinsurancePct: 0,
        hospitalaryCoinsurancePct: 0,
        tPremium: 200.0,
        tplus1Premium: 300.0,
        tplusfPremium: 500.0,
        benefitsCostPerPerson: 50.0,
      },
    }),
    healthBeta: await db.policy.create({
      data: {
        policyNumber: "POL-2024-003",
        clientId: clients.beta.id,
        insurerId: insurers.healthFirst.id,
        type: "HEALTH",
        status: "PENDING",
        startDate: new Date("2024-06-01"),
        endDate: new Date("2025-05-31"),
        ambulatoryCoinsurancePct: 15.0,
        hospitalaryCoinsurancePct: 5.0,
        tPremium: 450.0,
        tplus1Premium: 675.0,
        tplusfPremium: 1100.0,
        benefitsCostPerPerson: 125.0,
      },
    }),
    expired2023: await db.policy.create({
      data: {
        policyNumber: "POL-2023-001",
        clientId: clients.acme.id,
        insurerId: insurers.safeGuard.id,
        type: "ACCIDENTS",
        status: "EXPIRED",
        startDate: new Date("2023-01-01"),
        endDate: new Date("2023-12-31"),
        ambulatoryCoinsurancePct: 25.0,
        hospitalaryCoinsurancePct: 15.0,
        tPremium: 150.0,
        tplus1Premium: 225.0,
        tplusfPremium: 350.0,
        benefitsCostPerPerson: 75.0,
      },
    }),
  };

  // Policy history for each policy
  await db.policyHistory.createMany({
    data: [
      { policyId: policies.health2024.id, fromStatus: null, toStatus: "PENDING", createdById: users.admin.id },
      { policyId: policies.health2024.id, fromStatus: "PENDING", toStatus: "ACTIVE", createdById: users.admin.id },
      { policyId: policies.life2024.id, fromStatus: null, toStatus: "PENDING", createdById: users.admin.id },
      { policyId: policies.life2024.id, fromStatus: "PENDING", toStatus: "ACTIVE", createdById: users.admin.id },
      { policyId: policies.healthBeta.id, fromStatus: null, toStatus: "PENDING", createdById: users.admin.id },
      { policyId: policies.expired2023.id, fromStatus: null, toStatus: "PENDING", createdById: users.admin.id },
      { policyId: policies.expired2023.id, fromStatus: "PENDING", toStatus: "ACTIVE", createdById: users.admin.id },
      { policyId: policies.expired2023.id, fromStatus: "ACTIVE", toStatus: "EXPIRED", createdById: users.admin.id },
    ],
  });

  // Policy enrollments
  const enrollments = {
    eduardoHealth: await db.policyEnrollment.create({
      data: {
        policyId: policies.health2024.id,
        affiliateId: affiliates.eduardo.id,
        coverageType: "FAMILY",
        startDate: new Date("2024-01-01"),
        startReason: "NEW_HIRE",
      },
    }),
    gabrielHealth: await db.policyEnrollment.create({
      data: {
        policyId: policies.health2024.id,
        affiliateId: affiliates.gabriel.id,
        coverageType: "INDIVIDUAL",
        startDate: new Date("2024-03-01"),
        startReason: "OPEN_ENROLLMENT",
      },
    }),
    eduardoLife: await db.policyEnrollment.create({
      data: {
        policyId: policies.life2024.id,
        affiliateId: affiliates.eduardo.id,
        coverageType: "INDIVIDUAL",
        startDate: new Date("2024-01-01"),
        startReason: "NEW_HIRE",
      },
    }),
    fernandaHealth: await db.policyEnrollment.create({
      data: {
        policyId: policies.healthBeta.id,
        affiliateId: affiliates.fernanda.id,
        coverageType: "INDIVIDUAL",
        startDate: new Date("2024-06-01"),
        startReason: "NEW_HIRE",
      },
    }),
  };

  // Enrollment dependents (Eduardo's family enrollment)
  await db.enrollmentDependent.createMany({
    data: [
      { enrollmentId: enrollments.eduardoHealth.id, dependentId: dependents.maria.id, addedAt: new Date("2024-01-01") },
      { enrollmentId: enrollments.eduardoHealth.id, dependentId: dependents.carlos.id, addedAt: new Date("2024-01-01") },
    ],
  });

  // =========================================================================
  // Phase 6: Claims (All Status States)
  // =========================================================================
  console.log("Phase 6: Creating claims...");

  const claims = {
    draft: await db.claim.create({
      data: {
        claimNumber: 1001,
        affiliateId: affiliates.eduardo.id,
        patientId: affiliates.eduardo.id,
        clientId: clients.acme.id,
        policyId: policies.health2024.id,
        status: "DRAFT",
        description: "Routine checkup and blood work",
        careType: "AMBULATORY",
        createdById: users.affiliate1.id,
      },
    }),
    inReview: await db.claim.create({
      data: {
        claimNumber: 1002,
        affiliateId: affiliates.eduardo.id,
        patientId: dependents.maria.id,
        clientId: clients.acme.id,
        policyId: policies.health2024.id,
        status: "IN_REVIEW",
        description: "Emergency room visit for chest pain",
        careType: "HOSPITALARY",
        diagnosis: "Acute bronchitis",
        amountSubmitted: 2850.0,
        incidentDate: new Date("2024-10-15"),
        createdById: users.affiliate1.id,
        updatedById: users.employee1.id,
      },
    }),
    submitted: await db.claim.create({
      data: {
        claimNumber: 1003,
        affiliateId: affiliates.eduardo.id,
        patientId: dependents.carlos.id,
        clientId: clients.acme.id,
        policyId: policies.health2024.id,
        status: "SUBMITTED",
        description: "Pediatric vaccination and checkup",
        careType: "AMBULATORY",
        diagnosis: "Routine pediatric care",
        amountSubmitted: 800.0,
        incidentDate: new Date("2024-11-01"),
        submittedDate: new Date("2024-11-05"),
        createdById: users.affiliate1.id,
        updatedById: users.employee1.id,
      },
    }),
    pendingInfo: await db.claim.create({
      data: {
        claimNumber: 1004,
        affiliateId: affiliates.gabriel.id,
        patientId: affiliates.gabriel.id,
        clientId: clients.acme.id,
        policyId: policies.life2024.id,
        status: "PENDING_INFO",
        description: "Physical therapy sessions",
        careType: "OTHER",
        diagnosis: "Lower back pain",
        amountSubmitted: 1200.0,
        incidentDate: new Date("2024-09-20"),
        submittedDate: new Date("2024-10-01"),
        createdById: users.employee1.id,
        updatedById: users.employee1.id,
      },
    }),
    returned: await db.claim.create({
      data: {
        claimNumber: 1005,
        affiliateId: affiliates.fernanda.id,
        patientId: affiliates.fernanda.id,
        clientId: clients.beta.id,
        policyId: null, // No policy linked
        status: "RETURNED",
        description: "Dental cleaning and x-rays",
        careType: "AMBULATORY",
        diagnosis: "Dental prophylaxis",
        amountSubmitted: 350.0,
        incidentDate: new Date("2024-08-10"),
        createdById: users.affiliate2.id,
        updatedById: users.employee1.id,
      },
    }),
    cancelled: await db.claim.create({
      data: {
        claimNumber: 1006,
        affiliateId: affiliates.eduardo.id,
        patientId: affiliates.eduardo.id,
        clientId: clients.acme.id,
        policyId: policies.health2024.id,
        status: "CANCELLED",
        description: "MRI scan - duplicate submission",
        careType: "HOSPITALARY",
        amountSubmitted: 2000.0,
        incidentDate: new Date("2024-07-15"),
        createdById: users.affiliate1.id,
        updatedById: users.employee1.id,
      },
    }),
    settled: await db.claim.create({
      data: {
        claimNumber: 1007,
        affiliateId: affiliates.gabriel.id,
        patientId: affiliates.gabriel.id,
        clientId: clients.acme.id,
        policyId: policies.health2024.id,
        status: "SETTLED",
        description: "Outpatient surgery - hernia repair",
        careType: "AMBULATORY",
        diagnosis: "Inguinal hernia",
        amountSubmitted: 1500.0,
        amountApproved: 1200.0,
        amountDenied: 100.0,
        amountUnprocessed: 200.0,
        deductibleApplied: 50.0,
        copayApplied: 25.0,
        incidentDate: new Date("2024-06-01"),
        submittedDate: new Date("2024-06-10"),
        settlementDate: new Date("2024-07-01"),
        businessDays: 15,
        settlementNumber: "SET-2024-0001",
        settlementNotes: "Approved after review. Some items denied due to pre-existing condition clause.",
        createdById: users.affiliate1.id,
        updatedById: users.employee1.id,
      },
    }),
  };

  // Claim history for each claim (status transitions)
  await db.claimHistory.createMany({
    data: [
      // Draft claim - just created
      { claimId: claims.draft.id, fromStatus: null, toStatus: "DRAFT", createdById: users.affiliate1.id },

      // In Review claim
      { claimId: claims.inReview.id, fromStatus: null, toStatus: "DRAFT", createdById: users.affiliate1.id },
      { claimId: claims.inReview.id, fromStatus: "DRAFT", toStatus: "IN_REVIEW", notes: "Started review process", createdById: users.employee1.id },

      // Submitted claim
      { claimId: claims.submitted.id, fromStatus: null, toStatus: "DRAFT", createdById: users.affiliate1.id },
      { claimId: claims.submitted.id, fromStatus: "DRAFT", toStatus: "IN_REVIEW", createdById: users.employee1.id },
      { claimId: claims.submitted.id, fromStatus: "IN_REVIEW", toStatus: "SUBMITTED", notes: "Submitted to insurer", createdById: users.employee1.id },

      // Pending Info claim
      { claimId: claims.pendingInfo.id, fromStatus: null, toStatus: "DRAFT", createdById: users.employee1.id },
      { claimId: claims.pendingInfo.id, fromStatus: "DRAFT", toStatus: "IN_REVIEW", createdById: users.employee1.id },
      { claimId: claims.pendingInfo.id, fromStatus: "IN_REVIEW", toStatus: "SUBMITTED", createdById: users.employee1.id },
      { claimId: claims.pendingInfo.id, fromStatus: "SUBMITTED", toStatus: "PENDING_INFO", reason: "Missing therapy session receipts", createdById: users.employee1.id },

      // Returned claim
      { claimId: claims.returned.id, fromStatus: null, toStatus: "DRAFT", createdById: users.affiliate2.id },
      { claimId: claims.returned.id, fromStatus: "DRAFT", toStatus: "IN_REVIEW", createdById: users.employee1.id },
      { claimId: claims.returned.id, fromStatus: "IN_REVIEW", toStatus: "RETURNED", reason: "Dental not covered under this policy", createdById: users.employee1.id },

      // Cancelled claim
      { claimId: claims.cancelled.id, fromStatus: null, toStatus: "DRAFT", createdById: users.affiliate1.id },
      { claimId: claims.cancelled.id, fromStatus: "DRAFT", toStatus: "CANCELLED", reason: "Duplicate claim submission", createdById: users.employee1.id },

      // Settled claim (full lifecycle)
      { claimId: claims.settled.id, fromStatus: null, toStatus: "DRAFT", createdById: users.affiliate1.id },
      { claimId: claims.settled.id, fromStatus: "DRAFT", toStatus: "IN_REVIEW", createdById: users.employee1.id },
      { claimId: claims.settled.id, fromStatus: "IN_REVIEW", toStatus: "SUBMITTED", createdById: users.employee1.id },
      { claimId: claims.settled.id, fromStatus: "SUBMITTED", toStatus: "SETTLED", notes: "Claim processed and settled", createdById: users.employee1.id },
    ],
  });

  // Claim invoices
  await db.claimInvoice.createMany({
    data: [
      { claimId: claims.inReview.id, invoiceNumber: "INV-001", providerName: "City Hospital", amountSubmitted: 2500.0, createdById: users.affiliate1.id },
      { claimId: claims.inReview.id, invoiceNumber: "INV-002", providerName: "Lab Corp", amountSubmitted: 350.0, createdById: users.affiliate1.id },
      { claimId: claims.submitted.id, invoiceNumber: "INV-003", providerName: "Health Clinic", amountSubmitted: 800.0, createdById: users.affiliate1.id },
      { claimId: claims.settled.id, invoiceNumber: "INV-004", providerName: "General Hospital", amountSubmitted: 1500.0, createdById: users.affiliate1.id },
    ],
  });

  // =========================================================================
  // Phase 7: Invoices (Insurer Billing)
  // =========================================================================
  console.log("Phase 7: Creating invoices...");

  const invoices = {
    pending: await db.invoice.create({
      data: {
        invoiceNumber: "INV-2024-001",
        insurerId: insurers.healthFirst.id,
        clientId: clients.acme.id,
        status: "PENDING",
        paymentStatus: "PENDING_PAYMENT",
        billingPeriodStart: new Date("2024-10-01"),
        billingPeriodEnd: new Date("2024-10-31"),
        actualAmount: 5000.0,
        actualCount: 10,
        issueDate: new Date("2024-11-05"),
        dueDate: new Date("2024-12-05"),
        expectedAmount: 5000.0,
        expectedCount: 10,
        createdById: users.employee1.id,
      },
    }),
    validated: await db.invoice.create({
      data: {
        invoiceNumber: "INV-2024-002",
        insurerId: insurers.healthFirst.id,
        clientId: clients.acme.id,
        status: "VALIDATED",
        paymentStatus: "PAID",
        billingPeriodStart: new Date("2024-09-01"),
        billingPeriodEnd: new Date("2024-09-30"),
        actualAmount: 4500.0,
        actualCount: 9,
        taxAmount: 450.0,
        issueDate: new Date("2024-10-05"),
        dueDate: new Date("2024-11-05"),
        paymentDate: new Date("2024-10-25"),
        paymentNote: "Paid via wire transfer",
        expectedAmount: 4500.0,
        expectedCount: 9,
        reconciledAt: new Date("2024-10-20"),
        reconciledById: users.employee1.id,
        createdById: users.employee1.id,
        updatedById: users.employee1.id,
      },
    }),
    discrepancy: await db.invoice.create({
      data: {
        invoiceNumber: "INV-2024-003",
        insurerId: insurers.safeGuard.id,
        clientId: clients.acme.id,
        status: "DISCREPANCY",
        paymentStatus: "PENDING_PAYMENT",
        billingPeriodStart: new Date("2024-08-01"),
        billingPeriodEnd: new Date("2024-08-31"),
        actualAmount: 3500.0,
        actualCount: 7,
        issueDate: new Date("2024-09-05"),
        dueDate: new Date("2024-10-05"),
        expectedAmount: 3000.0,
        expectedCount: 6,
        totalDiscrepancyAmount: 500.0,
        totalDiscrepancyCountDelta: 1,
        reconciliationNote: "One extra member billed, rate adjustment needed",
        createdById: users.employee1.id,
        updatedById: users.employee1.id,
      },
    }),
    cancelled: await db.invoice.create({
      data: {
        invoiceNumber: "INV-2024-004",
        insurerId: insurers.healthFirst.id,
        clientId: clients.beta.id,
        status: "CANCELLED",
        paymentStatus: "PENDING_PAYMENT",
        billingPeriodStart: new Date("2024-07-01"),
        billingPeriodEnd: new Date("2024-07-31"),
        actualAmount: 2000.0,
        actualCount: 4,
        issueDate: new Date("2024-08-05"),
        expectedAmount: 2000.0,
        expectedCount: 4,
        createdById: users.employee1.id,
        updatedById: users.employee1.id,
      },
    }),
  };

  // Invoice-Policy links
  await db.invoicePolicy.createMany({
    data: [
      { invoiceId: invoices.pending.id, policyId: policies.health2024.id, addedById: users.employee1.id },
      { invoiceId: invoices.validated.id, policyId: policies.health2024.id, addedById: users.employee1.id },
      { invoiceId: invoices.validated.id, policyId: policies.life2024.id, addedById: users.employee1.id },
      { invoiceId: invoices.discrepancy.id, policyId: policies.life2024.id, addedById: users.employee1.id },
    ],
  });

  // Invoice discrepancy causes
  await db.invoiceDiscrepancyCause.createMany({
    data: [
      {
        invoiceId: invoices.discrepancy.id,
        type: "EXTRA_BILLED",
        policyId: policies.life2024.id,
        amount: 500.0,
        countDelta: 1,
        note: "Member added mid-month but billed for full month",
        createdById: users.employee1.id,
      },
      {
        invoiceId: invoices.discrepancy.id,
        type: "RATE_ADJUSTMENT",
        policyId: policies.life2024.id,
        amount: -50.0,
        countDelta: 0,
        note: "Premium rate correction",
        createdById: users.employee1.id,
      },
    ],
  });

  // Invoice history
  await db.invoiceHistory.createMany({
    data: [
      { invoiceId: invoices.pending.id, fromStatus: null, toStatus: "PENDING", createdById: users.employee1.id },
      { invoiceId: invoices.validated.id, fromStatus: null, toStatus: "PENDING", createdById: users.employee1.id },
      { invoiceId: invoices.validated.id, fromStatus: "PENDING", toStatus: "VALIDATED", fromPaymentStatus: "PENDING_PAYMENT", toPaymentStatus: "PAID", createdById: users.employee1.id },
      { invoiceId: invoices.discrepancy.id, fromStatus: null, toStatus: "PENDING", createdById: users.employee1.id },
      { invoiceId: invoices.discrepancy.id, fromStatus: "PENDING", toStatus: "DISCREPANCY", reason: "Amount mismatch detected", createdById: users.employee1.id },
      { invoiceId: invoices.cancelled.id, fromStatus: null, toStatus: "PENDING", createdById: users.employee1.id },
      { invoiceId: invoices.cancelled.id, fromStatus: "PENDING", toStatus: "CANCELLED", reason: "Duplicate invoice", createdById: users.employee1.id },
    ],
  });

  // =========================================================================
  // Phase 8: Tickets
  // =========================================================================
  console.log("Phase 8: Creating tickets...");

  const tickets = {
    open: await db.ticket.create({
      data: {
        ticketNumber: 1,
        subject: "Claim delay inquiry",
        status: "OPEN",
        priority: "NORMAL",
        category: "Claims",
        clientId: clients.acme.id,
        relatedClaimId: claims.submitted.id,
        reporterId: users.affiliate1.id,
        createdById: users.affiliate1.id,
      },
    }),
    inProgress: await db.ticket.create({
      data: {
        ticketNumber: 2,
        subject: "Coverage question for specialist visit",
        status: "IN_PROGRESS",
        priority: "HIGH",
        category: "Coverage",
        clientId: clients.acme.id,
        reporterId: users.affiliate1.id,
        createdById: users.affiliate1.id,
        assignedToId: users.employee1.id,
      },
    }),
    waiting: await db.ticket.create({
      data: {
        ticketNumber: 3,
        subject: "Document request - policy certificate",
        status: "WAITING_ON_CLIENT",
        priority: "LOW",
        category: "Documents",
        clientId: clients.beta.id,
        reporterId: users.affiliate2.id,
        createdById: users.affiliate2.id,
        assignedToId: users.employee2.id,
      },
    }),
    resolved: await db.ticket.create({
      data: {
        ticketNumber: 4,
        subject: "Billing dispute - incorrect amount",
        status: "RESOLVED",
        priority: "URGENT",
        category: "Billing",
        clientId: clients.acme.id,
        reporterId: users.clientAdmin.id,
        createdById: users.clientAdmin.id,
        assignedToId: users.employee1.id,
      },
    }),
    closed: await db.ticket.create({
      data: {
        ticketNumber: 5,
        subject: "General inquiry about benefits",
        status: "CLOSED",
        priority: "NORMAL",
        category: "General",
        clientId: clients.acme.id,
        reporterId: users.affiliate1.id,
        createdById: users.affiliate1.id,
        closedAt: new Date(),
      },
    }),
  };

  // Ticket messages
  await db.ticketMessage.createMany({
    data: [
      // Open ticket
      { ticketId: tickets.open.id, message: "Hi, I submitted a claim 2 weeks ago and haven't received an update. Can you please check the status?", authorId: users.affiliate1.id },

      // In Progress ticket
      { ticketId: tickets.inProgress.id, message: "I need to see a dermatologist. Is this covered under my plan?", authorId: users.affiliate1.id },
      { ticketId: tickets.inProgress.id, message: "Thank you for reaching out. Let me check your policy coverage for specialist visits.", authorId: users.employee1.id },
      { ticketId: tickets.inProgress.id, message: "Yes, dermatology visits are covered with a 20% copay. Would you like me to provide a list of in-network providers?", authorId: users.employee1.id },

      // Waiting ticket
      { ticketId: tickets.waiting.id, message: "Please provide me with a copy of my policy certificate for my records.", authorId: users.affiliate2.id },
      { ticketId: tickets.waiting.id, message: "Sure, we can provide that. Please confirm your mailing address or if you'd prefer digital delivery.", authorId: users.employee2.id },

      // Resolved ticket
      { ticketId: tickets.resolved.id, message: "We were billed $500 more than expected this month. Please investigate.", authorId: users.clientAdmin.id },
      { ticketId: tickets.resolved.id, message: "I've reviewed the invoice and found a billing error. A credit note will be issued within 5 business days.", authorId: users.employee1.id },
      { ticketId: tickets.resolved.id, message: "Thank you for resolving this quickly!", authorId: users.clientAdmin.id },

      // Closed ticket
      { ticketId: tickets.closed.id, message: "Can you explain what benefits are included in my health plan?", authorId: users.affiliate1.id },
      { ticketId: tickets.closed.id, message: "Your plan includes: preventive care (100% covered), specialist visits (20% copay), hospitalization (10% coinsurance), and prescription drugs. Would you like more details on any specific benefit?", authorId: users.employee1.id },
      { ticketId: tickets.closed.id, message: "That's all I needed to know. Thanks!", authorId: users.affiliate1.id },
    ],
  });

  // =========================================================================
  // Phase 9: Documents
  // =========================================================================
  console.log("Phase 9: Creating documents...");

  const documents = {
    benefitsGuide: await db.document.create({
      data: {
        documentNumber: 1,
        title: "Benefits Guide 2024",
        description: "Comprehensive guide to all health benefits available under our plans",
        category: "policy",
        tags: ["health", "benefits", "2024"],
        isPublic: true,
        isActive: true,
        createdById: users.admin.id,
      },
    }),
    claimsProcess: await db.document.create({
      data: {
        documentNumber: 2,
        title: "Claims Submission Process",
        description: "Step-by-step guide for submitting and tracking insurance claims",
        category: "procedure",
        tags: ["claims", "guide", "how-to"],
        isPublic: false,
        isActive: true,
        createdById: users.employee1.id,
      },
    }),
    privacyPolicy: await db.document.create({
      data: {
        documentNumber: 3,
        title: "Privacy Policy",
        description: "Our commitment to protecting your personal health information",
        category: "legal",
        tags: ["privacy", "compliance", "HIPAA"],
        isPublic: true,
        isActive: true,
        createdById: users.admin.id,
      },
    }),
  };

  // Document access
  await db.documentAccess.createMany({
    data: [
      // Benefits Guide - all clients (public)
      { documentId: documents.benefitsGuide.id, clientId: clients.acme.id, grantedById: users.admin.id },
      { documentId: documents.benefitsGuide.id, clientId: clients.beta.id, grantedById: users.admin.id },
      // Claims Process - Acme only
      { documentId: documents.claimsProcess.id, clientId: clients.acme.id, grantedById: users.employee1.id },
      // Privacy Policy - all clients (public)
      { documentId: documents.privacyPolicy.id, clientId: clients.acme.id, grantedById: users.admin.id },
      { documentId: documents.privacyPolicy.id, clientId: clients.beta.id, grantedById: users.admin.id },
    ],
  });

  // =========================================================================
  // Phase 10: Files
  // =========================================================================
  console.log("Phase 10: Creating files...");

  // Pending uploads
  await db.pendingUpload.createMany({
    data: [
      {
        userId: users.affiliate1.id,
        sessionKey: "session-key-affiliate1",
        fileKey: "pending/claim-receipt-001.pdf",
        fileName: "claim-receipt.pdf",
        fileSize: 102400,
        contentType: "application/pdf",
        entityType: "Claim",
        category: "receipt",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
      {
        userId: users.employee1.id,
        sessionKey: "session-key-employee1",
        fileKey: "pending/medical-report-001.pdf",
        fileName: "medical-report.pdf",
        fileSize: 256000,
        contentType: "application/pdf",
        entityType: "Claim",
        category: "medical_report",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    ],
  });

  // Committed files (attached to claims)
  await db.file.createMany({
    data: [
      {
        entityType: "Claim",
        entityId: claims.inReview.id,
        fileKey: "files/hospital-invoice-001.pdf",
        fileName: "hospital-invoice.pdf",
        fileSize: 150000,
        contentType: "application/pdf",
        category: "invoice",
        status: "READY",
        createdById: users.affiliate1.id,
      },
      {
        entityType: "Claim",
        entityId: claims.inReview.id,
        fileKey: "files/lab-results-001.pdf",
        fileName: "lab-results.pdf",
        fileSize: 85000,
        contentType: "application/pdf",
        category: "medical_report",
        status: "READY",
        createdById: users.affiliate1.id,
      },
      {
        entityType: "Claim",
        entityId: claims.submitted.id,
        fileKey: "files/prescription-001.pdf",
        fileName: "prescription.pdf",
        fileSize: 45000,
        contentType: "application/pdf",
        category: "prescription",
        status: "READY",
        createdById: users.affiliate1.id,
      },
      {
        entityType: "Claim",
        entityId: claims.settled.id,
        fileKey: "files/settlement-letter-001.pdf",
        fileName: "settlement-letter.pdf",
        fileSize: 120000,
        contentType: "application/pdf",
        category: "other",
        status: "READY",
        createdById: users.employee1.id,
      },
      {
        entityType: "Claim",
        entityId: claims.pendingInfo.id,
        fileKey: "files/id-scan-001.jpg",
        fileName: "id-scan.jpg",
        fileSize: 500000,
        contentType: "image/jpeg",
        category: "id_document",
        status: "FAILED",
        errorMessage: "File upload timed out",
        createdById: users.affiliate1.id,
      },
    ],
  });

  // =========================================================================
  // Phase 11: Audit Logs
  // =========================================================================
  console.log("Phase 11: Creating audit logs...");

  await db.auditLog.createMany({
    data: [
      // Login events
      {
        action: "LOGIN",
        resource: "Session",
        resourceId: users.admin.id,
        severity: "INFO",
        userId: users.admin.id,
        metadata: { method: "password" },
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0",
      },
      {
        action: "LOGIN_FAILED",
        resource: "Session",
        resourceId: users.locked.id,
        severity: "WARNING",
        userId: users.locked.id,
        metadata: { reason: "account_locked", attempts: 5 },
        ipAddress: "192.168.1.101",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1",
      },

      // Claim events
      {
        action: "CREATE",
        resource: "Claim",
        resourceId: claims.draft.id,
        severity: "INFO",
        userId: users.affiliate1.id,
        newValue: { status: "DRAFT", description: "Routine checkup and blood work" },
        ipAddress: "192.168.1.102",
      },
      {
        action: "STATUS_CHANGE",
        resource: "Claim",
        resourceId: claims.settled.id,
        severity: "INFO",
        userId: users.employee1.id,
        oldValue: { status: "SUBMITTED" },
        newValue: { status: "SETTLED" },
        ipAddress: "192.168.1.103",
      },
      {
        action: "UPDATE",
        resource: "Claim",
        resourceId: claims.settled.id,
        severity: "INFO",
        userId: users.employee1.id,
        oldValue: { amountApproved: null },
        newValue: { amountApproved: 1200.0 },
        ipAddress: "192.168.1.103",
      },

      // File events
      {
        action: "FILE_UPLOAD_INITIATED",
        resource: "File",
        resourceId: claims.inReview.id,
        severity: "INFO",
        userId: users.affiliate1.id,
        metadata: { fileName: "hospital-invoice.pdf", fileSize: 150000 },
        ipAddress: "192.168.1.104",
      },

      // Critical event
      {
        action: "PASSWORD_CHANGED",
        resource: "User",
        resourceId: users.admin.id,
        severity: "CRITICAL",
        userId: users.admin.id,
        metadata: { source: "password_reset" },
        ipAddress: "192.168.1.100",
      },

      // Invitation events
      {
        action: "INVITATION_SENT",
        resource: "Invitation",
        resourceId: employees.jane.id,
        severity: "INFO",
        userId: users.admin.id,
        newValue: { email: "employee1@example.com", role: "employee" },
        ipAddress: "192.168.1.100",
      },
      {
        action: "INVITATION_ACCEPTED",
        resource: "Invitation",
        resourceId: employees.jane.id,
        severity: "INFO",
        userId: users.employee1.id,
        metadata: { acceptedAt: new Date().toISOString() },
        ipAddress: "192.168.1.105",
      },
    ],
  });

  // =========================================================================
  // Phase 12: Global Counters
  // =========================================================================
  console.log("Phase 12: Setting up global counters...");

  await db.globalCounter.createMany({
    data: [
      { id: "claim_number", value: 1007 },
      { id: "ticket_number", value: 5 },
      { id: "document_number", value: 3 },
    ],
  });

  // =========================================================================
  // Phase 13: Invitations (pending invitation for testing)
  // =========================================================================
  console.log("Phase 13: Creating pending invitation...");

  // Create an employee profile without a user for invitation testing
  const pendingEmployee = await db.employee.create({
    data: {
      firstName: "Pending",
      lastName: "Invitee",
      email: "pending@example.com",
      phone: "+1-555-0099",
      department: "New Hire",
      isActive: true,
    },
  });

  await db.invitation.create({
    data: {
      tokenHash: hashToken(INVITATION_TOKEN),
      email: "pending@example.com",
      roleId: roles.employee.id,
      employeeId: pendingEmployee.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdById: users.admin.id,
    },
  });

  // =========================================================================
  // Summary
  // =========================================================================
  console.log("\n========================================");
  console.log("SEED COMPLETED SUCCESSFULLY!");
  console.log("========================================\n");

  console.log("Seeded data summary:");
  console.log("  Roles: 6");
  console.log("  Permissions: 24");
  console.log("  Users: 10");
  console.log("  Clients: 3");
  console.log("  Insurers: 2");
  console.log("  Employees: 3 (+1 pending)");
  console.log("  Agents: 2");
  console.log("  Client Admins: 1");
  console.log("  Affiliates: 6 (3 primaries + 3 dependents)");
  console.log("  Policies: 4 (all types/statuses)");
  console.log("  Enrollments: 4");
  console.log("  Claims: 7 (all statuses covered)");
  console.log("  Claim Invoices: 4");
  console.log("  Invoices: 4 (all statuses)");
  console.log("  Tickets: 5 (all statuses/priorities)");
  console.log("  Documents: 3");
  console.log("  Files: 5 (+ 2 pending uploads)");
  console.log("  Audit Logs: 9");
  console.log("  Invitations: 1 (pending)");
  console.log("");

  console.log("Test credentials (password for all: TestPassword123!):");
  console.log("  Super Admin:    admin@example.com");
  console.log("  Employee 1:     employee1@example.com");
  console.log("  Employee 2:     employee2@example.com");
  console.log("  Agent 1:        agent1@example.com");
  console.log("  Agent 2:        agent2@example.com");
  console.log("  Client Admin:   clientadmin@example.com");
  console.log("  Affiliate 1:    affiliate1@example.com");
  console.log("  Affiliate 2:    affiliate2@example.com");
  console.log("  Locked User:    locked@example.com (account locked)");
  console.log("  Unverified:     unverified@example.com (email not verified)");
  console.log("");

  console.log("Session tokens (for API testing):");
  Object.entries(SESSION_TOKENS).forEach(([key, token]) => {
    console.log(`  ${key}: ${token}`);
  });
  console.log("");

  console.log("Pending invitation token: " + INVITATION_TOKEN);
  console.log("Password reset token: " + PASSWORD_RESET_TOKEN);
  console.log("");

  await db.$disconnect();
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
