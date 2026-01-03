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
  createTestClaimHistory,
  resetClaimNumberCounter,
  SESSION_COOKIE_NAME,
} from "../../__tests__/fixtures.js";

// =============================================================================
// Types
// =============================================================================

interface ClaimHistoryItemResponse {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  reason: string | null;
  notes: string | null;
  createdBy: { id: string; name: string };
  createdAt: string;
}

interface ClaimHistoryResponse {
  data: ClaimHistoryItemResponse[];
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

const asHistoryResponse = (body: unknown): ClaimHistoryResponse =>
  body as ClaimHistoryResponse;

const asErrorResponse = (body: unknown): ErrorResponse =>
  body as ErrorResponse;

// =============================================================================
// Test Suite
// =============================================================================

describe("GET /claims/:claimId/audit-trail/history", () => {
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
    it("should return 200 with empty array when no history exists", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail/history`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asHistoryResponse(res.body);
      expect(body.data).toHaveLength(0);
      expect(body.pagination.total).toBe(0);
    });

    it("should return all history entries for a claim", async () => {
      await createTestClaimHistory({
        claimId: testClaim.id,
        createdById: testUser.id,
        toStatus: "DRAFT",
      });
      await createTestClaimHistory({
        claimId: testClaim.id,
        createdById: testUser.id,
        fromStatus: "DRAFT",
        toStatus: "IN_REVIEW",
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail/history`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asHistoryResponse(res.body);
      expect(body.data).toHaveLength(2);
      expect(body.pagination.total).toBe(2);
    });

    it("should return all expected fields", async () => {
      await createTestClaimHistory({
        claimId: testClaim.id,
        createdById: testUser.id,
        fromStatus: "DRAFT",
        toStatus: "IN_REVIEW",
        reason: "Ready for review",
        notes: "All documents submitted",
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail/history`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asHistoryResponse(res.body);
      expect(body.data).toHaveLength(1);

      const entry = body.data[0]!;
      expect(entry.id).toBeDefined();
      expect(entry.fromStatus).toBe("DRAFT");
      expect(entry.toStatus).toBe("IN_REVIEW");
      expect(entry.reason).toBe("Ready for review");
      expect(entry.notes).toBe("All documents submitted");
      expect(entry.createdBy).not.toBeNull();
      expect(entry.createdBy.id).toBe(testUser.id);
      expect(entry.createdBy.name).toBeDefined();
      expect(entry.createdAt).toBeDefined();
    });

    it("should handle null fromStatus for initial creation", async () => {
      await createTestClaimHistory({
        claimId: testClaim.id,
        createdById: testUser.id,
        fromStatus: null,
        toStatus: "DRAFT",
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail/history`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asHistoryResponse(res.body);
      expect(body.data[0]!.fromStatus).toBeNull();
      expect(body.data[0]!.toStatus).toBe("DRAFT");
    });

    it("should return entries ordered by createdAt desc", async () => {
      const older = await createTestClaimHistory({
        claimId: testClaim.id,
        createdById: testUser.id,
        toStatus: "DRAFT",
        createdAt: new Date("2024-01-01"),
      });
      const newer = await createTestClaimHistory({
        claimId: testClaim.id,
        createdById: testUser.id,
        fromStatus: "DRAFT",
        toStatus: "IN_REVIEW",
        createdAt: new Date("2024-06-01"),
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail/history`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asHistoryResponse(res.body);
      expect(body.data[0]!.id).toBe(newer.id);
      expect(body.data[1]!.id).toBe(older.id);
    });

    it("should not include history from other claims", async () => {
      const otherClaim = await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testAffiliate.id,
        createdById: testUser.id,
      });

      await createTestClaimHistory({
        claimId: testClaim.id,
        createdById: testUser.id,
        toStatus: "DRAFT",
      });
      await createTestClaimHistory({
        claimId: otherClaim.id,
        createdById: testUser.id,
        toStatus: "IN_REVIEW",
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail/history`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asHistoryResponse(res.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0]!.toStatus).toBe("DRAFT");
    });
  });

  // ===========================================================================
  // Pagination
  // ===========================================================================

  describe("Pagination", () => {
    beforeEach(async () => {
      for (let i = 0; i < 25; i++) {
        await createTestClaimHistory({
          claimId: testClaim.id,
          createdById: testUser.id,
          toStatus: "DRAFT",
          createdAt: new Date(Date.now() - i * 1000),
        });
      }
    });

    it("should return default page size of 20", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail/history`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asHistoryResponse(res.body);
      expect(body.data).toHaveLength(20);
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.limit).toBe(20);
      expect(body.pagination.total).toBe(25);
      expect(body.pagination.totalPages).toBe(2);
    });

    it("should return requested page", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail/history?page=2`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asHistoryResponse(res.body);
      expect(body.data).toHaveLength(5);
      expect(body.pagination.page).toBe(2);
    });

    it("should respect custom limit", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail/history?limit=10`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asHistoryResponse(res.body);
      expect(body.data).toHaveLength(10);
      expect(body.pagination.totalPages).toBe(3);
    });

    it("should return empty array for page beyond data", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail/history?page=100`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asHistoryResponse(res.body);
      expect(body.data).toHaveLength(0);
    });

    it("should enforce max limit of 100", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail/history?limit=150`)
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
        .get("/claims/nonexistent-claim-id/audit-trail/history")
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
        `/claims/${testClaim.id}/audit-trail/history`
      );

      expect(res.status).toBe(401);
    });

    it("should return 401 with invalid session token", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail/history`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=invalid-token`);

      expect(res.status).toBe(401);
    });

    it("should return 401 with expired session", async () => {
      const { token: expiredToken } = await createTestSession(testUser.id, {
        expiresAt: new Date(Date.now() - 1000),
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/audit-trail/history`)
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
        .get(`/claims/${testClaim.id}/audit-trail/history`)
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
        .get(`/claims/${testClaim.id}/audit-trail/history`)
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
        .get(`/claims/${testClaim.id}/audit-trail/history`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${selfScopeToken}`);

      expect(res.status).toBe(403);
    });
  });
});
