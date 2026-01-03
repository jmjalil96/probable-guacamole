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
  createTestClaims,
  setupClientScopeUser,
  setupSelfScopeUser,
  resetClaimNumberCounter,
  SESSION_COOKIE_NAME,
} from "./fixtures.js";

interface ClaimListItem {
  id: string;
  claimNumber: number;
  status: string;
  description: string;
  careType: string | null;
  diagnosis: string | null;
  amountSubmitted: string | null;
  amountApproved: string | null;
  amountDenied: string | null;
  amountUnprocessed: string | null;
  deductibleApplied: string | null;
  copayApplied: string | null;
  incidentDate: string | null;
  submittedDate: string | null;
  settlementDate: string | null;
  businessDays: number | null;
  settlementNumber: string | null;
  settlementNotes: string | null;
  patient: { id: string; name: string };
  affiliate: { id: string; name: string };
  client: { id: string; name: string };
  policy: { id: string; number: string } | null;
  createdBy: { id: string; name: string };
  updatedBy: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface ListClaimsResponse {
  data: ClaimListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Helper to type response body
const asListResponse = (body: unknown): ListClaimsResponse =>
  body as ListClaimsResponse;

describe("GET /claims - List Claims", () => {
  const app = createTestApp();

  // Base test data
  let testClient: Awaited<ReturnType<typeof createTestClient>>;
  let testAffiliate: Awaited<ReturnType<typeof createTestAffiliate>>;
  let testPatient: Awaited<ReturnType<typeof createTestAffiliate>>;
  let testUser: Awaited<ReturnType<typeof createTestUser>>;
  let testEmployee: Awaited<ReturnType<typeof createTestEmployee>>;
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

    // Create user with claims:read permission
    const role = await seedRoleWithClaimsPermission("UNLIMITED");
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
  // Successful list retrieval
  // ===========================================================================

  describe("Successful list retrieval", () => {
    it("should return 200 with paginated claims", async () => {
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .get("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asListResponse(res.body);
      expect(body).toHaveProperty("data");
      expect(body).toHaveProperty("pagination");
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(1);
    });

    it("should return empty array when no claims exist", async () => {
      const res = await request(app)
        .get("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asListResponse(res.body);
      expect(body.data).toEqual([]);
      expect(body.pagination.total).toBe(0);
    });

    it("should include all expected response fields", async () => {
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        status: "SUBMITTED",
        careType: "AMBULATORY",
        diagnosis: "Test diagnosis",
        amountSubmitted: 1000.50,
      });

      const res = await request(app)
        .get("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asListResponse(res.body);
      const claim = body.data[0]!;

      expect(claim.id).toEqual(expect.any(String));
      expect(claim.claimNumber).toEqual(expect.any(Number));
      expect(claim.status).toBe("SUBMITTED");
      expect(claim.description).toEqual(expect.any(String));
      expect(claim.careType).toBe("AMBULATORY");
      expect(claim.diagnosis).toBe("Test diagnosis");
      expect(claim.patient).toEqual({ id: testPatient.id, name: "Jane Patient" });
      expect(claim.affiliate).toEqual({ id: testAffiliate.id, name: "John Doe" });
      expect(claim.client).toEqual({ id: testClient.id, name: "Test Client" });
      expect(claim.createdBy.id).toBe(testUser.id);
      expect(claim.createdBy.name).toEqual(expect.any(String));
      expect(claim.createdAt).toEqual(expect.any(String));
      expect(claim.updatedAt).toEqual(expect.any(String));
    });

    it("should transform Decimal amounts to strings", async () => {
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        amountSubmitted: 1234.56,
        amountApproved: 1000.00,
      });

      const res = await request(app)
        .get("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asListResponse(res.body);
      const claim = body.data[0]!;

      expect(claim.amountSubmitted).toBe("1234.56");
      expect(claim.amountApproved).toBe("1000");
    });
  });

  // ===========================================================================
  // Pagination
  // ===========================================================================

  describe("Pagination", () => {
    beforeEach(async () => {
      // Create 25 claims for pagination tests
      await createTestClaims(
        {
          clientId: testClient.id,
          affiliateId: testAffiliate.id,
          patientId: testPatient.id,
          createdById: testUser.id,
        },
        25
      );
    });

    it("should default to page=1 and limit=20", async () => {
      const res = await request(app)
        .get("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asListResponse(res.body);
      expect(body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 25,
        totalPages: 2,
      });
      expect(body.data).toHaveLength(20);
    });

    it("should respect page parameter", async () => {
      const res = await request(app)
        .get("/claims?page=2")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asListResponse(res.body);
      expect(body.pagination.page).toBe(2);
      expect(body.data).toHaveLength(5); // 25 - 20 = 5 remaining
    });

    it("should respect limit parameter", async () => {
      const res = await request(app)
        .get("/claims?limit=10")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asListResponse(res.body);
      expect(body.pagination.limit).toBe(10);
      expect(body.data).toHaveLength(10);
      expect(body.pagination.totalPages).toBe(3);
    });

    it("should return correct totalPages calculation", async () => {
      const res = await request(app)
        .get("/claims?limit=7")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asListResponse(res.body);
      expect(body.pagination.totalPages).toBe(4); // ceil(25/7) = 4
    });

    it("should cap limit at 100", async () => {
      const res = await request(app)
        .get("/claims?limit=150")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      // Zod coerces and validates - should return 400 for limit > 100
      expect(res.status).toBe(400);
    });
  });

  // ===========================================================================
  // Sorting
  // ===========================================================================

  describe("Sorting", () => {
    it("should sort by createdAt desc by default", async () => {
      const claim1 = await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      // Small delay to ensure different createdAt
      await new Promise((r) => setTimeout(r, 10));

      const claim2 = await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .get("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const data = asListResponse(res.body).data;
      expect(data[0]!.id).toBe(claim2.id); // Most recent first
      expect(data[1]!.id).toBe(claim1.id);
    });

    it("should sort by claimNumber", async () => {
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        claimNumber: 5000,
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        claimNumber: 3000,
      });

      const res = await request(app)
        .get("/claims?sortBy=claimNumber&sortOrder=asc")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const data = asListResponse(res.body).data;
      expect(data[0]!.claimNumber).toBe(3000);
      expect(data[1]!.claimNumber).toBe(5000);
    });

    it("should sort by submittedDate", async () => {
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        submittedDate: new Date("2024-01-15"),
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        submittedDate: new Date("2024-06-20"),
      });

      const res = await request(app)
        .get("/claims?sortBy=submittedDate&sortOrder=desc")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const data = asListResponse(res.body).data;
      expect(new Date(data[0]!.submittedDate!).getTime()).toBeGreaterThan(
        new Date(data[1]!.submittedDate!).getTime()
      );
    });

    it("should sort by status", async () => {
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        status: "SUBMITTED",
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        status: "DRAFT",
      });

      const res = await request(app)
        .get("/claims?sortBy=status&sortOrder=asc")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const data = asListResponse(res.body).data;
      // DRAFT comes before SUBMITTED alphabetically
      expect(data[0]!.status).toBe("DRAFT");
      expect(data[1]!.status).toBe("SUBMITTED");
    });

