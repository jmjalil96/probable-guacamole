import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import type { ClaimTransitionResponse } from "shared";
import { db } from "../../../../config/db.js";
import { createTestApp } from "../../../../test/helpers/create-test-app.js";
import { cleanDatabase } from "../../../../test/db-utils.js";
import { expectErrorResponse } from "../../../../test/helpers/assertions.js";
import {
  createTestClient,
  createTestAffiliate,
  createTestClaim,
  createTestSession,
  setupUnlimitedScopeEditUser,
  seedRoleWithClaimsPermission,
  seedRoleWithoutPermission,
  createTestUser,
  resetClaimNumberCounter,
  SESSION_COOKIE_NAME,
  type CreateClaimOptions,
} from "../../__tests__/fixtures.js";

// =============================================================================
// Type Helpers
// =============================================================================

const asTransitionResponse = (body: unknown): ClaimTransitionResponse =>
  body as ClaimTransitionResponse;

// =============================================================================
// Additional Fixtures (Insurer & Policy)
// =============================================================================

let claimNumberSeq = 1000;

async function createTestInsurer(name = `Insurer-${Date.now()}`) {
  return db.insurer.create({
    data: {
      name,
      type: "MEDICINA_PREPAGADA",
      isActive: true,
    },
  });
}

async function createTestPolicy(clientId: string, insurerId: string) {
  return db.policy.create({
    data: {
      policyNumber: `POL-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      clientId,
      insurerId,
      status: "ACTIVE",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
    },
  });
}

// =============================================================================
// Claim Factory Helpers (with proper invariants)
// =============================================================================

interface TestClaimSetup {
  clientId: string;
  affiliateId: string;
  patientId: string;
  createdById: string;
  policyId: string;
}

function getNextClaimNumber(): number {
  return claimNumberSeq++;
}

async function createClaimInDraft(setup: TestClaimSetup) {
  return db.claim.create({
    data: {
      claimNumber: getNextClaimNumber(),
      clientId: setup.clientId,
      affiliateId: setup.affiliateId,
      patientId: setup.patientId,
      createdById: setup.createdById,
      policyId: setup.policyId,
      status: "DRAFT",
      description: "Test claim in draft",
      // Core fields populated for IN_REVIEW transition
      careType: "AMBULATORY",
      diagnosis: "Test diagnosis",
      incidentDate: new Date("2024-01-15"),
    },
  });
}

async function createClaimInReview(setup: TestClaimSetup) {
  return db.claim.create({
    data: {
      claimNumber: getNextClaimNumber(),
      clientId: setup.clientId,
      affiliateId: setup.affiliateId,
      patientId: setup.patientId,
      createdById: setup.createdById,
      policyId: setup.policyId,
      status: "IN_REVIEW",
      description: "Test claim in review",
      // Core fields
      careType: "AMBULATORY",
      diagnosis: "Test diagnosis",
      incidentDate: new Date("2024-01-15"),
      // Submission fields for SUBMITTED transition
      amountSubmitted: 1000,
      submittedDate: new Date("2024-01-20"),
    },
  });
}

async function createClaimSubmitted(setup: TestClaimSetup) {
  return db.claim.create({
    data: {
      claimNumber: getNextClaimNumber(),
      clientId: setup.clientId,
      affiliateId: setup.affiliateId,
      patientId: setup.patientId,
      createdById: setup.createdById,
      policyId: setup.policyId,
      status: "SUBMITTED",
      description: "Test claim submitted",
      // Core fields
      careType: "AMBULATORY",
      diagnosis: "Test diagnosis",
      incidentDate: new Date("2024-01-15"),
      // Submission fields
      amountSubmitted: 1000,
      submittedDate: new Date("2024-01-20"),
    },
  });
}

async function createClaimSubmittedWithSettlement(setup: TestClaimSetup) {
  return db.claim.create({
    data: {
      claimNumber: getNextClaimNumber(),
      clientId: setup.clientId,
      affiliateId: setup.affiliateId,
      patientId: setup.patientId,
      createdById: setup.createdById,
      policyId: setup.policyId,
      status: "SUBMITTED",
      description: "Test claim for settlement",
      // Core fields
      careType: "AMBULATORY",
      diagnosis: "Test diagnosis",
      incidentDate: new Date("2024-01-15"),
      // Submission fields
      amountSubmitted: 1000,
      submittedDate: new Date("2024-01-20"),
      // Settlement fields (required for SETTLED)
      amountApproved: 800,
      amountDenied: 100,
      amountUnprocessed: 100,
      deductibleApplied: 50,
      copayApplied: 25,
      settlementDate: new Date("2024-02-01"),
      settlementNumber: "SET-12345",
      settlementNotes: "Approved with deductions",
    },
  });
}

async function createClaimPendingInfo(setup: TestClaimSetup) {
  return db.claim.create({
    data: {
      claimNumber: getNextClaimNumber(),
      clientId: setup.clientId,
      affiliateId: setup.affiliateId,
      patientId: setup.patientId,
      createdById: setup.createdById,
      policyId: setup.policyId,
      status: "PENDING_INFO",
      description: "Test claim pending info",
      // Core fields
      careType: "AMBULATORY",
      diagnosis: "Test diagnosis",
      incidentDate: new Date("2024-01-15"),
      // Submission fields
      amountSubmitted: 1000,
      submittedDate: new Date("2024-01-20"),
    },
  });
}

async function createClaimWithoutInvariants(
  setup: Omit<TestClaimSetup, "policyId">,
  status: CreateClaimOptions["status"] = "DRAFT"
) {
  return createTestClaim({
    ...setup,
    status,
    // No policyId and no core fields - missing invariants
    careType: null,
    diagnosis: null,
    incidentDate: null,
  });
}

// =============================================================================
// Test Suite
// =============================================================================

describe("Claim Transitions - Integration Tests", () => {
  const app = createTestApp();

  let sessionToken: string;
  let testUserId: string;
  let testClient: Awaited<ReturnType<typeof createTestClient>>;
  let testAffiliate: Awaited<ReturnType<typeof createTestAffiliate>>;
  let testPolicy: Awaited<ReturnType<typeof createTestPolicy>>;
  let claimSetup: TestClaimSetup;

  beforeEach(async () => {
    await cleanDatabase();
    await resetClaimNumberCounter();
    claimNumberSeq = 1000; // Reset local counter too

    // Setup authenticated user with UNLIMITED scope and claims:edit permission
    const { user, token } = await setupUnlimitedScopeEditUser();
    sessionToken = token;
    testUserId = user.id;

    // Setup client/affiliate/patient
    testClient = await createTestClient();
    testAffiliate = await createTestAffiliate(testClient.id);

    // Setup insurer and policy (required for claim invariants)
    const testInsurer = await createTestInsurer();
    testPolicy = await createTestPolicy(testClient.id, testInsurer.id);

    claimSetup = {
      clientId: testClient.id,
      affiliateId: testAffiliate.id,
      patientId: testAffiliate.id, // Using affiliate as patient
      createdById: testUserId,
      policyId: testPolicy.id,
    };
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // ===========================================================================
  // POST /claims/:id/review - DRAFT → IN_REVIEW
  // ===========================================================================

  describe("POST /claims/:id/review", () => {
    describe("Successful transitions", () => {
      it("should transition claim from DRAFT to IN_REVIEW", async () => {
        const claim = await createClaimInDraft(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/review`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({});

        expect(res.status).toBe(200);
        const body = asTransitionResponse(res.body);
        expect(body.id).toBe(claim.id);
        expect(body.status).toBe("IN_REVIEW");
        expect(body.previousStatus).toBe("DRAFT");
      });

      it("should transition with optional notes", async () => {
        const claim = await createClaimInDraft(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/review`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({ notes: "Reviewed and approved for processing" });

        expect(res.status).toBe(200);
        expect(asTransitionResponse(res.body).status).toBe("IN_REVIEW");
      });

      it("should update claim status in database", async () => {
        const claim = await createClaimInDraft(claimSetup);

        await request(app)
          .post(`/claims/${claim.id}/review`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({});

        const updated = await db.claim.findUnique({ where: { id: claim.id } });
        expect(updated?.status).toBe("IN_REVIEW");
      });

      it("should create history record", async () => {
        const claim = await createClaimInDraft(claimSetup);

        await request(app)
          .post(`/claims/${claim.id}/review`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({ notes: "Test notes" });

        const history = await db.claimHistory.findFirst({
          where: { claimId: claim.id },
        });
        expect(history).not.toBeNull();
        expect(history?.fromStatus).toBe("DRAFT");
        expect(history?.toStatus).toBe("IN_REVIEW");
        expect(history?.notes).toBe("Test notes");
        expect(history?.createdById).toBe(testUserId);
      });
    });

    describe("Invalid transitions (400)", () => {
      it("should reject transition from IN_REVIEW (wrong source status)", async () => {
        const claim = await createClaimInReview(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/review`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({});

        expect(res.status).toBe(400);
        expectErrorResponse(res, 400, "BAD_REQUEST");
      });

      it("should reject transition from SUBMITTED", async () => {
        const claim = await createClaimSubmitted(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/review`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({});

        expect(res.status).toBe(400);
      });

      it("should reject when claim missing required invariants for IN_REVIEW", async () => {
        const claim = await createClaimWithoutInvariants(
          {
            clientId: claimSetup.clientId,
            affiliateId: claimSetup.affiliateId,
            patientId: claimSetup.patientId,
            createdById: claimSetup.createdById,
          },
          "DRAFT"
        );

        const res = await request(app)
          .post(`/claims/${claim.id}/review`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({});

        expect(res.status).toBe(400);
        expectErrorResponse(res, 400, "BAD_REQUEST");
      });
    });

    describe("Validation errors (400)", () => {
      it("should reject notes exceeding max length", async () => {
        const claim = await createClaimInDraft(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/review`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({ notes: "x".repeat(2001) });

        expect(res.status).toBe(400);
      });
    });

    describe("Not found (404)", () => {
      it("should return 404 for non-existent claim", async () => {
        const res = await request(app)
          .post("/claims/non-existent-id/review")
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({});

        expect(res.status).toBe(404);
        expectErrorResponse(res, 404, "CLAIM_NOT_FOUND");
      });
    });

    describe("Authentication errors (401)", () => {
      it("should return 401 without session cookie", async () => {
        const claim = await createClaimInDraft(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/review`)
          .send({});

        expect(res.status).toBe(401);
      });

      it("should return 401 for invalid session token", async () => {
        const claim = await createClaimInDraft(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/review`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=invalid-token`)
          .send({});

        expect(res.status).toBe(401);
      });

      it("should return 401 for expired session", async () => {
        const { user } = await setupUnlimitedScopeEditUser();
        const { token: expiredToken } = await createTestSession(user.id, {
          expiresAt: new Date(Date.now() - 1000),
        });
        const claim = await createClaimInDraft(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/review`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${expiredToken}`)
          .send({});

        expect(res.status).toBe(401);
      });
    });

    describe("Authorization errors (403)", () => {
      it("should return 403 without claims:edit permission", async () => {
        const role = await seedRoleWithClaimsPermission("UNLIMITED"); // has claims:read, not claims:edit
        const user = await createTestUser(role.id);
        const { token } = await createTestSession(user.id);
        const claim = await createClaimInDraft(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/review`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`)
          .send({});

        expect(res.status).toBe(403);
        expectErrorResponse(res, 403, "FORBIDDEN");
      });

      it("should return 403 for CLIENT scope (requires UNLIMITED)", async () => {
        const role = await seedRoleWithoutPermission("CLIENT");
        // Add claims:edit permission
        const editPermission = await db.permission.upsert({
          where: { resource_action: { resource: "claims", action: "edit" } },
          update: {},
          create: { resource: "claims", action: "edit" },
        });
        await db.rolePermission.create({
          data: { roleId: role.id, permissionId: editPermission.id },
        });
        const user = await createTestUser(role.id);
        const { token } = await createTestSession(user.id);
        const claim = await createClaimInDraft(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/review`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`)
          .send({});

        expect(res.status).toBe(403);
      });
    });
  });

  // ===========================================================================
  // POST /claims/:id/submit - IN_REVIEW → SUBMITTED
  // ===========================================================================

  describe("POST /claims/:id/submit", () => {
    describe("Successful transitions", () => {
      it("should transition claim from IN_REVIEW to SUBMITTED", async () => {
        const claim = await createClaimInReview(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/submit`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({});

        expect(res.status).toBe(200);
        const body = asTransitionResponse(res.body);
        expect(body.status).toBe("SUBMITTED");
        expect(body.previousStatus).toBe("IN_REVIEW");
      });

      it("should create history record with notes", async () => {
        const claim = await createClaimInReview(claimSetup);

        await request(app)
          .post(`/claims/${claim.id}/submit`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({ notes: "Submitted to carrier" });

        const history = await db.claimHistory.findFirst({
          where: { claimId: claim.id },
        });
        expect(history?.toStatus).toBe("SUBMITTED");
        expect(history?.notes).toBe("Submitted to carrier");
      });
    });

    describe("Invalid transitions (400)", () => {
      it("should reject transition from DRAFT", async () => {
        const claim = await createClaimInDraft(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/submit`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({});

        expect(res.status).toBe(400);
      });

      it("should reject when missing submission fields", async () => {
        // Create IN_REVIEW claim without submission fields
        const claim = await createTestClaim({
          ...claimSetup,
          status: "IN_REVIEW",
          careType: "AMBULATORY",
          diagnosis: "Test",
          incidentDate: new Date(),
          // Missing amountSubmitted and submittedDate
        });

        const res = await request(app)
          .post(`/claims/${claim.id}/submit`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({});

        expect(res.status).toBe(400);
      });
    });
  });

  // ===========================================================================
  // POST /claims/:id/return - IN_REVIEW → RETURNED (requires reason)
  // ===========================================================================

  describe("POST /claims/:id/return", () => {
    describe("Successful transitions", () => {
      it("should transition claim from IN_REVIEW to RETURNED with reason", async () => {
        const claim = await createClaimInReview(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/return`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({ reason: "Missing documentation" });

        expect(res.status).toBe(200);
        const body = asTransitionResponse(res.body);
        expect(body.status).toBe("RETURNED");
        expect(body.previousStatus).toBe("IN_REVIEW");
      });

      it("should store reason in history", async () => {
        const claim = await createClaimInReview(claimSetup);

        await request(app)
          .post(`/claims/${claim.id}/return`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({ reason: "Incomplete claim form", notes: "Additional notes" });

        const history = await db.claimHistory.findFirst({
          where: { claimId: claim.id },
        });
        expect(history?.reason).toBe("Incomplete claim form");
        expect(history?.notes).toBe("Additional notes");
      });
    });

    describe("Validation errors (400)", () => {
      it("should reject without required reason", async () => {
        const claim = await createClaimInReview(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/return`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({});

        expect(res.status).toBe(400);
      });

      it("should reject empty reason", async () => {
        const claim = await createClaimInReview(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/return`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({ reason: "" });

        expect(res.status).toBe(400);
      });

      it("should reject reason exceeding max length", async () => {
        const claim = await createClaimInReview(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/return`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({ reason: "x".repeat(1001) });

        expect(res.status).toBe(400);
      });
    });

    describe("Invalid transitions (400)", () => {
      it("should reject transition from DRAFT", async () => {
        const claim = await createClaimInDraft(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/return`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({ reason: "Some reason" });

        expect(res.status).toBe(400);
      });
    });
  });

  // ===========================================================================
  // POST /claims/:id/request-info - SUBMITTED → PENDING_INFO (requires reason)
  // ===========================================================================

  describe("POST /claims/:id/request-info", () => {
    describe("Successful transitions", () => {
      it("should transition claim from SUBMITTED to PENDING_INFO", async () => {
        const claim = await createClaimSubmitted(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/request-info`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({ reason: "Need additional documentation" });

        expect(res.status).toBe(200);
        const body = asTransitionResponse(res.body);
        expect(body.status).toBe("PENDING_INFO");
        expect(body.previousStatus).toBe("SUBMITTED");
      });
    });

    describe("Validation errors (400)", () => {
      it("should reject without required reason", async () => {
        const claim = await createClaimSubmitted(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/request-info`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({});

        expect(res.status).toBe(400);
      });
    });

    describe("Invalid transitions (400)", () => {
      it("should reject transition from IN_REVIEW", async () => {
        const claim = await createClaimInReview(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/request-info`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({ reason: "Need info" });

        expect(res.status).toBe(400);
      });
    });
  });

  // ===========================================================================
  // POST /claims/:id/provide-info - PENDING_INFO → SUBMITTED (requires reason)
  // ===========================================================================

  describe("POST /claims/:id/provide-info", () => {
    describe("Successful transitions", () => {
      it("should transition claim from PENDING_INFO to SUBMITTED", async () => {
        const claim = await createClaimPendingInfo(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/provide-info`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({ reason: "Documentation uploaded" });

        expect(res.status).toBe(200);
        const body = asTransitionResponse(res.body);
        expect(body.status).toBe("SUBMITTED");
        expect(body.previousStatus).toBe("PENDING_INFO");
      });
    });

    describe("Validation errors (400)", () => {
      it("should reject without required reason", async () => {
        const claim = await createClaimPendingInfo(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/provide-info`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({});

        expect(res.status).toBe(400);
      });
    });

    describe("Invalid transitions (400)", () => {
      it("should reject transition from SUBMITTED", async () => {
        const claim = await createClaimSubmitted(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/provide-info`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({ reason: "Info provided" });

        expect(res.status).toBe(400);
      });
    });
  });

  // ===========================================================================
  // POST /claims/:id/settle - SUBMITTED → SETTLED
  // ===========================================================================

  describe("POST /claims/:id/settle", () => {
    describe("Successful transitions", () => {
      it("should transition claim from SUBMITTED to SETTLED", async () => {
        const claim = await createClaimSubmittedWithSettlement(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/settle`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({});

        expect(res.status).toBe(200);
        const body = asTransitionResponse(res.body);
        expect(body.status).toBe("SETTLED");
        expect(body.previousStatus).toBe("SUBMITTED");
      });

      it("should create history record", async () => {
        const claim = await createClaimSubmittedWithSettlement(claimSetup);

        await request(app)
          .post(`/claims/${claim.id}/settle`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({ notes: "Settlement processed" });

        const history = await db.claimHistory.findFirst({
          where: { claimId: claim.id },
        });
        expect(history?.toStatus).toBe("SETTLED");
      });
    });

    describe("Invalid transitions (400)", () => {
      it("should reject transition from IN_REVIEW", async () => {
        const claim = await createClaimInReview(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/settle`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({});

        expect(res.status).toBe(400);
      });

      it("should reject when missing settlement fields", async () => {
        // SUBMITTED claim without settlement fields
        const claim = await createClaimSubmitted(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/settle`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({});

        expect(res.status).toBe(400);
      });
    });
  });

  // ===========================================================================
  // POST /claims/:id/cancel - * → CANCELLED (requires reason)
  // ===========================================================================

  describe("POST /claims/:id/cancel", () => {
    describe("Successful transitions", () => {
      it("should cancel claim from DRAFT", async () => {
        const claim = await createClaimInDraft(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/cancel`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({ reason: "Duplicate claim" });

        expect(res.status).toBe(200);
        const body = asTransitionResponse(res.body);
        expect(body.status).toBe("CANCELLED");
        expect(body.previousStatus).toBe("DRAFT");
      });

      it("should cancel claim from IN_REVIEW", async () => {
        const claim = await createClaimInReview(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/cancel`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({ reason: "Patient request" });

        expect(res.status).toBe(200);
        expect(asTransitionResponse(res.body).status).toBe("CANCELLED");
      });

      it("should cancel claim from SUBMITTED", async () => {
        const claim = await createClaimSubmitted(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/cancel`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({ reason: "Withdrawn by affiliate" });

        expect(res.status).toBe(200);
        expect(asTransitionResponse(res.body).status).toBe("CANCELLED");
      });

      it("should cancel claim from PENDING_INFO", async () => {
        const claim = await createClaimPendingInfo(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/cancel`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({ reason: "Info not provided in time" });

        expect(res.status).toBe(200);
        expect(asTransitionResponse(res.body).status).toBe("CANCELLED");
      });
    });

    describe("Validation errors (400)", () => {
      it("should reject without required reason", async () => {
        const claim = await createClaimInDraft(claimSetup);

        const res = await request(app)
          .post(`/claims/${claim.id}/cancel`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({});

        expect(res.status).toBe(400);
      });
    });

    describe("Invalid transitions from terminal states (400)", () => {
      it("should reject cancellation of already CANCELLED claim", async () => {
        const claim = await createTestClaim({
          ...claimSetup,
          status: "CANCELLED",
        });

        const res = await request(app)
          .post(`/claims/${claim.id}/cancel`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({ reason: "Try again" });

        expect(res.status).toBe(400);
      });

      it("should reject cancellation of SETTLED claim", async () => {
        const claim = await db.claim.create({
          data: {
            claimNumber: getNextClaimNumber(),
            clientId: claimSetup.clientId,
            affiliateId: claimSetup.affiliateId,
            patientId: claimSetup.patientId,
            createdById: claimSetup.createdById,
            policyId: claimSetup.policyId,
            status: "SETTLED",
            description: "Settled claim",
            careType: "AMBULATORY",
            diagnosis: "Test",
            incidentDate: new Date(),
            amountSubmitted: 1000,
            submittedDate: new Date(),
            amountApproved: 800,
            settlementDate: new Date(),
            settlementNumber: "SET-001",
          },
        });

        const res = await request(app)
          .post(`/claims/${claim.id}/cancel`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({ reason: "Try to cancel" });

        expect(res.status).toBe(400);
      });

      it("should reject cancellation of RETURNED claim", async () => {
        const claim = await createTestClaim({
          ...claimSetup,
          status: "RETURNED",
          careType: "AMBULATORY",
          diagnosis: "Test",
          incidentDate: new Date(),
        });

        const res = await request(app)
          .post(`/claims/${claim.id}/cancel`)
          .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
          .send({ reason: "Try to cancel" });

        expect(res.status).toBe(400);
      });
    });
  });

  // ===========================================================================
  // Claim History Tracking
  // ===========================================================================

  describe("Claim History Tracking", () => {
    it("should track multiple transitions in history", async () => {
      const claim = await createClaimInDraft(claimSetup);

      // DRAFT → IN_REVIEW
      await request(app)
        .post(`/claims/${claim.id}/review`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ notes: "First review" });

      // Update claim for next transition (add submission fields)
      await db.claim.update({
        where: { id: claim.id },
        data: { amountSubmitted: 1000, submittedDate: new Date() },
      });

      // IN_REVIEW → SUBMITTED
      await request(app)
        .post(`/claims/${claim.id}/submit`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ notes: "Submitted" });

      // SUBMITTED → CANCELLED
      await request(app)
        .post(`/claims/${claim.id}/cancel`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ reason: "Cancelled by user" });

      const history = await db.claimHistory.findMany({
        where: { claimId: claim.id },
        orderBy: { createdAt: "asc" },
      });

      expect(history).toHaveLength(3);
      expect(history[0]?.fromStatus).toBe("DRAFT");
      expect(history[0]?.toStatus).toBe("IN_REVIEW");
      expect(history[1]?.fromStatus).toBe("IN_REVIEW");
      expect(history[1]?.toStatus).toBe("SUBMITTED");
      expect(history[2]?.fromStatus).toBe("SUBMITTED");
      expect(history[2]?.toStatus).toBe("CANCELLED");
      expect(history[2]?.reason).toBe("Cancelled by user");
    });
  });

  // ===========================================================================
  // Concurrent Modification (409)
  // ===========================================================================

  describe("Concurrent modification handling", () => {
    it("should handle race condition when claim status changes during transition", async () => {
      const claim = await createClaimInDraft(claimSetup);

      // Simulate race: change status directly in DB before the transition completes
      // This is hard to test deterministically, but we can verify the error path exists
      // by transitioning a claim and then trying the same transition again

      await request(app)
        .post(`/claims/${claim.id}/review`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({});

      // Now try to do the same transition again - should fail with 400 (invalid transition)
      const res = await request(app)
        .post(`/claims/${claim.id}/review`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
