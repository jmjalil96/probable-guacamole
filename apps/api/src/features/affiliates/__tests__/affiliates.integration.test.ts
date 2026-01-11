import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { createTestApp } from "../../../test/helpers/index.js";
import { cleanDatabase } from "../../../test/db-utils.js";
import {
  seedRoleWithAffiliatesPermission,
  seedRoleWithoutPermission,
  seedRoleWithNonUnlimitedScope,
  createTestUser,
  createTestSession,
  createTestClient,
  createTestAffiliate,
  SESSION_COOKIE_NAME,
} from "./fixtures.js";

interface AffiliateListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  documentType: string;
  documentNumber: string | null;
  isActive: boolean;
  hasPortalAccess: boolean;
  portalAccessStatus: "active" | "pending" | "none";
  client: { id: string; name: string };
  dependentsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ListAffiliatesResponse {
  data: AffiliateListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AffiliateDetailResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  documentType: string;
  documentNumber: string | null;
  relationship: string | null;
  isActive: boolean;
  hasPortalAccess: boolean;
  portalAccessStatus: string;
  client: { id: string; name: string };
  dependents: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
  dependentsCount: number;
  createdAt: string;
  updatedAt: string;
}

const asList = (body: unknown): ListAffiliatesResponse => body as ListAffiliatesResponse;
const asDetail = (body: unknown): AffiliateDetailResponse => body as AffiliateDetailResponse;

