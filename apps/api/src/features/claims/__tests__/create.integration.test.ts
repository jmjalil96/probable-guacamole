import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { db } from "../../../config/db.js";
import { createTestApp } from "../../../test/helpers/index.js";
import { cleanDatabase } from "../../../test/db-utils.js";
import {
  seedRoleWithClaimsCreatePermission,
  seedRoleWithoutPermission,
  createTestUser,
  createTestSession,
  createTestClient,
  createTestAffiliate,
  createTestEmployee,
  createTestDependent,
  createTestPendingUpload,
  setupClientScopeCreateUser,
  setupSelfScopeCreateUser,
  resetClaimNumberCounter,
  SESSION_COOKIE_NAME,
} from "./fixtures.js";

interface CreateClaimResponse {
  id: string;
  claimNumber: number;
  fileAttachmentErrors?: Array<{ fileId: string; error: string }>;
}

const asCreateResponse = (body: unknown): CreateClaimResponse =>
  body as CreateClaimResponse;

interface ErrorResponse {
  error: {
    message: string;
    code: string;
    requestId?: string;
  };
}

const asErrorResponse = (body: unknown): ErrorResponse =>
  body as ErrorResponse;

describe("POST /claims - Create Claim", () => {
  const app = createTestApp();

  let testClient: Awaited<ReturnType<typeof createTestClient>>;
  let testAffiliate: Awaited<ReturnType<typeof createTestAffiliate>>;
  let testUser: Awaited<ReturnType<typeof createTestUser>>;
  let testEmployee: Awaited<ReturnType<typeof createTestEmployee>>;
  let sessionToken: string;

  beforeEach(async () => {
    await cleanDatabase();
    await resetClaimNumberCounter();

    testClient = await createTestClient("Test Client");
    testAffiliate = await createTestAffiliate(testClient.id, {
      firstName: "John",
      lastName: "Doe",
    });

    const role = await seedRoleWithClaimsCreatePermission("UNLIMITED");
    testEmployee = await createTestEmployee({ firstName: "Admin", lastName: "User" });
    testUser = await createTestUser(role.id);
    await db.employee.update({
      where: { id: testEmployee.id },
      data: { userId: testUser.id },
    });

    const session = await createTestSession(testUser.id);
    sessionToken = session.token;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // ===========================================================================
  // Successful creation
  // ===========================================================================

  describe("Successful creation", () => {
    it("should return 201 with id and claimNumber", async () => {
      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "Test claim description",
        });

      expect(res.status).toBe(201);
      const body = asCreateResponse(res.body);
      expect(body.id).toBeDefined();
      expect(body.claimNumber).toBeGreaterThan(1000);
    });

    it("should create claim in DRAFT status", async () => {
      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "Test claim",
        });

      expect(res.status).toBe(201);

      const claim = await db.claim.findUnique({
        where: { id: asCreateResponse(res.body).id },
      });
      expect(claim?.status).toBe("DRAFT");
    });

    it("should create claim history entry", async () => {
      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "Test claim",
        });

      expect(res.status).toBe(201);

      const history = await db.claimHistory.findFirst({
        where: { claimId: asCreateResponse(res.body).id },
      });
      expect(history).not.toBeNull();
      expect(history?.toStatus).toBe("DRAFT");
      expect(history?.fromStatus).toBeNull();
    });

    it("should allow patient to be the affiliate themselves", async () => {
      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "Claim for self",
        });

      expect(res.status).toBe(201);
    });

    it("should allow dependent as patient", async () => {
      const dependent = await createTestDependent(
        testClient.id,
        testAffiliate.id,
        { firstName: "Child", lastName: "Dependent" }
      );

      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: dependent.id,
          description: "Claim for dependent",
        });

      expect(res.status).toBe(201);
    });

    it("should increment claim numbers sequentially", async () => {
      const res1 = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "First claim",
        });

      const res2 = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "Second claim",
        });

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect(asCreateResponse(res2.body).claimNumber).toBe(
        asCreateResponse(res1.body).claimNumber + 1
      );
    });
  });

  // ===========================================================================
  // Scope-based access
  // ===========================================================================

  describe("Scope-based access", () => {
    it("UNLIMITED scope can create for any client", async () => {
      const otherClient = await createTestClient("Other Client");
      const otherAffiliate = await createTestAffiliate(otherClient.id);

      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: otherClient.id,
          affiliateId: otherAffiliate.id,
          patientId: otherAffiliate.id,
          description: "Claim for other client",
        });

      expect(res.status).toBe(201);
    });

    it("CLIENT scope can create for assigned clients", async () => {
      const { token: clientScopeToken } = await setupClientScopeCreateUser([testClient.id]);

      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientScopeToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "Test claim",
        });

      expect(res.status).toBe(201);
    });

    it("CLIENT scope returns 403 for unassigned clients", async () => {
      const otherClient = await createTestClient("Other Client");
      const otherAffiliate = await createTestAffiliate(otherClient.id);

      const { token: clientScopeToken } = await setupClientScopeCreateUser([testClient.id]);

      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientScopeToken}`)
        .send({
          clientId: otherClient.id,
          affiliateId: otherAffiliate.id,
          patientId: otherAffiliate.id,
          description: "Test claim",
        });

      expect(res.status).toBe(403);
    });

    it("SELF scope can create for own affiliate", async () => {
      const { token: selfToken, affiliate: selfAffiliate } =
        await setupSelfScopeCreateUser(testClient.id);

      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${selfToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: selfAffiliate.id,
          patientId: selfAffiliate.id,
          description: "Test claim",
        });

      expect(res.status).toBe(201);
    });

    it("SELF scope returns 403 for other affiliates", async () => {
      const { token: selfToken } = await setupSelfScopeCreateUser(testClient.id);

      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${selfToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "Test claim",
        });

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // Validation errors
  // ===========================================================================

  describe("Validation errors", () => {
    it("returns 404 for non-existent affiliateId", async () => {
      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: "nonexistent-affiliate-id",
          patientId: testAffiliate.id,
          description: "Test claim",
        });

      expect(res.status).toBe(404);
    });

    it("returns 404 for non-existent patientId", async () => {
      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: "nonexistent-patient-id",
          description: "Test claim",
        });

      expect(res.status).toBe(404);
    });

    it("returns 400 when affiliate doesn't belong to client", async () => {
      const otherClient = await createTestClient("Other Client");
      const otherAffiliate = await createTestAffiliate(otherClient.id);

      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: otherAffiliate.id,
          patientId: otherAffiliate.id,
          description: "Test claim",
        });

      expect(res.status).toBe(400);
      expect(asErrorResponse(res.body).error.message).toContain("Affiliate");
    });

    it("returns 400 when patient is not affiliate or dependent", async () => {
      const unrelatedAffiliate = await createTestAffiliate(testClient.id, {
        firstName: "Unrelated",
        lastName: "Person",
      });

      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: unrelatedAffiliate.id,
          description: "Test claim",
        });

      expect(res.status).toBe(400);
      expect(asErrorResponse(res.body).error.message).toContain("Patient");
    });

    it("returns 400 when patient doesn't belong to client", async () => {
      const otherClient = await createTestClient("Other Client");
      const otherAffiliate = await createTestAffiliate(otherClient.id);

      // Make the other affiliate a "dependent" of testAffiliate to bypass the affiliate check
      // but still fail on client check
      await db.affiliate.update({
        where: { id: otherAffiliate.id },
        data: { primaryAffiliateId: testAffiliate.id },
      });

      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: otherAffiliate.id,
          description: "Test claim",
        });

      expect(res.status).toBe(400);
      expect(asErrorResponse(res.body).error.message).toContain("Patient");
      expect(asErrorResponse(res.body).error.message).toContain("client");
    });

    it("returns 400 for missing required fields", async () => {
      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
        });

      expect(res.status).toBe(400);
    });

    it("returns 400 for empty description", async () => {
      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "",
        });

      expect(res.status).toBe(400);
    });

    it("returns 400 for whitespace-only description", async () => {
      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "   ",
        });

      expect(res.status).toBe(400);
    });

    it("trims description whitespace", async () => {
      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "  Test claim description  ",
        });

      expect(res.status).toBe(201);

      const claim = await db.claim.findUnique({
        where: { id: asCreateResponse(res.body).id },
      });
      expect(claim?.description).toBe("Test claim description");
    });

    it("returns 400 when pendingUploadIds exceeds max limit", async () => {
      const ids = Array.from({ length: 21 }, (_, i) => `upload-${i}`);

      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "Test claim",
          pendingUploadIds: ids,
        });

      expect(res.status).toBe(400);
    });
  });

  // ===========================================================================
  // Authentication
  // ===========================================================================

  describe("Authentication", () => {
    it("returns 401 without session cookie", async () => {
      const res = await request(app)
        .post("/claims")
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "Test claim",
        });

      expect(res.status).toBe(401);
    });

    it("returns 401 with invalid session token", async () => {
      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=invalid-token`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "Test claim",
        });

      expect(res.status).toBe(401);
    });

    it("returns 401 with expired session", async () => {
      const { token: expiredToken } = await createTestSession(testUser.id, {
        expiresAt: new Date(Date.now() - 1000),
      });

      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${expiredToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "Test claim",
        });

      expect(res.status).toBe(401);
    });

    it("returns 401 with revoked session", async () => {
      const { token: revokedToken } = await createTestSession(testUser.id, {
        revokedAt: new Date(),
      });

      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${revokedToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "Test claim",
        });

      expect(res.status).toBe(401);
    });
  });

  // ===========================================================================
  // Authorization
  // ===========================================================================

  describe("Authorization", () => {
    it("returns 403 without claims:create permission", async () => {
      const roleWithoutPerm = await seedRoleWithoutPermission();
      const userWithoutPerm = await createTestUser(roleWithoutPerm.id);
      const { token: noPermToken } = await createTestSession(userWithoutPerm.id);

      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "Test claim",
        });

      expect(res.status).toBe(403);
    });

    it("returns 201 with claims:create permission", async () => {
      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "Test claim",
        });

      expect(res.status).toBe(201);
    });
  });

  // ===========================================================================
  // File attachment errors
  // ===========================================================================

  describe("File attachment errors", () => {
    it("returns 201 with fileAttachmentErrors for non-existent pendingUploadId", async () => {
      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "Test claim",
          pendingUploadIds: ["nonexistent-upload-id"],
        });

      expect(res.status).toBe(201);
      const body = asCreateResponse(res.body);
      expect(body.fileAttachmentErrors).toHaveLength(1);
      const errors = body.fileAttachmentErrors!;
      expect(errors[0]!.fileId).toBe("nonexistent-upload-id");
      expect(errors[0]!.error).toBe("File attachment failed");
    });

    it("returns 201 with fileAttachmentErrors for other user's pendingUpload", async () => {
      // Create another user and their pending upload
      const otherRole = await seedRoleWithClaimsCreatePermission("UNLIMITED");
      const otherUser = await createTestUser(otherRole.id);
      const otherPendingUpload = await createTestPendingUpload(otherUser.id, {
        entityType: "Claim",
      });

      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "Test claim",
          pendingUploadIds: [otherPendingUpload.id],
        });

      expect(res.status).toBe(201);
      const body = asCreateResponse(res.body);
      expect(body.fileAttachmentErrors).toHaveLength(1);
      const errors = body.fileAttachmentErrors!;
      expect(errors[0]!.fileId).toBe(otherPendingUpload.id);
      expect(errors[0]!.error).toBe("File attachment failed");

      // Verify the pending upload was not deleted (still belongs to other user)
      const upload = await db.pendingUpload.findUnique({
        where: { id: otherPendingUpload.id },
      });
      expect(upload).not.toBeNull();
    });

    it("returns 201 with fileAttachmentErrors for expired pendingUpload", async () => {
      const expiredUpload = await createTestPendingUpload(testUser.id, {
        entityType: "Claim",
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      });

      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "Test claim",
          pendingUploadIds: [expiredUpload.id],
        });

      expect(res.status).toBe(201);
      const body = asCreateResponse(res.body);
      expect(body.fileAttachmentErrors).toHaveLength(1);
      const errors = body.fileAttachmentErrors!;
      expect(errors[0]!.fileId).toBe(expiredUpload.id);
      expect(errors[0]!.error).toBe("File attachment failed");
    });

    it("returns 201 with fileAttachmentErrors for entityType mismatch", async () => {
      const wrongTypeUpload = await createTestPendingUpload(testUser.id, {
        entityType: "Invoice", // Wrong type - should be "Claim"
      });

      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "Test claim",
          pendingUploadIds: [wrongTypeUpload.id],
        });

      expect(res.status).toBe(201);
      const body = asCreateResponse(res.body);
      expect(body.fileAttachmentErrors).toHaveLength(1);
      const errors = body.fileAttachmentErrors!;
      expect(errors[0]!.fileId).toBe(wrongTypeUpload.id);
      expect(errors[0]!.error).toBe("File attachment failed");
    });

    it("returns only failed uploads in fileAttachmentErrors for partial failures", async () => {
      // Create one valid and one invalid upload
      const invalidUpload = await createTestPendingUpload(testUser.id, {
        entityType: "Invoice", // Wrong type
      });

      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "Test claim",
          pendingUploadIds: ["nonexistent-id", invalidUpload.id],
        });

      expect(res.status).toBe(201);
      const body = asCreateResponse(res.body);
      expect(body.fileAttachmentErrors).toBeDefined();
      expect(body.fileAttachmentErrors).toHaveLength(2);

      const errorFileIds = body.fileAttachmentErrors!.map((e) => e.fileId);
      expect(errorFileIds).toContain("nonexistent-id");
      expect(errorFileIds).toContain(invalidUpload.id);
    });

    it("does not expose internal error details in fileAttachmentErrors", async () => {
      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "Test claim",
          pendingUploadIds: ["nonexistent-upload-id"],
        });

      expect(res.status).toBe(201);
      const body = asCreateResponse(res.body);
      expect(body.fileAttachmentErrors).toHaveLength(1);
      const errors = body.fileAttachmentErrors!;

      // Should be generic message, not internal error details
      const error = errors[0]!.error;
      expect(error).toBe("File attachment failed");
      expect(error).not.toContain("not found");
      expect(error).not.toContain("Pending upload");
    });
  });

  // ===========================================================================
  // Audit logging
  // ===========================================================================

  describe("Audit logging", () => {
    it("should create audit log entry on successful creation", async () => {
      await db.auditLog.deleteMany();

      const res = await request(app)
        .post("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testAffiliate.id,
          description: "Test claim",
        });

      expect(res.status).toBe(201);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "CREATE",
          resource: "Claim",
          resourceId: asCreateResponse(res.body).id,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.userId).toBe(testUser.id);
    });
  });
});
