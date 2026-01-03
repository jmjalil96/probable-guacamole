import request from "supertest";
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { db } from "../../../config/db.js";
import { cleanDatabase } from "../../../test/db-utils.js";
import { createTestApp } from "../../../test/helpers/create-test-app.js";
import {
  createTestClient,
  createTestAffiliate,
  createTestClaim,
  createTestSession,
  createTestUser,
  resetClaimNumberCounter,
  seedRoleWithClaimsPermission,
  seedRoleWithoutPermission,
  setupUnlimitedScopeEditUser,
  setupClientScopeEditUser,
  setupSelfScopeEditUser,
  SESSION_COOKIE_NAME,
} from "./fixtures.js";

const app = createTestApp();

interface ClaimDetailResponse {
  id: string;
  claimNumber: number;
  status: string;
  description: string;
  careType: string | null;
  diagnosis: string | null;
  amountSubmitted: string | null;
  amountApproved: string | null;
  amountDenied: string | null;
}

const asClaimResponse = (body: unknown): ClaimDetailResponse =>
  body as ClaimDetailResponse;

const asErrorResponse = (body: unknown) =>
  body as { error: { message: string; code?: string } };

describe("PATCH /claims/:id - Update Claim", () => {
  let testClient: Awaited<ReturnType<typeof createTestClient>>;
  let testAffiliate: Awaited<ReturnType<typeof createTestAffiliate>>;
  let testUser: Awaited<ReturnType<typeof setupUnlimitedScopeEditUser>>["user"];
  let sessionToken: string;
  let testClaim: Awaited<ReturnType<typeof createTestClaim>>;

  beforeEach(async () => {
    await cleanDatabase();
    await resetClaimNumberCounter();

    testClient = await createTestClient();
    testAffiliate = await createTestAffiliate(testClient.id);

    const setup = await setupUnlimitedScopeEditUser();
    testUser = setup.user;
    sessionToken = setup.token;

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
  // Authentication
  // ===========================================================================

  describe("Authentication", () => {
    it("returns 401 without session cookie", async () => {
      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .send({ description: "Updated" });

      expect(res.status).toBe(401);
    });

    it("returns 401 with invalid session token", async () => {
      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=invalid-token`)
        .send({ description: "Updated" });

      expect(res.status).toBe(401);
    });

    it("returns 401 with expired session", async () => {
      const { token: expiredToken } = await createTestSession(testUser.id, {
        expiresAt: new Date(Date.now() - 1000),
      });

      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${expiredToken}`)
        .send({ description: "Updated" });

      expect(res.status).toBe(401);
    });
  });

  // ===========================================================================
  // Scope Restriction
  // ===========================================================================

  describe("Scope restriction", () => {
    it("returns 403 for CLIENT scope user", async () => {
      const { token: clientToken } = await setupClientScopeEditUser([
        testClient.id,
      ]);

      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`)
        .send({ description: "Updated" });

      expect(res.status).toBe(403);
    });

    it("returns 403 for SELF scope user", async () => {
      const { token: selfToken } = await setupSelfScopeEditUser(testClient.id);

      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${selfToken}`)
        .send({ description: "Updated" });

      expect(res.status).toBe(403);
    });

    it("allows UNLIMITED scope user", async () => {
      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ description: "Updated" });

      expect(res.status).toBe(200);
    });
  });

  // ===========================================================================
  // Authorization
  // ===========================================================================

  describe("Authorization", () => {
    it("returns 403 without claims:edit permission", async () => {
      const roleWithoutPerm = await seedRoleWithoutPermission("UNLIMITED");
      const userWithoutPerm = await createTestUser(roleWithoutPerm.id);
      const { token: noPermToken } = await createTestSession(
        userWithoutPerm.id
      );

      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`)
        .send({ description: "Updated" });

      expect(res.status).toBe(403);
    });

    it("returns 403 with claims:read but not claims:edit", async () => {
      const readRole = await seedRoleWithClaimsPermission("UNLIMITED");
      const readUser = await createTestUser(readRole.id);
      const { token: readToken } = await createTestSession(readUser.id);

      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${readToken}`)
        .send({ description: "Updated" });

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // Validation
  // ===========================================================================

  describe("Validation", () => {
    it("returns 404 for non-existent claim", async () => {
      const res = await request(app)
        .patch("/claims/nonexistent-id")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ description: "Updated" });

      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid date format", async () => {
      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ incidentDate: "invalid-date" });

      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid careType enum", async () => {
      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ careType: "INVALID_TYPE" });

      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid calendar date (Feb 30)", async () => {
      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ incidentDate: "2024-02-30" });

      expect(res.status).toBe(400);
    });

    it("returns 400 for non-leap year Feb 29", async () => {
      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ incidentDate: "2023-02-29" });

      expect(res.status).toBe(400);
    });

    it("accepts valid leap year Feb 29", async () => {
      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ incidentDate: "2024-02-29" });

      expect(res.status).toBe(200);
    });
  });

  // ===========================================================================
  // State Machine - Editable Fields
  // ===========================================================================

  describe("State machine - editable fields", () => {
    it("allows editing core fields in DRAFT status", async () => {
      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          description: "Updated description",
          careType: "AMBULATORY",
          diagnosis: "Test diagnosis",
          incidentDate: "2024-01-15",
        });

      expect(res.status).toBe(200);
      const body = asClaimResponse(res.body);
      expect(body.description).toBe("Updated description");
      expect(body.careType).toBe("AMBULATORY");
      expect(body.diagnosis).toBe("Test diagnosis");
    });

    it("returns 400 for submission fields in DRAFT status", async () => {
      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ amountSubmitted: "100.00" });

      expect(res.status).toBe(400);
      expect(asErrorResponse(res.body).error.message).toContain("not editable");
      expect(asErrorResponse(res.body).error.message).toContain(
        "amountSubmitted"
      );
    });

    it("allows editing core + submission fields in IN_REVIEW status", async () => {
      await db.claim.update({
        where: { id: testClaim.id },
        data: { status: "IN_REVIEW" },
      });

      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          description: "Updated in review",
          amountSubmitted: "500.00",
          submittedDate: "2024-02-01",
        });

      expect(res.status).toBe(200);
      const body = asClaimResponse(res.body);
      expect(body.description).toBe("Updated in review");
      expect(body.amountSubmitted).toBe("500");
    });

    it("allows editing settlement fields in SUBMITTED status", async () => {
      await db.claim.update({
        where: { id: testClaim.id },
        data: { status: "SUBMITTED" },
      });

      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          amountApproved: "450.00",
          amountDenied: "50.00",
          settlementNotes: "Partial approval",
        });

      expect(res.status).toBe(200);
      const body = asClaimResponse(res.body);
      expect(body.amountApproved).toBe("450");
      expect(body.amountDenied).toBe("50");
    });

    it("returns 400 for core fields in SUBMITTED status", async () => {
      await db.claim.update({
        where: { id: testClaim.id },
        data: { status: "SUBMITTED" },
      });

      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ description: "Cannot update" });

      expect(res.status).toBe(400);
      expect(asErrorResponse(res.body).error.message).toContain("description");
    });

    it("returns 400 for any field in SETTLED status (terminal)", async () => {
      await db.claim.update({
        where: { id: testClaim.id },
        data: { status: "SETTLED" },
      });

      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ description: "Cannot update" });

      expect(res.status).toBe(400);
    });

    it("returns 400 for any field in CANCELLED status (terminal)", async () => {
      await db.claim.update({
        where: { id: testClaim.id },
        data: { status: "CANCELLED" },
      });

      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ description: "Cannot update" });

      expect(res.status).toBe(400);
    });

    it("returns 400 for any field in RETURNED status (terminal)", async () => {
      await db.claim.update({
        where: { id: testClaim.id },
        data: { status: "RETURNED" },
      });

      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ description: "Cannot update" });

      expect(res.status).toBe(400);
    });
  });

  // ===========================================================================
  // Successful Updates
  // ===========================================================================

  describe("Successful updates", () => {
    it("returns 200 with updated claim detail", async () => {
      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ description: "Updated description" });

      expect(res.status).toBe(200);
      const body = asClaimResponse(res.body);
      expect(body.id).toBe(testClaim.id);
      expect(body.claimNumber).toBe(testClaim.claimNumber);
      expect(body.description).toBe("Updated description");
    });

    it("updates description field", async () => {
      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ description: "New description" });

      expect(res.status).toBe(200);

      const claim = await db.claim.findUnique({ where: { id: testClaim.id } });
      expect(claim?.description).toBe("New description");
    });

    it("updates careType field", async () => {
      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ careType: "HOSPITALARY" });

      expect(res.status).toBe(200);
      expect(asClaimResponse(res.body).careType).toBe("HOSPITALARY");
    });

    it("clears nullable field when null is passed", async () => {
      await db.claim.update({
        where: { id: testClaim.id },
        data: { diagnosis: "Initial diagnosis" },
      });

      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ diagnosis: null });

      expect(res.status).toBe(200);
      expect(asClaimResponse(res.body).diagnosis).toBeNull();

      const claim = await db.claim.findUnique({ where: { id: testClaim.id } });
      expect(claim?.diagnosis).toBeNull();
    });

    it("updates multiple fields at once", async () => {
      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          description: "Multi-update",
          careType: "OTHER",
          diagnosis: "Multiple fields updated",
        });

      expect(res.status).toBe(200);
      const body = asClaimResponse(res.body);
      expect(body.description).toBe("Multi-update");
      expect(body.careType).toBe("OTHER");
      expect(body.diagnosis).toBe("Multiple fields updated");
    });

    it("sets updatedById to current user", async () => {
      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ description: "Updated" });

      expect(res.status).toBe(200);

      const claim = await db.claim.findUnique({ where: { id: testClaim.id } });
      expect(claim?.updatedById).toBe(testUser.id);
    });

    it("returns unchanged claim for empty update payload", async () => {
      const res = await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(asClaimResponse(res.body).description).toBe(testClaim.description);
    });
  });

  // ===========================================================================
  // Audit Logging
  // ===========================================================================

  describe("Audit logging", () => {
    it("creates audit log entry with UPDATE action", async () => {
      await db.auditLog.deleteMany();

      await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ description: "Audit test" });

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "UPDATE",
          resource: "Claim",
          resourceId: testClaim.id,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog?.userId).toBe(testUser.id);
    });

    it("audit log contains oldValue and newValue", async () => {
      await db.auditLog.deleteMany();

      await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ description: "New value" });

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "UPDATE",
          resource: "Claim",
          resourceId: testClaim.id,
        },
      });

      expect(auditLog?.oldValue).toHaveProperty("description");
      expect(auditLog?.newValue).toHaveProperty("description", "New value");
    });

    it("audit log metadata includes updatedFields", async () => {
      await db.auditLog.deleteMany();

      await request(app)
        .patch(`/claims/${testClaim.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ description: "Updated", careType: "AMBULATORY" });

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "UPDATE",
          resource: "Claim",
          resourceId: testClaim.id,
        },
      });

      const metadata = auditLog?.metadata as { updatedFields?: string[] };
      expect(metadata?.updatedFields).toContain("description");
      expect(metadata?.updatedFields).toContain("careType");
    });
  });
});