describe("Affiliates API", () => {
  const app = createTestApp();

  let testUser: Awaited<ReturnType<typeof createTestUser>>;
  let sessionToken: string;
  let testClient: Awaited<ReturnType<typeof createTestClient>>;

  beforeEach(async () => {
    await cleanDatabase();

    const role = await seedRoleWithAffiliatesPermission("UNLIMITED");
    testUser = await createTestUser(role.id);
    testClient = await createTestClient("Test Client");

    const session = await createTestSession(testUser.id);
    sessionToken = session.token;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // ===========================================================================
  // GET / - List Affiliates
  // ===========================================================================

  describe("GET / - List Affiliates", () => {
    it("returns list of affiliates", async () => {
      await createTestAffiliate(testClient.id, { firstName: "John", lastName: "Doe" });

      const res = await request(app)
        .get("/affiliates")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0]!.firstName).toBe("John");
      expect(body.data[0]!.lastName).toBe("Doe");
      expect(body.pagination.total).toBe(1);
    });

    it("returns paginated list", async () => {
      await createTestAffiliate(testClient.id, { firstName: "Affiliate", lastName: "One" });
      await createTestAffiliate(testClient.id, { firstName: "Affiliate", lastName: "Two" });
      await createTestAffiliate(testClient.id, { firstName: "Affiliate", lastName: "Three" });

      const res = await request(app)
        .get("/affiliates?limit=2&page=1")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data).toHaveLength(2);
      expect(body.pagination.total).toBe(3);
      expect(body.pagination.totalPages).toBe(2);
    });

    it("filters by clientId", async () => {
      const otherClient = await createTestClient("Other Client");
      await createTestAffiliate(testClient.id, { firstName: "Client1", lastName: "Aff" });
      await createTestAffiliate(otherClient.id, { firstName: "Client2", lastName: "Aff" });

      const res = await request(app)
        .get(`/affiliates?clientId=${testClient.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0]!.client.id).toBe(testClient.id);
    });

    it("filters by isActive=true", async () => {
      await createTestAffiliate(testClient.id, { firstName: "Active", lastName: "Aff", isActive: true });
      await createTestAffiliate(testClient.id, { firstName: "Inactive", lastName: "Aff", isActive: false });

      const res = await request(app)
        .get("/affiliates?isActive=true")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.every((a) => a.isActive === true)).toBe(true);
    });

    it("filters by isActive=false", async () => {
      await createTestAffiliate(testClient.id, { firstName: "Active", lastName: "Aff", isActive: true });
      await createTestAffiliate(testClient.id, { firstName: "Inactive", lastName: "Aff", isActive: false });

      const res = await request(app)
        .get("/affiliates?isActive=false")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.every((a) => a.isActive === false)).toBe(true);
      expect(body.data).toHaveLength(1);
    });

    it("filters by hasPortalAccess=true (user exists)", async () => {
      const userRole = await seedRoleWithAffiliatesPermission("UNLIMITED", "portal-user-role");
      const portalUser = await createTestUser(userRole.id, { email: "portal@example.com" });
      await createTestAffiliate(testClient.id, {
        firstName: "Portal",
        lastName: "User",
        userId: portalUser.id,
      });
      await createTestAffiliate(testClient.id, { firstName: "No", lastName: "Portal" });

      const res = await request(app)
        .get("/affiliates?hasPortalAccess=true")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.every((a) => a.hasPortalAccess === true)).toBe(true);
    });

    it("filters by hasPortalAccess=false (no user, no invitation)", async () => {
      const userRole = await seedRoleWithAffiliatesPermission("UNLIMITED", "portal-user-role");
      const portalUser = await createTestUser(userRole.id, { email: "portal@example.com" });
      await createTestAffiliate(testClient.id, {
        firstName: "Portal",
        lastName: "User",
        userId: portalUser.id,
      });
      await createTestAffiliate(testClient.id, { firstName: "No", lastName: "Portal" });

      const res = await request(app)
        .get("/affiliates?hasPortalAccess=false")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.every((a) => a.hasPortalAccess === false)).toBe(true);
    });

    it("searches by firstName", async () => {
      await createTestAffiliate(testClient.id, { firstName: "Alice", lastName: "Smith" });
      await createTestAffiliate(testClient.id, { firstName: "Bob", lastName: "Jones" });

      const res = await request(app)
        .get("/affiliates?search=Alice")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.some((a) => a.firstName === "Alice")).toBe(true);
      expect(body.data.every((a) => a.firstName === "Bob")).toBe(false);
    });

    it("searches by lastName", async () => {
      await createTestAffiliate(testClient.id, { firstName: "Alice", lastName: "Smith" });
      await createTestAffiliate(testClient.id, { firstName: "Bob", lastName: "Jones" });

      const res = await request(app)
        .get("/affiliates?search=Jones")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.some((a) => a.lastName === "Jones")).toBe(true);
    });

    it("searches by email", async () => {
      await createTestAffiliate(testClient.id, {
        firstName: "Test",
        lastName: "User",
        email: "unique-search@example.com",
      });
      await createTestAffiliate(testClient.id, {
        firstName: "Other",
        lastName: "User",
        email: "other@example.com",
      });

      const res = await request(app)
        .get("/affiliates?search=unique-search")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.some((a) => a.email?.includes("unique-search"))).toBe(true);
    });

    it("searches by documentNumber", async () => {
      await createTestAffiliate(testClient.id, {
        firstName: "Doc",
        lastName: "User",
        documentNumber: "12345678901",
      });
      await createTestAffiliate(testClient.id, {
        firstName: "Other",
        lastName: "User",
        documentNumber: "98765432109",
      });

      const res = await request(app)
        .get("/affiliates?search=12345678901")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.some((a) => a.documentNumber === "12345678901")).toBe(true);
    });

    it("sorts by lastName ascending (default)", async () => {
      await createTestAffiliate(testClient.id, { firstName: "Zack", lastName: "Zulu" });
      await createTestAffiliate(testClient.id, { firstName: "Aaron", lastName: "Alpha" });

      const res = await request(app)
        .get("/affiliates?sortBy=lastName&sortOrder=asc")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      // Should be sorted by lastName then firstName
      expect(body.data[0]!.lastName).toBe("Alpha");
    });

    it("sorts by createdAt descending", async () => {
      const first = await createTestAffiliate(testClient.id, { firstName: "First", lastName: "User" });
      await new Promise((r) => setTimeout(r, 10));
      const second = await createTestAffiliate(testClient.id, { firstName: "Second", lastName: "User" });

      const res = await request(app)
        .get("/affiliates?sortBy=createdAt&sortOrder=desc")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      const ids = body.data.map((a) => a.id);
      expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));
    });

    it("does not return dependent affiliates in list", async () => {
      const primary = await createTestAffiliate(testClient.id, {
        firstName: "Primary",
        lastName: "Affiliate",
      });
      await createTestAffiliate(testClient.id, {
        firstName: "Dependent",
        lastName: "Affiliate",
        primaryAffiliateId: primary.id,
        relationship: "SPOUSE",
      });

      const res = await request(app)
        .get("/affiliates")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      // Only primary affiliates should be returned
      expect(body.data).toHaveLength(1);
      expect(body.data[0]!.firstName).toBe("Primary");
    });

    it("includes dependents count", async () => {
      const primary = await createTestAffiliate(testClient.id, {
        firstName: "Primary",
        lastName: "Affiliate",
      });
      await createTestAffiliate(testClient.id, {
        firstName: "Dep1",
        lastName: "Affiliate",
        primaryAffiliateId: primary.id,
        relationship: "CHILD",
      });
      await createTestAffiliate(testClient.id, {
        firstName: "Dep2",
        lastName: "Affiliate",
        primaryAffiliateId: primary.id,
        relationship: "SPOUSE",
      });

      const res = await request(app)
        .get("/affiliates")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data[0]!.dependentsCount).toBe(2);
    });

    it("requires authentication", async () => {
      const res = await request(app).get("/affiliates");

      expect(res.status).toBe(401);
    });

    it("filters by scope for CLIENT scope users (returns empty if no assigned clients)", async () => {
      // Create an affiliate in our test client
      await createTestAffiliate(testClient.id, { firstName: "Test", lastName: "Affiliate" });

      // CLIENT scope user without any assigned clients sees empty list
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .get("/affiliates")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data).toHaveLength(0);
      expect(body.pagination.total).toBe(0);
    });

    it("requires affiliates:read permission", async () => {
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .get("/affiliates")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // GET /:id - Get Affiliate Detail
  // ===========================================================================

  describe("GET /:id - Get Affiliate Detail", () => {
    it("returns affiliate details", async () => {
      const affiliate = await createTestAffiliate(testClient.id, {
        firstName: "Test",
        lastName: "Affiliate",
        email: "test@example.com",
        phone: "+1234567890",
        documentType: "CPF",
        documentNumber: "12345678901",
      });

      const res = await request(app)
        .get(`/affiliates/${affiliate.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asDetail(res.body);
      expect(body.id).toBe(affiliate.id);
      expect(body.firstName).toBe("Test");
      expect(body.lastName).toBe("Affiliate");
      expect(body.email).toBe("test@example.com");
      expect(body.phone).toBe("+1234567890");
      expect(body.documentType).toBe("CPF");
      expect(body.documentNumber).toBe("12345678901");
      expect(body.isActive).toBe(true);
      expect(body.client.id).toBe(testClient.id);
    });

    it("includes dependents in detail", async () => {
      const primary = await createTestAffiliate(testClient.id, {
        firstName: "Primary",
        lastName: "Affiliate",
      });
      await createTestAffiliate(testClient.id, {
        firstName: "Child",
        lastName: "Affiliate",
        primaryAffiliateId: primary.id,
        relationship: "CHILD",
      });

      const res = await request(app)
        .get(`/affiliates/${primary.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asDetail(res.body);
      expect(body.dependents).toHaveLength(1);
      expect(body.dependents[0]!.firstName).toBe("Child");
      expect(body.dependentsCount).toBe(1);
    });

    it("returns 404 for non-existent affiliate", async () => {
      const res = await request(app)
        .get("/affiliates/nonexistent-id")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("requires authentication", async () => {
      const affiliate = await createTestAffiliate(testClient.id);

      const res = await request(app).get(`/affiliates/${affiliate.id}`);

      expect(res.status).toBe(401);
    });

    it("returns 404 when affiliate is outside user scope", async () => {
      const affiliate = await createTestAffiliate(testClient.id);

      // CLIENT scope user without any assigned clients cannot access affiliate
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .get(`/affiliates/${affiliate.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`);

      // Returns 404 because affiliate is filtered out by scope
      expect(res.status).toBe(404);
    });

    it("requires affiliates:read permission", async () => {
      const affiliate = await createTestAffiliate(testClient.id);
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .get(`/affiliates/${affiliate.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });
  });
});
