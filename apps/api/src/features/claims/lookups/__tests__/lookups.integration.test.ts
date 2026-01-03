import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { db } from "../../../../config/db.js";
import { createTestApp } from "../../../../test/helpers/create-test-app.js";
import { cleanDatabase } from "../../../../test/db-utils.js";
import {
  seedRoleWithClaimsCreatePermission,
  seedRoleWithoutPermission,
  createTestUser,
  createTestSession,
  createTestClient,
  createTestAffiliate,
  createTestEmployee,
  createTestDependent,
  setupClientScopeCreateUser,
  setupSelfScopeCreateUser,
  setupUnlimitedScopeEditUser,
  setupClientScopeEditUser,
  setupSelfScopeEditUser,
  SESSION_COOKIE_NAME,
} from "../../__tests__/fixtures.js";

// =============================================================================
// Types for responses
// =============================================================================

interface ClientLookupItem {
  id: string;
  name: string;
}

interface AffiliateLookupItem {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
}

interface PatientLookupItem {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  relationship: string | null;
}

interface PolicyLookupItem {
  id: string;
  policyNumber: string;
  insurerName: string;
  status: string;
}

interface LookupResponse<T> {
  data: T[];
}

// =============================================================================
// Helper Functions
// =============================================================================

async function createTestInsurer(name = `Insurer-${Date.now()}`) {
  return db.insurer.create({
    data: {
      name,
      type: "COMPANIA_DE_SEGUROS",
    },
  });
}

async function createTestPolicy(
  clientId: string,
  insurerId: string,
  options: { policyNumber?: string; status?: string } = {}
) {
  return db.policy.create({
    data: {
      policyNumber: options.policyNumber ?? `POL-${Date.now()}`,
      clientId,
      insurerId,
      status: (options.status as "ACTIVE" | "PENDING" | "EXPIRED") ?? "ACTIVE",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
    },
    include: { insurer: true },
  });
}

// =============================================================================
// GET /claims/lookups/clients
// =============================================================================

describe("GET /claims/lookups/clients", () => {
  const app = createTestApp();

  let testClient: Awaited<ReturnType<typeof createTestClient>>;
  let testUser: Awaited<ReturnType<typeof createTestUser>>;
  let sessionToken: string;

  beforeEach(async () => {
    await cleanDatabase();

    testClient = await createTestClient("Test Client");

    const role = await seedRoleWithClaimsCreatePermission("UNLIMITED");
    const testEmployee = await createTestEmployee();
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

  describe("Success cases", () => {
    it("should return 200 with list of clients", async () => {
      const res = await request(app)
        .get("/claims/lookups/clients")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = res.body as LookupResponse<ClientLookupItem>;
      expect(body.data).toBeInstanceOf(Array);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(body.data[0]).toHaveProperty("id");
      expect(body.data[0]).toHaveProperty("name");
    });

    it("should return clients sorted by name", async () => {
      await createTestClient("Alpha Client");
      await createTestClient("Zeta Client");

      const res = await request(app)
        .get("/claims/lookups/clients")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = res.body as LookupResponse<ClientLookupItem>;
      const names = body.data.map((c) => c.name);
      const sorted = [...names].sort();
      expect(names).toEqual(sorted);
    });
  });

  describe("Scope-based access", () => {
    it("UNLIMITED scope returns all clients", async () => {
      const client2 = await createTestClient("Another Client");

      const res = await request(app)
        .get("/claims/lookups/clients")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = res.body as LookupResponse<ClientLookupItem>;
      expect(body.data.length).toBe(2);
      expect(body.data.find((c) => c.id === testClient.id)).toBeDefined();
      expect(body.data.find((c) => c.id === client2.id)).toBeDefined();
    });

    it("CLIENT scope returns only assigned clients", async () => {
      const unassignedClient = await createTestClient("Unassigned Client");
      const { token: clientScopeToken } = await setupClientScopeCreateUser([
        testClient.id,
      ]);

      const res = await request(app)
        .get("/claims/lookups/clients")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientScopeToken}`);

      expect(res.status).toBe(200);
      const body = res.body as LookupResponse<ClientLookupItem>;
      expect(body.data.length).toBe(1);
      expect(body.data[0]!.id).toBe(testClient.id);
      expect(
        body.data.find((c) => c.id === unassignedClient.id)
      ).toBeUndefined();
    });

    it("SELF scope returns only the client the affiliate belongs to", async () => {
      await createTestClient("Other Client");
      const { token: selfToken } = await setupSelfScopeCreateUser(
        testClient.id
      );

      const res = await request(app)
        .get("/claims/lookups/clients")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${selfToken}`);

      expect(res.status).toBe(200);
      const body = res.body as LookupResponse<ClientLookupItem>;
      expect(body.data.length).toBe(1);
      expect(body.data[0]!.id).toBe(testClient.id);
    });
  });

  describe("Authentication/Authorization", () => {
    it("should return 401 without authentication", async () => {
      const res = await request(app).get("/claims/lookups/clients");
      expect(res.status).toBe(401);
    });

    it("should return 403 without claims:create permission", async () => {
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .get("/claims/lookups/clients")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });
  });
});

