import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { db } from "../../../../config/db.js";
import { createTestApp } from "../../../../test/helpers/index.js";
import { cleanDatabase } from "../../../../test/db-utils.js";
import {
  seedRoleWithClaimsPermission,
  seedRoleWithClaimsReadAndEditPermission,
  seedRoleWithoutPermission,
  createTestUser,
  createTestSession,
  createTestClient,
  createTestAffiliate,
  createTestEmployee,
  createTestClaim,
  createTestClaimInvoice,
  resetClaimNumberCounter,
  SESSION_COOKIE_NAME,
} from "../../__tests__/fixtures.js";

interface ClaimInvoiceResponse {
  id: string;
  claimId: string;
  invoiceNumber: string;
  providerName: string;
  amountSubmitted: string;
  createdBy: { id: string; name: string };
  createdAt: string;
}

interface ListClaimInvoicesResponse {
  data: ClaimInvoiceResponse[];
}

interface ErrorResponse {
  error: {
    message: string;
    code: string;
    requestId?: string;
  };
}

const asInvoiceResponse = (body: unknown): ClaimInvoiceResponse =>
  body as ClaimInvoiceResponse;

const asListResponse = (body: unknown): ListClaimInvoicesResponse =>
  body as ListClaimInvoicesResponse;

const asErrorResponse = (body: unknown): ErrorResponse =>
  body as ErrorResponse;

