import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { createTestApp } from "../../../../test/helpers/index.js";
import { cleanDatabase } from "../../../../test/db-utils.js";
import {
  seedRoleWithClaimsPermission,
  seedRoleWithoutPermission,
  createTestUser,
  createTestSession,
  createTestClient,
  createTestAffiliate,
  createTestEmployee,
  createTestClaim,
  createTestAuditLog,
  resetClaimNumberCounter,
  SESSION_COOKIE_NAME,
} from "../../__tests__/fixtures.js";

// =============================================================================
// Types
// =============================================================================

interface AuditLogItemResponse {
  id: string;
  action: string;
  severity: string;
  oldValue: unknown;
  newValue: unknown;
  metadata: unknown;
  user: { id: string; name: string } | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface AuditTrailResponse {
  data: AuditLogItemResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ErrorResponse {
  error: {
    message: string;
    code: string;
    requestId?: string;
  };
}

const asAuditTrailResponse = (body: unknown): AuditTrailResponse =>
  body as AuditTrailResponse;

const asErrorResponse = (body: unknown): ErrorResponse =>
  body as ErrorResponse;

// =============================================================================
// Test Suite
// =============================================================================

describe("GET /claims/:claimId/audit-trail", () => {
  const app = createTestApp();

  let testClient: Awaited<ReturnType<typeof createTestClient>>;
  let testAffiliate: Awaited<ReturnType<typeof createTestAffiliate>>;
  let testClaim: Awaited<ReturnType<typeof createTestClaim>>;
  let testUser: Awaited<ReturnType<typeof createTestUser>>;
  let sessionToken: string;

  beforeEach(async () => {
    await cleanDatabase();
    await resetClaimNumberCounter();

    testClient = await createTestClient("Test Client");
    testAffiliate = await createTestAffiliate(testClient.id, {
      firstName: "John",
      lastName: "Doe",
    });

    const role = await seedRoleWithClaimsPermission("UNLIMITED");
    testUser = await createTestUser(role.id);
    await createTestEmployee({
      firstName: "Admin",
      lastName: "User",
      userId: testUser.id,
    });

    const session = await createTestSession(testUser.id);
    sessionToken = session.token;

    testClaim = await createTestClaim({
      clientId: testClient.id,
      affiliateId: testAffiliate.id,
      patientId: testAffiliate.id,
      createdById: testUser.id,
      status: "DRAFT",
    });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // ===========================================================================
  // Successful retrieval
  // ===========================================================================

  describe("Successful retrieval", () => {
    it("should return 200 with empty array when no audit logs exist", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asAuditTrailResponse(res.body);
      expect(body.data).toHaveLength(0);
      expect(body.pagination.total).toBe(0);
    });

    it("should return all audit logs for a claim", async () => {
      await createTestAuditLog({
        resourceId: testClaim.id,
        action: "CREATE",
        userId: testUser.id,
      });
      await createTestAuditLog({
        resourceId: testClaim.id,
        action: "UPDATE",
        userId: testUser.id,
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asAuditTrailResponse(res.body);
      expect(body.data).toHaveLength(2);
      expect(body.pagination.total).toBe(2);
    });

    it("should return all expected fields", async () => {
      await createTestAuditLog({
        resourceId: testClaim.id,
        action: "STATUS_CHANGE",
        severity: "WARNING",
        userId: testUser.id,
        oldValue: { status: "DRAFT" },
        newValue: { status: "IN_REVIEW" },
        metadata: { reason: "Ready for review" },
        ipAddress: "127.0.0.1",
        userAgent: "TestAgent/1.0",
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asAuditTrailResponse(res.body);
      expect(body.data).toHaveLength(1);

      const log = body.data[0]!;
      expect(log.id).toBeDefined();
      expect(log.action).toBe("STATUS_CHANGE");
      expect(log.severity).toBe("WARNING");
      expect(log.oldValue).toEqual({ status: "DRAFT" });
      expect(log.newValue).toEqual({ status: "IN_REVIEW" });
      expect(log.metadata).toEqual({ reason: "Ready for review" });
      expect(log.user).not.toBeNull();
      expect(log.user!.id).toBe(testUser.id);
      expect(log.user!.name).toBeDefined();
      expect(log.ipAddress).toBe("127.0.0.1");
      expect(log.userAgent).toBe("TestAgent/1.0");
      expect(log.createdAt).toBeDefined();
    });

    it("should return logs ordered by createdAt desc", async () => {
      const older = await createTestAuditLog({
        resourceId: testClaim.id,
        action: "CREATE",
        createdAt: new Date("2024-01-01"),
      });
      const newer = await createTestAuditLog({
        resourceId: testClaim.id,
        action: "UPDATE",
        createdAt: new Date("2024-06-01"),
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asAuditTrailResponse(res.body);
      expect(body.data[0]!.id).toBe(newer.id);
      expect(body.data[1]!.id).toBe(older.id);
    });

    it("should not include logs from other claims", async () => {
      const otherClaim = await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testAffiliate.id,
        createdById: testUser.id,
      });

      await createTestAuditLog({ resourceId: testClaim.id, action: "UPDATE" });
      await createTestAuditLog({
        resourceId: otherClaim.id,
        action: "CREATE",
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asAuditTrailResponse(res.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0]!.action).toBe("UPDATE");
    });

    it("should handle null user gracefully", async () => {
      await createTestAuditLog({
        resourceId: testClaim.id,
        action: "SYSTEM_EVENT",
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asAuditTrailResponse(res.body);
      expect(body.data[0]!.user).toBeNull();
    });
  });

  // ===========================================================================
  // Pagination
  // ===========================================================================

  describe("Pagination", () => {
    beforeEach(async () => {
      for (let i = 0; i < 25; i++) {
        await createTestAuditLog({
          resourceId: testClaim.id,
          action: `ACTION_${i}`,
          createdAt: new Date(Date.now() - i * 1000),
        });
      }
    });

    it("should return default page size of 20", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asAuditTrailResponse(res.body);
      expect(body.data).toHaveLength(20);
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.limit).toBe(20);
      expect(body.pagination.total).toBe(25);
      expect(body.pagination.totalPages).toBe(2);
    });

    it("should return requested page", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail?page=2`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asAuditTrailResponse(res.body);
      expect(body.data).toHaveLength(5);
      expect(body.pagination.page).toBe(2);
    });

    it("should respect custom limit", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail?limit=10`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asAuditTrailResponse(res.body);
      expect(body.data).toHaveLength(10);
      expect(body.pagination.totalPages).toBe(3);
    });

    it("should return empty array for page beyond data", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail?page=100`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asAuditTrailResponse(res.body);
      expect(body.data).toHaveLength(0);
    });

    it("should enforce max limit of 100", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail?limit=150`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
    });
  });

  // ===========================================================================
  // Filters
  // ===========================================================================

  describe("Filters", () => {
    beforeEach(async () => {
      await createTestAuditLog({
        resourceId: testClaim.id,
        action: "CREATE",
        severity: "INFO",
        userId: testUser.id,
        createdAt: new Date("2024-01-15"),
      });
      await createTestAuditLog({
        resourceId: testClaim.id,
        action: "UPDATE",
        severity: "WARNING",
        userId: testUser.id,
        createdAt: new Date("2024-02-15"),
      });
      await createTestAuditLog({
        resourceId: testClaim.id,
        action: "STATUS_CHANGE",
        severity: "CRITICAL",
        createdAt: new Date("2024-03-15"),
      });
    });

    it("should filter by single action", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail?action=CREATE`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asAuditTrailResponse(res.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0]!.action).toBe("CREATE");
    });

    it("should filter by multiple actions (comma-separated)", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail?action=CREATE,UPDATE`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asAuditTrailResponse(res.body);
      expect(body.data).toHaveLength(2);
    });

    it("should filter by single severity", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail?severity=WARNING`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asAuditTrailResponse(res.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0]!.severity).toBe("WARNING");
    });

    it("should filter by multiple severities", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail?severity=INFO,CRITICAL`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asAuditTrailResponse(res.body);
      expect(body.data).toHaveLength(2);
    });

    it("should filter by userId", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail?userId=${testUser.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asAuditTrailResponse(res.body);
      expect(body.data).toHaveLength(2);
    });

    it("should filter by date range (from only)", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail?from=2024-02-01`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asAuditTrailResponse(res.body);
      expect(body.data).toHaveLength(2);
    });

    it("should filter by date range (to only)", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail?to=2024-02-01`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asAuditTrailResponse(res.body);
      expect(body.data).toHaveLength(1);
    });

    it("should filter by date range (from and to)", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail?from=2024-02-01&to=2024-02-28`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asAuditTrailResponse(res.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0]!.action).toBe("UPDATE");
    });

    it("should combine multiple filters", async () => {
      const res = await request(app)
        .get(
          `/claims/${testClaim.id}/audit-trail?action=CREATE,UPDATE&severity=INFO&userId=${testUser.id}`
        )
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asAuditTrailResponse(res.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0]!.action).toBe("CREATE");
    });

    it("should return 400 for invalid severity", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail?severity=INVALID`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid date format", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail?from=01-15-2024`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
    });
  });

  // ===========================================================================
  // Not Found
  // ===========================================================================

  describe("Not Found", () => {
    it("should return 404 for non-existent claim", async () => {
      const res = await request(app)
        .get("/claims/nonexistent-claim-id/audit-trail")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
      const body = asErrorResponse(res.body);
      expect(body.error.message).toContain("Claim");
    });
  });

  // ===========================================================================
  // Authentication
  // ===========================================================================

  describe("Authentication", () => {
    it("should return 401 without session cookie", async () => {
      const res = await request(app).get(
        `/claims/${testClaim.id}/audit-trail`
      );

      expect(res.status).toBe(401);
    });

    it("should return 401 with invalid session token", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=invalid-token`);

      expect(res.status).toBe(401);
    });

    it("should return 401 with expired session", async () => {
      const { token: expiredToken } = await createTestSession(testUser.id, {
        expiresAt: new Date(Date.now() - 1000),
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${expiredToken}`);

      expect(res.status).toBe(401);
    });
  });

  // ===========================================================================
  // Authorization
  // ===========================================================================

  describe("Authorization", () => {
    it("should return 403 without claims:read permission", async () => {
      const roleWithoutPerm = await seedRoleWithoutPermission("UNLIMITED");
      const userWithoutPerm = await createTestUser(roleWithoutPerm.id);
      const { token: noPermToken } = await createTestSession(
        userWithoutPerm.id
      );

      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });

    it("should return 403 without UNLIMITED scope (CLIENT scope)", async () => {
      const clientScopeRole = await seedRoleWithClaimsPermission("CLIENT");
      const clientScopeUser = await createTestUser(clientScopeRole.id);
      const { token: clientScopeToken } = await createTestSession(
        clientScopeUser.id
      );

      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientScopeToken}`);

      expect(res.status).toBe(403);
    });

    it("should return 403 for SELF scope", async () => {
      const selfScopeRole = await seedRoleWithClaimsPermission("SELF");
      const selfScopeUser = await createTestUser(selfScopeRole.id);
      const { token: selfScopeToken } = await createTestSession(
        selfScopeUser.id
      );

      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${selfScopeToken}`);

      expect(res.status).toBe(403);
    });
  });
});