    it("should sort by amountSubmitted", async () => {
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        amountSubmitted: 5000,
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        amountSubmitted: 1000,
      });

      const res = await request(app)
        .get("/claims?sortBy=amountSubmitted&sortOrder=asc")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const data = asListResponse(res.body).data;
      expect(parseFloat(data[0]!.amountSubmitted!)).toBe(1000);
      expect(parseFloat(data[1]!.amountSubmitted!)).toBe(5000);
    });

    it("should respect sortOrder asc/desc", async () => {
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        claimNumber: 1001,
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        claimNumber: 1002,
      });

      // Ascending
      const resAsc = await request(app)
        .get("/claims?sortBy=claimNumber&sortOrder=asc")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(asListResponse(resAsc.body).data[0]!.claimNumber).toBe(1001);

      // Descending
      const resDesc = await request(app)
        .get("/claims?sortBy=claimNumber&sortOrder=desc")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(asListResponse(resDesc.body).data[0]!.claimNumber).toBe(1002);
    });
  });

  // ===========================================================================
  // Filtering
  // ===========================================================================

  describe("Filtering", () => {
    it("should filter by single status", async () => {
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        status: "SUBMITTED",
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        status: "DRAFT",
      });

      const res = await request(app)
        .get("/claims?status=SUBMITTED")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).data).toHaveLength(1);
      expect(asListResponse(res.body).data[0]!.status).toBe("SUBMITTED");
    });

    it("should filter by multiple statuses (comma-separated)", async () => {
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        status: "SUBMITTED",
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        status: "IN_REVIEW",
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        status: "DRAFT",
      });

      const res = await request(app)
        .get("/claims?status=SUBMITTED,IN_REVIEW")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).data).toHaveLength(2);
      expect(asListResponse(res.body).data.every((c: ClaimListItem) => ["SUBMITTED", "IN_REVIEW"].includes(c.status))).toBe(
        true
      );
    });

    it("should filter by clientName (contains, case-insensitive)", async () => {
      const client2 = await createTestClient("Other Company");
      const affiliate2 = await createTestAffiliate(client2.id);

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      await createTestClaim({
        clientId: client2.id,
        affiliateId: affiliate2.id,
        patientId: affiliate2.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .get("/claims?clientName=test")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).data).toHaveLength(1);
      expect(asListResponse(res.body).data[0]!.client.name).toBe("Test Client");
    });

    it("should filter by affiliateName", async () => {
      const affiliate2 = await createTestAffiliate(testClient.id, {
        firstName: "Alice",
        lastName: "Smith",
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: affiliate2.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .get("/claims?affiliateName=alice")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).data).toHaveLength(1);
      expect(asListResponse(res.body).data[0]!.affiliate.name).toBe("Alice Smith");
    });

    it("should filter by patientName", async () => {
      const patient2 = await createTestAffiliate(testClient.id, {
        firstName: "Bob",
        lastName: "Wilson",
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: patient2.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .get("/claims?patientName=wilson")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).data).toHaveLength(1);
      expect(asListResponse(res.body).data[0]!.patient.name).toBe("Bob Wilson");
    });

    it("should filter by careType", async () => {
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        careType: "AMBULATORY",
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        careType: "HOSPITALARY",
      });

      const res = await request(app)
        .get("/claims?careType=AMBULATORY")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).data).toHaveLength(1);
      expect(asListResponse(res.body).data[0]!.careType).toBe("AMBULATORY");
    });

    it("should filter by submittedDateFrom", async () => {
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        submittedDate: new Date("2024-01-01"),
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        submittedDate: new Date("2024-06-15"),
      });

      const res = await request(app)
        .get("/claims?submittedDateFrom=2024-03-01")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).data).toHaveLength(1);
    });

    it("should filter by submittedDateTo", async () => {
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        submittedDate: new Date("2024-01-01"),
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        submittedDate: new Date("2024-06-15"),
      });

      const res = await request(app)
        .get("/claims?submittedDateTo=2024-03-01")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).data).toHaveLength(1);
    });

    it("should filter by submittedDate range (inclusive end-of-day)", async () => {
      // This tests the fix we applied - end date should include the full day
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        submittedDate: new Date("2024-01-15"),
      });

      const res = await request(app)
        .get("/claims?submittedDateFrom=2024-01-15&submittedDateTo=2024-01-15")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).data).toHaveLength(1);
    });

    it("should filter by incidentDate range", async () => {
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        incidentDate: new Date("2024-02-10"),
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        incidentDate: new Date("2024-05-20"),
      });

      const res = await request(app)
        .get("/claims?incidentDateFrom=2024-01-01&incidentDateTo=2024-03-01")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).data).toHaveLength(1);
    });

    it("should combine multiple filters", async () => {
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        status: "SUBMITTED",
        careType: "AMBULATORY",
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        status: "SUBMITTED",
        careType: "HOSPITALARY",
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        status: "DRAFT",
        careType: "AMBULATORY",
      });

      const res = await request(app)
        .get("/claims?status=SUBMITTED&careType=AMBULATORY")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).data).toHaveLength(1);
      expect(asListResponse(res.body).data[0]!.status).toBe("SUBMITTED");
      expect(asListResponse(res.body).data[0]!.careType).toBe("AMBULATORY");
    });
  });

  // ===========================================================================
  // Search
  // ===========================================================================

  describe("Search", () => {
    it("should search by claim number (exact match)", async () => {
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        claimNumber: 12345,
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        claimNumber: 67890,
      });

      const res = await request(app)
        .get("/claims?search=12345")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).data).toHaveLength(1);
      expect(asListResponse(res.body).data[0]!.claimNumber).toBe(12345);
    });

    it("should search by affiliate firstName", async () => {
      const affiliate2 = await createTestAffiliate(testClient.id, {
        firstName: "Unique",
        lastName: "Person",
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: affiliate2.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .get("/claims?search=Unique")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).data).toHaveLength(1);
      expect(asListResponse(res.body).data[0]!.affiliate.name).toContain("Unique");
    });

    it("should search by affiliate lastName", async () => {
      const affiliate2 = await createTestAffiliate(testClient.id, {
        firstName: "Test",
        lastName: "Searchable",
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: affiliate2.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .get("/claims?search=Searchable")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).data).toHaveLength(1);
    });

    it("should search by patient firstName", async () => {
      const patient2 = await createTestAffiliate(testClient.id, {
        firstName: "Special",
        lastName: "Patient",
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: patient2.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .get("/claims?search=Special")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).data).toHaveLength(1);
      expect(asListResponse(res.body).data[0]!.patient.name).toContain("Special");
    });

    it("should search by patient lastName", async () => {
      const patient2 = await createTestAffiliate(testClient.id, {
        firstName: "Test",
        lastName: "Findable",
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: patient2.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .get("/claims?search=Findable")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).data).toHaveLength(1);
    });

    it("should return empty when no matches", async () => {
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .get("/claims?search=nonexistent999")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).data).toHaveLength(0);
    });
  });

  // ===========================================================================
  // Scope-based access
  // ===========================================================================

  describe("Scope-based access", () => {
    it("UNLIMITED scope should return all claims", async () => {
      const client2 = await createTestClient("Another Client");
      const affiliate2 = await createTestAffiliate(client2.id);

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      await createTestClaim({
        clientId: client2.id,
        affiliateId: affiliate2.id,
        patientId: affiliate2.id,
        createdById: testUser.id,
      });

      // testUser has UNLIMITED scope
      const res = await request(app)
        .get("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).data).toHaveLength(2);
    });

    it("CLIENT scope should return only claims for assigned clients", async () => {
      const client2 = await createTestClient("Unassigned Client");
      const affiliate2 = await createTestAffiliate(client2.id);

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      await createTestClaim({
        clientId: client2.id,
        affiliateId: affiliate2.id,
        patientId: affiliate2.id,
        createdById: testUser.id,
      });

      // Setup user with CLIENT scope assigned to testClient only
      const { token: clientScopeToken } = await setupClientScopeUser([testClient.id]);

      const res = await request(app)
        .get("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientScopeToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).data).toHaveLength(1);
      expect(asListResponse(res.body).data[0]!.client.id).toBe(testClient.id);
    });

    it("CLIENT scope should return empty when no assigned clients", async () => {
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      // Setup user with CLIENT scope but no assigned clients
      const { token: clientScopeToken } = await setupClientScopeUser([]);

      const res = await request(app)
        .get("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientScopeToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).data).toHaveLength(0);
    });

    it("SELF scope should return only affiliate's own claims", async () => {
      // Setup user with SELF scope
      const { affiliate: selfAffiliate, token: selfScopeToken } =
        await setupSelfScopeUser(testClient.id);

      // Create claim for the self-scope user's affiliate
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: selfAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      // Create claim for a different affiliate
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .get("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${selfScopeToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).data).toHaveLength(1);
      expect(asListResponse(res.body).data[0]!.affiliate.id).toBe(selfAffiliate.id);
    });

    it("SELF scope should return empty when affiliate has no claims", async () => {
      // Setup user with SELF scope (new affiliate with no claims)
      const { token: selfScopeToken } = await setupSelfScopeUser(testClient.id);

      // Create claim for a different affiliate
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .get("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${selfScopeToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).data).toHaveLength(0);
    });
  });

  // ===========================================================================
  // Authentication
  // ===========================================================================

  describe("Authentication", () => {
    it("should return 401 without session cookie", async () => {
      const res = await request(app).get("/claims");

      expect(res.status).toBe(401);
    });

    it("should return 401 with invalid session token", async () => {
      const res = await request(app)
        .get("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=invalid-token`);

      expect(res.status).toBe(401);
    });

    it("should return 401 with expired session", async () => {
      const { token: expiredToken } = await createTestSession(testUser.id, {
        expiresAt: new Date(Date.now() - 1000), // Expired
      });

      const res = await request(app)
        .get("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${expiredToken}`);

      expect(res.status).toBe(401);
    });

    it("should return 401 with revoked session", async () => {
      const { token: revokedToken } = await createTestSession(testUser.id, {
        revokedAt: new Date(),
      });

      const res = await request(app)
        .get("/claims")
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
        .get("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });

    it("should return 200 with claims:read permission", async () => {
      // testUser already has claims:read permission
      const res = await request(app)
        .get("/claims")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
    });
  });

  // ===========================================================================
  // Validation errors
  // ===========================================================================

  describe("Validation errors", () => {
    it("should return 400 for invalid page (0)", async () => {
      const res = await request(app)
        .get("/claims?page=0")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid page (negative)", async () => {
      const res = await request(app)
        .get("/claims?page=-1")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid limit (0)", async () => {
      const res = await request(app)
        .get("/claims?limit=0")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid sortBy value", async () => {
      const res = await request(app)
        .get("/claims?sortBy=invalidField")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid status value", async () => {
      const res = await request(app)
        .get("/claims?status=INVALID_STATUS")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid date format", async () => {
      const res = await request(app)
        .get("/claims?submittedDateFrom=not-a-date")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid careType", async () => {
      const res = await request(app)
        .get("/claims?careType=INVALID_TYPE")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
    });
  });

  // ===========================================================================
  // Empty string query parameters (should use defaults)
  // ===========================================================================

  describe("Empty string query parameters", () => {
    it("should use default page when page is empty string", async () => {
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .get("/claims?page=")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).pagination.page).toBe(1);
    });

    it("should use default limit when limit is empty string", async () => {
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .get("/claims?limit=")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).pagination.limit).toBe(20);
    });

    it("should use default sortBy when sortBy is empty string", async () => {
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      await new Promise((r) => setTimeout(r, 10));

      const claim2 = await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .get("/claims?sortBy=")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      // Default is createdAt desc, so claim2 should be first
      expect(asListResponse(res.body).data[0]!.id).toBe(claim2.id);
    });

    it("should use default sortOrder when sortOrder is empty string", async () => {
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        claimNumber: 1001,
      });

      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
        claimNumber: 1002,
      });

      const res = await request(app)
        .get("/claims?sortBy=claimNumber&sortOrder=")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      // Default sortOrder is desc
      expect(asListResponse(res.body).data[0]!.claimNumber).toBe(1002);
    });

    it("should handle multiple empty string params", async () => {
      await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testPatient.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .get("/claims?page=&limit=&sortBy=&sortOrder=")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      expect(asListResponse(res.body).pagination.page).toBe(1);
      expect(asListResponse(res.body).pagination.limit).toBe(20);
    });
  });

  // ===========================================================================
  // Invalid calendar date validation
  // ===========================================================================

  describe("Invalid calendar date validation", () => {
    it("should return 400 for February 30th", async () => {
      const res = await request(app)
        .get("/claims?submittedDateFrom=2024-02-30")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
    });

    it("should return 400 for non-leap year February 29th", async () => {
      const res = await request(app)
        .get("/claims?incidentDateFrom=2023-02-29")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
    });

    it("should accept leap year February 29th", async () => {
      const res = await request(app)
        .get("/claims?incidentDateFrom=2024-02-29")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
    });

    it("should return 400 for April 31st", async () => {
      const res = await request(app)
        .get("/claims?submittedDateTo=2024-04-31")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
    });

    it("should return 400 for month 13", async () => {
      const res = await request(app)
        .get("/claims?submittedDateFrom=2024-13-01")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
    });

    it("should return 400 for month 00", async () => {
      const res = await request(app)
        .get("/claims?incidentDateTo=2024-00-15")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
    });
  });
});
