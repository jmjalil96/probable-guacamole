import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { db } from "../../../config/db.js";
import { createTestApp } from "../../../test/helpers/index.js";
import { cleanDatabase } from "../../../test/db-utils.js";
import {
  seedRoleWithClaimsPermission,
  seedRoleWithoutPermission,
  createTestUser,
  createTestSession,
  createTestClient,
  createTestAffiliate,
  createTestEmployee,
  createTestClaim,
  setupClientScopeUser,
  setupSelfScopeUser,
  resetClaimNumberCounter,
  SESSION_COOKIE_NAME,
} from "./fixtures.js";

interface ClaimDetailResponse {
  id: string;
  claimNumber: number;
  status: string;
  description: string;
  careType: string | null;
  diagnosis: string | null;
  amountSubmitted: string | null;
  amountApproved: string | null;
  incidentDate: string | null;
  submittedDate: string | null;
  patient: { id: string; name: string };
  affiliate: { id: string; name: string };
  client: { id: string; name: string };
  createdBy: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

// Helper to type response body
const asClaimResponse = (body: unknown): ClaimDetailResponse =>
  body as ClaimDetailResponse;

interface ErrorResponse {
  error: {
    message: string;
    code: string;
    requestId?: string;
  };
}

const asErrorResponse = (body: unknown): ErrorResponse =>
  body as ErrorResponse;

describe("GET /claims/:id - Get Claim Detail", () => {
  const app = createTestApp();

  // Base test data
  let testClient: Awaited<ReturnType<typeof createTestClient>>;
  let testAffiliate: Awaited<ReturnType<typeof createTestAffiliate>>;
  let testPatient: Awaited<ReturnType<typeof createTestAffiliate>>;
  let testUser: Awaited<ReturnType<typeof createTestUser>>;
  let testEmployee: Awaited<ReturnType<typeof createTestEmployee>>;
  let testClaim: Awaited<ReturnType<typeof createTestClaim>>;
  let sessionToken: string;

  beforeEach(async () => {
    await cleanDatabase();
    await resetClaimNumberCounter();

    // Create base data
    testClient = await createTestClient("Test Client");
    testAffiliate = await createTestAffiliate(testClient.id, {
      firstName: "John",
      lastName: "Doe",
    });
    testPatient = await createTestAffiliate(testClient.id, {
      firstName: "Jane",
      lastName: "Patient",
    });

    // Create user with claims:read permission (UNLIMITED scope)
    const role = await seedRoleWithClaimsPermission("UNLIMITED");
    testEmployee = await createTestEmployee({ firstName: "Admin", lastName: "User" });
    testUser = await createTestUser(role.id);
    await db.employee.update({
      where: { id: testEmployee.id },
      data: { userId: testUser.id },
    });

    // Create test claim
    testClaim = await createTestClaim({
      clientId: testClient.id,
      affiliateId: testAffiliate.id,
      patientId: testPatient.id,
      createdById: testUser.id,
      status: "SUBMITTED",
      careType: "AMBULATORY",
      diagnosis: "Test diagnosis",
      amountSubmitted: 1500.50,
    });

    const session = await createTestSession(testUser.id);
    sessionToken = session.token;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // ===========================================================================
  // Successful retrieval
  // ===========================================================================

  describe("Successful retrieval", () => {
    it("should return 200 with claim data", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asClaimResponse(res.body);
      expect(body.id).toBe(testClaim.id);
      expect(body.claimNumber).toBe(testClaim.claimNumber);
    });

    it("should return all expected fields", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asClaimResponse(res.body);

      expect(body.id).toBe(testClaim.id);
      expect(body.claimNumber).toBe(testClaim.claimNumber);
      expect(body.status).toBe("SUBMITTED");
      expect(body.description).toBe(testClaim.description);
      expect(body.careType).toBe("AMBULATORY");
      expect(body.diagnosis).toBe("Test diagnosis");
      expect(body.patient).toEqual({ id: testPatient.id, name: "Jane Patient" });
      expect(body.affiliate).toEqual({ id: testAffiliate.id, name: "John Doe" });
      expect(body.client).toEqual({ id: testClient.id, name: "Test Client" });
      expect(body.createdBy.id).toBe(testUser.id);
      expect(body.createdAt).toBeDefined();
      expect(body.updatedAt).toBeDefined();
    });

    it("should transform Decimal amounts to strings", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asClaimResponse(res.body);
      expect(body.amountSubmitted).toBe("1500.5");
    });

    it("should transform dates to ISO strings", async () => {
      // Create claim with dates
      const claimWithDates = await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        submittedDate: new Date("2024-06-15"),
        incidentDate: new Date("2024-06-10"),
      });

      const res = await request(app)
        .get(`/claims/${claimWithDates.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asClaimResponse(res.body);
      expect(body.submittedDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(body.incidentDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  // ===========================================================================
  // Scope-based access
  // ===========================================================================

  describe("Scope-based access", () => {
    it("UNLIMITED scope can access any claim", async () => {
      // testUser has UNLIMITED scope
      const res = await request(app)
        .get(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
    });

    it("CLIENT scope can access claims for assigned clients", async () => {
      const { token: clientScopeToken } = await setupClientScopeUser([testClient.id]);

      const res = await request(app)
        .get(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientScopeToken}`);

      expect(res.status).toBe(200);
      expect(asClaimResponse(res.body).id).toBe(testClaim.id);
    });

    it("CLIENT scope returns 404 for unassigned client claims", async () => {
      // Create a different client and claim
      const otherClient = await createTestClient("Other Client");
      const otherAffiliate = await createTestAffiliate(otherClient.id);
      const otherClaim = await createTestClaim({
        clientId: otherClient.id,
        affiliateId: otherAffiliate.id,
        patientId: otherAffiliate.id,
        createdById: testUser.id,
      });

      // User with CLIENT scope only has access to testClient
      const { token: clientScopeToken } = await setupClientScopeUser([testClient.id]);

      const res = await request(app)
        .get(`/claims/${otherClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientScopeToken}`);

      expect(res.status).toBe(404);
    });

    it("SELF scope can access own affiliate claims", async () => {
      const { affiliate: selfAffiliate, token: selfScopeToken } =
        await setupSelfScopeUser(testClient.id);

      // Create claim for the self-scope user's affiliate
      const selfClaim = await createTestClaim({
        clientId: testClient.id,
        affiliateId: selfAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .get(`/claims/${selfClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${selfScopeToken}`);

      expect(res.status).toBe(200);
      expect(asClaimResponse(res.body).id).toBe(selfClaim.id);
    });

    it("SELF scope returns 404 for other affiliate claims", async () => {
      // Setup user with SELF scope (different affiliate)
      const { token: selfScopeToken } = await setupSelfScopeUser(testClient.id);

      // testClaim belongs to testAffiliate, not the self-scope user's affiliate
      const res = await request(app)
        .get(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${selfScopeToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ===========================================================================
  // Not found
  // ===========================================================================

  describe("Not found", () => {
    it("should return 404 for non-existent ID", async () => {
      const res = await request(app)
        .get("/claims/nonexistent-id-12345")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 with proper error format", async () => {
      const res = await request(app)
        .get("/claims/nonexistent-id-12345")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
      const body = asErrorResponse(res.body);
      expect(body.error).toHaveProperty("message");
      expect(body.error).toHaveProperty("code");
    });
  });

  // ===========================================================================
  // Authentication
  // ===========================================================================

  describe("Authentication", () => {
    it("should return 401 without session cookie", async () => {
      const res = await request(app).get(`/claims/${testClaim.id}`);

      expect(res.status).toBe(401);
    });

    it("should return 401 with invalid session token", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=invalid-token`);

      expect(res.status).toBe(401);
    });

    it("should return 401 with expired session", async () => {
      const { token: expiredToken } = await createTestSession(testUser.id, {
        expiresAt: new Date(Date.now() - 1000),
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${expiredToken}`);

      expect(res.status).toBe(401);
    });

    it("should return 401 with revoked session", async () => {
      const { token: revokedToken } = await createTestSession(testUser.id, {
        revokedAt: new Date(),
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${revokedToken}`);

      expect(res.status).toBe(401);
    });
  });

  // ===========================================================================
  // Authorization
  // ===========================================================================

  describe("Authorization", () => {
    it("should return 403 without claims:read permission", async () => {
      const roleWithoutPerm = await seedRoleWithoutPermission();
      const userWithoutPerm = await createTestUser(roleWithoutPerm.id);
      const { token: noPermToken } = await createTestSession(userWithoutPerm.id);

      const res = await request(app)
        .get(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });

    it("should return 200 with claims:read permission", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
    });
  });

  // ===========================================================================
  // Audit logging
  // ===========================================================================

  describe("Audit logging", () => {
    it("should create audit log entry on successful read", async () => {
      // Clear any existing audit logs
      await db.auditLog.deleteMany();

      const res = await request(app)
        .get(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);

      // Wait a bit for fire-and-forget audit log to be written
      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "READ",
          resource: "Claim",
          resourceId: testClaim.id,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.userId).toBe(testUser.id);
    });
  });
});