describe("Claim Invoices API", () => {
  const app = createTestApp();

  let testClient: Awaited<ReturnType<typeof createTestClient>>;
  let testAffiliate: Awaited<ReturnType<typeof createTestAffiliate>>;
  let testClaim: Awaited<ReturnType<typeof createTestClaim>>;
  let testUser: Awaited<ReturnType<typeof createTestUser>>;
  let testEmployee: Awaited<ReturnType<typeof createTestEmployee>>;
  let sessionToken: string;

  async function setupReadUser() {
    const role = await seedRoleWithClaimsPermission("UNLIMITED");
    const employee = await createTestEmployee();
    const user = await createTestUser(role.id);
    await db.employee.update({
      where: { id: employee.id },
      data: { userId: user.id },
    });
    const { token } = await createTestSession(user.id);
    return { user, employee, token };
  }

  beforeEach(async () => {
    await cleanDatabase();
    await resetClaimNumberCounter();

    testClient = await createTestClient("Test Client");
    testAffiliate = await createTestAffiliate(testClient.id, {
      firstName: "John",
      lastName: "Doe",
    });

    const role = await seedRoleWithClaimsReadAndEditPermission("UNLIMITED");
    testEmployee = await createTestEmployee({ firstName: "Admin", lastName: "User" });
    testUser = await createTestUser(role.id);
    await db.employee.update({
      where: { id: testEmployee.id },
      data: { userId: testUser.id },
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
  // GET /claims/:claimId/invoices - List Invoices
  // ===========================================================================

  describe("GET /claims/:claimId/invoices - List Invoices", () => {
    it("should return empty array when no invoices exist", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/invoices`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asListResponse(res.body);
      expect(body.data).toHaveLength(0);
    });

    it("should return all invoices for a claim", async () => {
      await createTestClaimInvoice({ claimId: testClaim.id, createdById: testUser.id });
      await createTestClaimInvoice({ claimId: testClaim.id, createdById: testUser.id });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/invoices`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asListResponse(res.body);
      expect(body.data).toHaveLength(2);
    });

    it("should return invoices ordered by createdAt desc", async () => {
      const first = await createTestClaimInvoice({
        claimId: testClaim.id,
        createdById: testUser.id,
        invoiceNumber: "INV-001",
      });

      await new Promise((r) => setTimeout(r, 10));

      const second = await createTestClaimInvoice({
        claimId: testClaim.id,
        createdById: testUser.id,
        invoiceNumber: "INV-002",
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/invoices`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asListResponse(res.body);
      expect(body.data[0]!.id).toBe(second.id);
      expect(body.data[1]!.id).toBe(first.id);
    });

    it("should return 404 for non-existent claim", async () => {
      const res = await request(app)
        .get("/claims/nonexistent-claim-id/invoices")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 401 without auth", async () => {
      const res = await request(app).get(`/claims/${testClaim.id}/invoices`);

      expect(res.status).toBe(401);
    });

    it("should return 403 without claims:read permission", async () => {
      const role = await seedRoleWithoutPermission("UNLIMITED");
      const user = await createTestUser(role.id);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get(`/claims/${testClaim.id}/invoices`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(403);
    });

    it("should return 403 without UNLIMITED scope", async () => {
      const role = await seedRoleWithClaimsPermission("CLIENT");
      const user = await createTestUser(role.id);
      const { token } = await createTestSession(user.id);

      const res = await request(app)
        .get(`/claims/${testClaim.id}/invoices`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // GET /claims/:claimId/invoices/:invoiceId - Get Invoice
  // ===========================================================================

  describe("GET /claims/:claimId/invoices/:invoiceId - Get Invoice", () => {
    it("should return single invoice", async () => {
      const invoice = await createTestClaimInvoice({
        claimId: testClaim.id,
        createdById: testUser.id,
        invoiceNumber: "INV-001",
        providerName: "Test Provider",
        amountSubmitted: 500,
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/invoices/${invoice.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asInvoiceResponse(res.body);
      expect(body.id).toBe(invoice.id);
      expect(body.invoiceNumber).toBe("INV-001");
      expect(body.providerName).toBe("Test Provider");
      expect(body.amountSubmitted).toBe("500");
    });

    it("should return 404 for non-existent invoice", async () => {
      const res = await request(app)
        .get(`/claims/${testClaim.id}/invoices/nonexistent-invoice-id`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 when invoice belongs to different claim", async () => {
      const otherClaim = await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testAffiliate.id,
        createdById: testUser.id,
      });

      const invoice = await createTestClaimInvoice({
        claimId: otherClaim.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .get(`/claims/${testClaim.id}/invoices/${invoice.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 for non-existent claim", async () => {
      const res = await request(app)
        .get("/claims/nonexistent-claim-id/invoices/some-invoice-id")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ===========================================================================
  // POST /claims/:claimId/invoices - Create Invoice
  // ===========================================================================

  describe("POST /claims/:claimId/invoices - Create Invoice", () => {
    it("should create invoice and return 201", async () => {
      const res = await request(app)
        .post(`/claims/${testClaim.id}/invoices`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          invoiceNumber: "INV-001",
          providerName: "Test Provider",
          amountSubmitted: "1500.50",
        });

      expect(res.status).toBe(201);
      const body = asInvoiceResponse(res.body);
      expect(body.id).toBeDefined();
      expect(body.claimId).toBe(testClaim.id);
      expect(body.invoiceNumber).toBe("INV-001");
      expect(body.providerName).toBe("Test Provider");
      expect(body.amountSubmitted).toBe("1500.5");
    });

    it("should store invoice in database", async () => {
      const res = await request(app)
        .post(`/claims/${testClaim.id}/invoices`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          invoiceNumber: "INV-002",
          providerName: "Another Provider",
          amountSubmitted: "2000",
        });

      expect(res.status).toBe(201);

      const invoice = await db.claimInvoice.findUnique({
        where: { id: asInvoiceResponse(res.body).id },
      });
      expect(invoice).not.toBeNull();
      expect(invoice!.invoiceNumber).toBe("INV-002");
      expect(invoice!.providerName).toBe("Another Provider");
    });

    it("should return 400 for claim in SETTLED status", async () => {
      await db.claim.update({
        where: { id: testClaim.id },
        data: { status: "SETTLED" },
      });

      const res = await request(app)
        .post(`/claims/${testClaim.id}/invoices`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          invoiceNumber: "INV-001",
          providerName: "Test Provider",
          amountSubmitted: "500",
        });

      expect(res.status).toBe(400);
      expect(asErrorResponse(res.body).error.message).toContain("SETTLED");
    });

    it("should return 400 for claim in CANCELLED status", async () => {
      await db.claim.update({
        where: { id: testClaim.id },
        data: { status: "CANCELLED" },
      });

      const res = await request(app)
        .post(`/claims/${testClaim.id}/invoices`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          invoiceNumber: "INV-001",
          providerName: "Test Provider",
          amountSubmitted: "500",
        });

      expect(res.status).toBe(400);
      expect(asErrorResponse(res.body).error.message).toContain("CANCELLED");
    });

    it("should return 400 for claim in RETURNED status", async () => {
      await db.claim.update({
        where: { id: testClaim.id },
        data: { status: "RETURNED" },
      });

      const res = await request(app)
        .post(`/claims/${testClaim.id}/invoices`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          invoiceNumber: "INV-001",
          providerName: "Test Provider",
          amountSubmitted: "500",
        });

      expect(res.status).toBe(400);
      expect(asErrorResponse(res.body).error.message).toContain("RETURNED");
    });

    it("should allow creation for claim in IN_REVIEW status", async () => {
      await db.claim.update({
        where: { id: testClaim.id },
        data: { status: "IN_REVIEW" },
      });

      const res = await request(app)
        .post(`/claims/${testClaim.id}/invoices`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          invoiceNumber: "INV-001",
          providerName: "Test Provider",
          amountSubmitted: "500",
        });

      expect(res.status).toBe(201);
    });

    it("should return 404 for non-existent claim", async () => {
      const res = await request(app)
        .post("/claims/nonexistent-claim-id/invoices")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          invoiceNumber: "INV-001",
          providerName: "Test Provider",
          amountSubmitted: "500",
        });

      expect(res.status).toBe(404);
    });

    it("should return 400 for missing required fields", async () => {
      const res = await request(app)
        .post(`/claims/${testClaim.id}/invoices`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          invoiceNumber: "INV-001",
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid decimal format", async () => {
      const res = await request(app)
        .post(`/claims/${testClaim.id}/invoices`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          invoiceNumber: "INV-001",
          providerName: "Test Provider",
          amountSubmitted: "invalid",
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 for decimal with more than 2 places", async () => {
      const res = await request(app)
        .post(`/claims/${testClaim.id}/invoices`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          invoiceNumber: "INV-001",
          providerName: "Test Provider",
          amountSubmitted: "100.999",
        });

      expect(res.status).toBe(400);
    });

    it("should return 401 without auth", async () => {
      const res = await request(app)
        .post(`/claims/${testClaim.id}/invoices`)
        .send({
          invoiceNumber: "INV-001",
          providerName: "Test Provider",
          amountSubmitted: "500",
        });

      expect(res.status).toBe(401);
    });

    it("should return 403 without claims:edit permission", async () => {
      const { token } = await setupReadUser();

      const res = await request(app)
        .post(`/claims/${testClaim.id}/invoices`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`)
        .send({
          invoiceNumber: "INV-001",
          providerName: "Test Provider",
          amountSubmitted: "500",
        });

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // PATCH /claims/:claimId/invoices/:invoiceId - Update Invoice
  // ===========================================================================

  describe("PATCH /claims/:claimId/invoices/:invoiceId - Update Invoice", () => {
    it("should update single field", async () => {
      const invoice = await createTestClaimInvoice({
        claimId: testClaim.id,
        createdById: testUser.id,
        invoiceNumber: "INV-001",
        providerName: "Old Provider",
        amountSubmitted: 500,
      });

      const res = await request(app)
        .patch(`/claims/${testClaim.id}/invoices/${invoice.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          providerName: "New Provider",
        });

      expect(res.status).toBe(200);
      const body = asInvoiceResponse(res.body);
      expect(body.providerName).toBe("New Provider");
      expect(body.invoiceNumber).toBe("INV-001");
    });

    it("should update multiple fields", async () => {
      const invoice = await createTestClaimInvoice({
        claimId: testClaim.id,
        createdById: testUser.id,
        invoiceNumber: "INV-001",
        providerName: "Old Provider",
        amountSubmitted: 500,
      });

      const res = await request(app)
        .patch(`/claims/${testClaim.id}/invoices/${invoice.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          invoiceNumber: "INV-002",
          providerName: "New Provider",
          amountSubmitted: "750.99",
        });

      expect(res.status).toBe(200);
      const body = asInvoiceResponse(res.body);
      expect(body.invoiceNumber).toBe("INV-002");
      expect(body.providerName).toBe("New Provider");
      expect(body.amountSubmitted).toBe("750.99");
    });

    it("should return unchanged invoice when no fields provided", async () => {
      const invoice = await createTestClaimInvoice({
        claimId: testClaim.id,
        createdById: testUser.id,
        invoiceNumber: "INV-001",
      });

      const res = await request(app)
        .patch(`/claims/${testClaim.id}/invoices/${invoice.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({});

      expect(res.status).toBe(200);
      const body = asInvoiceResponse(res.body);
      expect(body.invoiceNumber).toBe("INV-001");
    });

    it("should return 400 for terminal claim status", async () => {
      const invoice = await createTestClaimInvoice({
        claimId: testClaim.id,
        createdById: testUser.id,
      });

      await db.claim.update({
        where: { id: testClaim.id },
        data: { status: "SETTLED" },
      });

      const res = await request(app)
        .patch(`/claims/${testClaim.id}/invoices/${invoice.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          providerName: "New Provider",
        });

      expect(res.status).toBe(400);
    });

    it("should return 404 for non-existent invoice", async () => {
      const res = await request(app)
        .patch(`/claims/${testClaim.id}/invoices/nonexistent-invoice-id`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          providerName: "New Provider",
        });

      expect(res.status).toBe(404);
    });

    it("should return 404 when invoice belongs to different claim", async () => {
      const otherClaim = await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testAffiliate.id,
        createdById: testUser.id,
      });

      const invoice = await createTestClaimInvoice({
        claimId: otherClaim.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .patch(`/claims/${testClaim.id}/invoices/${invoice.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          providerName: "New Provider",
        });

      expect(res.status).toBe(404);
    });
  });

  // ===========================================================================
  // DELETE /claims/:claimId/invoices/:invoiceId - Delete Invoice
  // ===========================================================================

  describe("DELETE /claims/:claimId/invoices/:invoiceId - Delete Invoice", () => {
    it("should delete invoice and return 204", async () => {
      const invoice = await createTestClaimInvoice({
        claimId: testClaim.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .delete(`/claims/${testClaim.id}/invoices/${invoice.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(204);

      const deleted = await db.claimInvoice.findUnique({
        where: { id: invoice.id },
      });
      expect(deleted).toBeNull();
    });

    it("should return 400 for terminal claim status", async () => {
      const invoice = await createTestClaimInvoice({
        claimId: testClaim.id,
        createdById: testUser.id,
      });

      await db.claim.update({
        where: { id: testClaim.id },
        data: { status: "CANCELLED" },
      });

      const res = await request(app)
        .delete(`/claims/${testClaim.id}/invoices/${invoice.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
    });

    it("should return 404 for non-existent invoice", async () => {
      const res = await request(app)
        .delete(`/claims/${testClaim.id}/invoices/nonexistent-invoice-id`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 when invoice belongs to different claim", async () => {
      const otherClaim = await createTestClaim({
        clientId: testClient.id,
        affiliateId: testAffiliate.id,
        patientId: testAffiliate.id,
        createdById: testUser.id,
      });

      const invoice = await createTestClaimInvoice({
        claimId: otherClaim.id,
        createdById: testUser.id,
      });

      const res = await request(app)
        .delete(`/claims/${testClaim.id}/invoices/${invoice.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 403 without claims:edit permission", async () => {
      const invoice = await createTestClaimInvoice({
        claimId: testClaim.id,
        createdById: testUser.id,
      });

      const { token } = await setupReadUser();

      const res = await request(app)
        .delete(`/claims/${testClaim.id}/invoices/${invoice.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // Audit Logging
  // ===========================================================================

  describe("Audit logging", () => {
    it("should create audit log on invoice creation", async () => {
      await db.auditLog.deleteMany();

      const res = await request(app)
        .post(`/claims/${testClaim.id}/invoices`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          invoiceNumber: "INV-001",
          providerName: "Test Provider",
          amountSubmitted: "500",
        });

      expect(res.status).toBe(201);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "CREATE",
          resource: "ClaimInvoice",
          resourceId: asInvoiceResponse(res.body).id,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.userId).toBe(testUser.id);
    });

    it("should create audit log on invoice update", async () => {
      const invoice = await createTestClaimInvoice({
        claimId: testClaim.id,
        createdById: testUser.id,
      });

      await db.auditLog.deleteMany();

      const res = await request(app)
        .patch(`/claims/${testClaim.id}/invoices/${invoice.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          providerName: "New Provider",
        });

      expect(res.status).toBe(200);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "UPDATE",
          resource: "ClaimInvoice",
          resourceId: invoice.id,
        },
      });

      expect(auditLog).not.toBeNull();
    });

    it("should create audit log on invoice deletion", async () => {
      const invoice = await createTestClaimInvoice({
        claimId: testClaim.id,
        createdById: testUser.id,
      });

      await db.auditLog.deleteMany();

      const res = await request(app)
        .delete(`/claims/${testClaim.id}/invoices/${invoice.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(204);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "DELETE",
          resource: "ClaimInvoice",
          resourceId: invoice.id,
        },
      });

      expect(auditLog).not.toBeNull();
    });
  });
});