// =============================================================================
// GET /claims/lookups/affiliates
// =============================================================================

describe("GET /claims/lookups/affiliates", () => {
  const app = createTestApp();

  let testClient: Awaited<ReturnType<typeof createTestClient>>;
  let testAffiliate: Awaited<ReturnType<typeof createTestAffiliate>>;
  let testUser: Awaited<ReturnType<typeof createTestUser>>;
  let sessionToken: string;

  beforeEach(async () => {
    await cleanDatabase();

    testClient = await createTestClient("Test Client");
    testAffiliate = await createTestAffiliate(testClient.id, {
      firstName: "John",
      lastName: "Doe",
    });

    const role = await seedRoleWithClaimsCreatePermission("UNLIMITED");
    const testEmployee = await createTestEmployee();
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

  describe("Success cases", () => {
    it("should return 200 with affiliates for the client", async () => {
      const res = await request(app)
        .get(`/claims/lookups/affiliates?clientId=${testClient.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = res.body as LookupResponse<AffiliateLookupItem>;
      expect(body.data).toBeInstanceOf(Array);
      expect(body.data.length).toBe(1);
      expect(body.data[0]!.id).toBe(testAffiliate.id);
      expect(body.data[0]!.name).toBe("John Doe");
    });

    it("should not include dependents (only primary affiliates)", async () => {
      const dependent = await createTestDependent(
        testClient.id,
        testAffiliate.id
      );

      const res = await request(app)
        .get(`/claims/lookups/affiliates?clientId=${testClient.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = res.body as LookupResponse<AffiliateLookupItem>;
      expect(body.data.find((a) => a.id === dependent.id)).toBeUndefined();
      expect(body.data.length).toBe(1);
    });

    it("should return affiliates sorted by lastName, firstName", async () => {
      await createTestAffiliate(testClient.id, {
        firstName: "Alice",
        lastName: "Zulu",
      });
      await createTestAffiliate(testClient.id, {
        firstName: "Bob",
        lastName: "Alpha",
      });

      const res = await request(app)
        .get(`/claims/lookups/affiliates?clientId=${testClient.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = res.body as LookupResponse<AffiliateLookupItem>;
      expect(body.data[0]!.lastName).toBe("Alpha");
    });
  });

  describe("Scope-based access", () => {
    it("CLIENT scope returns 403 for unassigned client", async () => {
      const otherClient = await createTestClient("Other Client");
      const { token: clientScopeToken } = await setupClientScopeCreateUser([
        testClient.id,
      ]);

      const res = await request(app)
        .get(`/claims/lookups/affiliates?clientId=${otherClient.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientScopeToken}`);

      expect(res.status).toBe(403);
    });

    it("SELF scope returns only own affiliate when clientId matches", async () => {
      await createTestAffiliate(testClient.id, {
        firstName: "Other",
        lastName: "Person",
      });
      const { token: selfToken, affiliate: selfAffiliate } =
        await setupSelfScopeCreateUser(testClient.id);

      const res = await request(app)
        .get(`/claims/lookups/affiliates?clientId=${testClient.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${selfToken}`);

      expect(res.status).toBe(200);
      const body = res.body as LookupResponse<AffiliateLookupItem>;
      expect(body.data.length).toBe(1);
      expect(body.data[0]!.id).toBe(selfAffiliate.id);
    });

    it("SELF scope returns empty when clientId does not match", async () => {
      const otherClient = await createTestClient("Other Client");
      const { token: selfToken } = await setupSelfScopeCreateUser(
        testClient.id
      );

      const res = await request(app)
        .get(`/claims/lookups/affiliates?clientId=${otherClient.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${selfToken}`);

      expect(res.status).toBe(200);
      const body = res.body as LookupResponse<AffiliateLookupItem>;
      expect(body.data.length).toBe(0);
    });
  });

  describe("Validation", () => {
    it("should return 400 when clientId is missing", async () => {
      const res = await request(app)
        .get("/claims/lookups/affiliates")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe("Authentication/Authorization", () => {
    it("should return 401 without authentication", async () => {
      const res = await request(app).get(
        `/claims/lookups/affiliates?clientId=${testClient.id}`
      );
      expect(res.status).toBe(401);
    });

    it("should return 403 without claims:create permission", async () => {
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .get(`/claims/lookups/affiliates?clientId=${testClient.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });
  });
});

// =============================================================================
// GET /claims/lookups/patients
// =============================================================================

describe("GET /claims/lookups/patients", () => {
  const app = createTestApp();

  let testClient: Awaited<ReturnType<typeof createTestClient>>;
  let testAffiliate: Awaited<ReturnType<typeof createTestAffiliate>>;
  let testUser: Awaited<ReturnType<typeof createTestUser>>;
  let sessionToken: string;

  beforeEach(async () => {
    await cleanDatabase();

    testClient = await createTestClient("Test Client");
    testAffiliate = await createTestAffiliate(testClient.id, {
      firstName: "John",
      lastName: "Doe",
    });

    const role = await seedRoleWithClaimsCreatePermission("UNLIMITED");
    const testEmployee = await createTestEmployee();
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

  describe("Success cases", () => {
    it("should return affiliate themselves as a patient with SELF relationship", async () => {
      const res = await request(app)
        .get(`/claims/lookups/patients?affiliateId=${testAffiliate.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = res.body as LookupResponse<PatientLookupItem>;
      expect(body.data.length).toBe(1);
      expect(body.data[0]!.id).toBe(testAffiliate.id);
      expect(body.data[0]!.relationship).toBe("SELF");
    });

    it("should return affiliate and their dependents", async () => {
      const dependent = await createTestDependent(
        testClient.id,
        testAffiliate.id,
        {
          firstName: "Child",
          lastName: "Doe",
        }
      );
      await db.affiliate.update({
        where: { id: dependent.id },
        data: { relationship: "CHILD" },
      });

      const res = await request(app)
        .get(`/claims/lookups/patients?affiliateId=${testAffiliate.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = res.body as LookupResponse<PatientLookupItem>;
      expect(body.data.length).toBe(2);

      const selfPatient = body.data.find((p) => p.id === testAffiliate.id);
      const dependentPatient = body.data.find((p) => p.id === dependent.id);

      expect(selfPatient?.relationship).toBe("SELF");
      expect(dependentPatient?.relationship).toBe("CHILD");
    });
  });

  describe("Scope-based access", () => {
    it("SELF scope can only access their own affiliate's patients", async () => {
      const { token: selfToken } = await setupSelfScopeCreateUser(
        testClient.id
      );

      const res = await request(app)
        .get(`/claims/lookups/patients?affiliateId=${testAffiliate.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${selfToken}`);

      expect(res.status).toBe(403);
    });

    it("SELF scope can access their own patients", async () => {
      const { token: selfToken, affiliate: selfAffiliate } =
        await setupSelfScopeCreateUser(testClient.id);
      await createTestDependent(testClient.id, selfAffiliate.id);

      const res = await request(app)
        .get(`/claims/lookups/patients?affiliateId=${selfAffiliate.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${selfToken}`);

      expect(res.status).toBe(200);
      const body = res.body as LookupResponse<PatientLookupItem>;
      expect(body.data.length).toBe(2);
    });

    it("CLIENT scope can access patients for affiliates in assigned clients", async () => {
      const { token: clientScopeToken } = await setupClientScopeCreateUser([
        testClient.id,
      ]);

      const res = await request(app)
        .get(`/claims/lookups/patients?affiliateId=${testAffiliate.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientScopeToken}`);

      expect(res.status).toBe(200);
      const body = res.body as LookupResponse<PatientLookupItem>;
      expect(body.data.length).toBe(1);
    });

    it("CLIENT scope returns 403 for affiliates in unassigned clients", async () => {
      const otherClient = await createTestClient("Other Client");
      const otherAffiliate = await createTestAffiliate(otherClient.id);
      const { token: clientScopeToken } = await setupClientScopeCreateUser([
        testClient.id,
      ]);

      const res = await request(app)
        .get(`/claims/lookups/patients?affiliateId=${otherAffiliate.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientScopeToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("Validation", () => {
    it("should return 400 when affiliateId is missing", async () => {
      const res = await request(app)
        .get("/claims/lookups/patients")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
    });

    it("should return 404 for non-existent affiliate", async () => {
      const res = await request(app)
        .get("/claims/lookups/patients?affiliateId=nonexistent-id")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("Authentication/Authorization", () => {
    it("should return 401 without authentication", async () => {
      const res = await request(app).get(
        `/claims/lookups/patients?affiliateId=${testAffiliate.id}`
      );
      expect(res.status).toBe(401);
    });

    it("should return 403 without claims:create permission", async () => {
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .get(`/claims/lookups/patients?affiliateId=${testAffiliate.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });
  });
});

// =============================================================================
// GET /claims/lookups/policies
// =============================================================================

describe("GET /claims/lookups/policies", () => {
  const app = createTestApp();

  let testClient: Awaited<ReturnType<typeof createTestClient>>;
  let sessionToken: string;

  beforeEach(async () => {
    await cleanDatabase();

    testClient = await createTestClient("Test Client");

    const { token } = await setupUnlimitedScopeEditUser();
    sessionToken = token;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe("Success cases", () => {
    it("should return 200 with policies for the client", async () => {
      const insurer = await createTestInsurer();
      const policy = await createTestPolicy(testClient.id, insurer.id);

      const res = await request(app)
        .get(`/claims/lookups/policies?clientId=${testClient.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = res.body as LookupResponse<PolicyLookupItem>;
      expect(body.data.length).toBe(1);
      expect(body.data[0]!.id).toBe(policy.id);
      expect(body.data[0]!.policyNumber).toBe(policy.policyNumber);
      expect(body.data[0]!.insurerName).toBe(insurer.name);
    });

    it("should return all policies regardless of status", async () => {
      const insurer = await createTestInsurer();
      await createTestPolicy(testClient.id, insurer.id, { status: "ACTIVE" });
      await createTestPolicy(testClient.id, insurer.id, { status: "PENDING" });
      await createTestPolicy(testClient.id, insurer.id, { status: "EXPIRED" });

      const res = await request(app)
        .get(`/claims/lookups/policies?clientId=${testClient.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = res.body as LookupResponse<PolicyLookupItem>;
      expect(body.data.length).toBe(3);
    });
  });

  describe("Scope restrictions", () => {
    it("should return 403 for CLIENT scope", async () => {
      const { token: clientScopeToken } = await setupClientScopeEditUser([
        testClient.id,
      ]);

      const res = await request(app)
        .get(`/claims/lookups/policies?clientId=${testClient.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientScopeToken}`);

      expect(res.status).toBe(403);
    });

    it("should return 403 for SELF scope", async () => {
      const { token: selfToken } = await setupSelfScopeEditUser(testClient.id);

      const res = await request(app)
        .get(`/claims/lookups/policies?clientId=${testClient.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${selfToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("Validation", () => {
    it("should return 400 when clientId is missing", async () => {
      const res = await request(app)
        .get("/claims/lookups/policies")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe("Authentication/Authorization", () => {
    it("should return 401 without authentication", async () => {
      const res = await request(app).get(
        `/claims/lookups/policies?clientId=${testClient.id}`
      );
      expect(res.status).toBe(401);
    });

    it("should return 403 without claims:edit permission", async () => {
      // Create user with UNLIMITED scope but no claims:edit permission
      const noPermRole = await seedRoleWithoutPermission("UNLIMITED");
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .get(`/claims/lookups/policies?clientId=${testClient.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });
  });
});
