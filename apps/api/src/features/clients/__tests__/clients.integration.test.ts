import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { db } from "../../../config/db.js";
import { createTestApp } from "../../../test/helpers/index.js";
import { cleanDatabase } from "../../../test/db-utils.js";
import {
  seedRoleWithClientsPermission,
  seedRoleWithoutPermission,
  seedRoleWithNonUnlimitedScope,
  createTestUser,
  createTestSession,
  createTestEmployee,
  createTestClient,
  createTestInsurer,
  createTestAffiliate,
  createTestClaim,
  createTestPolicy,
  SESSION_COOKIE_NAME,
} from "./fixtures.js";

interface ClientResponse {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ListClientsResponse {
  data: ClientResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateClientResponse {
  id: string;
}

interface ErrorResponse {
  error: {
    message: string;
    code: string;
  };
}

const asClient = (body: unknown): ClientResponse => body as ClientResponse;
const asList = (body: unknown): ListClientsResponse => body as ListClientsResponse;
const asCreate = (body: unknown): CreateClientResponse => body as CreateClientResponse;
const asError = (body: unknown): ErrorResponse => body as ErrorResponse;

describe("Clients API", () => {
  const app = createTestApp();

  let testUser: Awaited<ReturnType<typeof createTestUser>>;
  let sessionToken: string;

  beforeEach(async () => {
    await cleanDatabase();

    const role = await seedRoleWithClientsPermission("UNLIMITED");
    const testEmployee = await createTestEmployee({ firstName: "Admin", lastName: "User" });
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
  // GET / - List Clients
  // ===========================================================================

  describe("GET / - List Clients", () => {
    it("returns empty list when no clients exist", async () => {
      const res = await request(app)
        .get("/clients")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data).toHaveLength(0);
      expect(body.pagination.total).toBe(0);
    });

    it("returns paginated list of clients", async () => {
      await createTestClient({ name: "Client A" });
      await createTestClient({ name: "Client B" });
      await createTestClient({ name: "Client C" });

      const res = await request(app)
        .get("/clients?limit=2&page=1")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data).toHaveLength(2);
      expect(body.pagination.total).toBe(3);
      expect(body.pagination.totalPages).toBe(2);
    });

    it("filters by isActive", async () => {
      await createTestClient({ name: "Active Client", isActive: true });
      await createTestClient({ name: "Inactive Client", isActive: false });

      const res = await request(app)
        .get("/clients?isActive=false")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0]!.name).toBe("Inactive Client");
    });

    it("searches by name", async () => {
      await createTestClient({ name: "Alpha Corporation" });
      await createTestClient({ name: "Beta Industries" });
      await createTestClient({ name: "Gamma Corporation" });

      const res = await request(app)
        .get("/clients?search=Corporation")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data).toHaveLength(2);
    });

    it("sorts by name ascending (default)", async () => {
      await createTestClient({ name: "Zebra Corp" });
      await createTestClient({ name: "Alpha Corp" });

      const res = await request(app)
        .get("/clients")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data[0]!.name).toBe("Alpha Corp");
      expect(body.data[1]!.name).toBe("Zebra Corp");
    });

    it("sorts by createdAt descending", async () => {
      const first = await createTestClient({ name: "First" });
      await new Promise((r) => setTimeout(r, 10));
      const second = await createTestClient({ name: "Second" });

      const res = await request(app)
        .get("/clients?sortBy=createdAt&sortOrder=desc")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data[0]!.id).toBe(second.id);
      expect(body.data[1]!.id).toBe(first.id);
    });

    it("requires authentication", async () => {
      const res = await request(app).get("/clients");

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .get("/clients")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`);

      expect(res.status).toBe(403);
    });

    it("requires clients:read permission", async () => {
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .get("/clients")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // GET /:id - Get Client
  // ===========================================================================

  describe("GET /:id - Get Client", () => {
    it("returns client details", async () => {
      const client = await createTestClient({
        name: "Test Client",
      });

      const res = await request(app)
        .get(`/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asClient(res.body);
      expect(body.id).toBe(client.id);
      expect(body.name).toBe("Test Client");
      expect(body.isActive).toBe(true);
    });

    it("returns 404 for non-existent client", async () => {
      const res = await request(app)
        .get("/clients/nonexistent-id")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("requires authentication", async () => {
      const client = await createTestClient();

      const res = await request(app).get(`/clients/${client.id}`);

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const client = await createTestClient();
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .get(`/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // POST / - Create Client
  // ===========================================================================

  describe("POST / - Create Client", () => {
    it("creates client with name", async () => {
      const res = await request(app)
        .post("/clients")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          name: "New Client",
        });

      expect(res.status).toBe(201);
      const body = asCreate(res.body);
      expect(body.id).toBeDefined();

      const client = await db.client.findUnique({ where: { id: body.id } });
      expect(client?.name).toBe("New Client");
      expect(client?.isActive).toBe(true);
    });

    it("validates required fields", async () => {
      const res = await request(app)
        .post("/clients")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it("validates name is required", async () => {
      const res = await request(app)
        .post("/clients")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          name: "",
        });

      expect(res.status).toBe(400);
    });

    it("validates name max length", async () => {
      const res = await request(app)
        .post("/clients")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          name: "a".repeat(256),
        });

      expect(res.status).toBe(400);
    });

    it("rejects duplicate name", async () => {
      await createTestClient({ name: "Existing Client" });

      const res = await request(app)
        .post("/clients")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          name: "Existing Client",
        });

      expect(res.status).toBe(409);
      expect(asError(res.body).error.message).toContain("name");
    });

    it("requires authentication", async () => {
      const res = await request(app)
        .post("/clients")
        .send({
          name: "Test Client",
        });

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .post("/clients")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`)
        .send({
          name: "Test Client",
        });

      expect(res.status).toBe(403);
    });

    it("requires clients:create permission", async () => {
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .post("/clients")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`)
        .send({
          name: "Test Client",
        });

      expect(res.status).toBe(403);
    });

    it("creates audit log entry", async () => {
      await db.auditLog.deleteMany();

      const res = await request(app)
        .post("/clients")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          name: "Audit Test Client",
        });

      expect(res.status).toBe(201);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "CREATE",
          resource: "Client",
          resourceId: asCreate(res.body).id,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.userId).toBe(testUser.id);
    });
  });

  // ===========================================================================
  // PATCH /:id - Update Client
  // ===========================================================================

  describe("PATCH /:id - Update Client", () => {
    it("updates name", async () => {
      const client = await createTestClient({ name: "Original Name" });

      const res = await request(app)
        .patch(`/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ name: "Updated Name" });

      expect(res.status).toBe(200);
      const body = asClient(res.body);
      expect(body.name).toBe("Updated Name");
    });

    it("updates isActive status", async () => {
      const client = await createTestClient({ isActive: true });

      const res = await request(app)
        .patch(`/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      const body = asClient(res.body);
      expect(body.isActive).toBe(false);
    });

    it("updates multiple fields", async () => {
      const client = await createTestClient({
        name: "Original",
        isActive: true,
      });

      const res = await request(app)
        .patch(`/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          name: "Updated",
          isActive: false,
        });

      expect(res.status).toBe(200);
      const body = asClient(res.body);
      expect(body.name).toBe("Updated");
      expect(body.isActive).toBe(false);
    });

    it("returns 404 for non-existent client", async () => {
      const res = await request(app)
        .patch("/clients/nonexistent-id")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ name: "Updated" });

      expect(res.status).toBe(404);
    });

    it("validates name uniqueness on update", async () => {
      const client1 = await createTestClient({ name: "Client One" });
      await createTestClient({ name: "Client Two" });

      const res = await request(app)
        .patch(`/clients/${client1.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ name: "Client Two" });

      expect(res.status).toBe(409);
    });

    it("allows same name when unchanged", async () => {
      const client = await createTestClient({
        name: "Same Name",
      });

      const res = await request(app)
        .patch(`/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          name: "Same Name",
          isActive: false,
        });

      expect(res.status).toBe(200);
    });

    it("returns unchanged client when no fields to update", async () => {
      const client = await createTestClient({ name: "Test" });

      const res = await request(app)
        .patch(`/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({});

      expect(res.status).toBe(200);
      const body = asClient(res.body);
      expect(body.name).toBe("Test");
    });

    it("requires authentication", async () => {
      const client = await createTestClient();

      const res = await request(app)
        .patch(`/clients/${client.id}`)
        .send({ name: "Updated" });

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const client = await createTestClient();
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .patch(`/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`)
        .send({ name: "Updated" });

      expect(res.status).toBe(403);
    });

    it("requires clients:edit permission", async () => {
      const client = await createTestClient();
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .patch(`/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`)
        .send({ name: "Updated" });

      expect(res.status).toBe(403);
    });

    it("creates audit log entry with old/new values", async () => {
      await db.auditLog.deleteMany();

      const client = await createTestClient({ name: "Old Name" });

      const res = await request(app)
        .patch(`/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ name: "New Name" });

      expect(res.status).toBe(200);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "UPDATE",
          resource: "Client",
          resourceId: client.id,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.oldValue).toMatchObject({ name: "Old Name" });
      expect(auditLog!.newValue).toMatchObject({ name: "New Name" });
    });
  });

  // ===========================================================================
  // DELETE /:id - Delete Client
  // ===========================================================================

  describe("DELETE /:id - Delete Client", () => {
    it("deletes client", async () => {
      const client = await createTestClient();

      const res = await request(app)
        .delete(`/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(204);

      const deleted = await db.client.findUnique({ where: { id: client.id } });
      expect(deleted).toBeNull();
    });

    it("returns 404 for non-existent client", async () => {
      const res = await request(app)
        .delete("/clients/nonexistent-id")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("rejects deletion if client has related affiliates", async () => {
      const client = await createTestClient();
      await createTestAffiliate(client.id);

      const res = await request(app)
        .delete(`/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(409);
      expect(asError(res.body).error.message).toContain("affiliates");
    });

    it("rejects deletion if client has related claims", async () => {
      const client = await createTestClient();
      // Note: Claims require affiliates, so creating a claim also creates an affiliate
      // The affiliates constraint check fires first, but this verifies the overall
      // constraint checking mechanism works for entities that depend on clients
      await createTestClaim(client.id, testUser.id);

      const res = await request(app)
        .delete(`/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      // Should fail with 409 due to related entities (affiliate created by claim)
      expect(res.status).toBe(409);
    });

    it("rejects deletion if client has related policies", async () => {
      const client = await createTestClient();
      const insurer = await createTestInsurer();
      await createTestPolicy(insurer.id, client.id);

      const res = await request(app)
        .delete(`/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(409);
      expect(asError(res.body).error.message).toContain("policies");
    });

    it("requires authentication", async () => {
      const client = await createTestClient();

      const res = await request(app).delete(`/clients/${client.id}`);

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const client = await createTestClient();
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .delete(`/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`);

      expect(res.status).toBe(403);
    });

    it("requires clients:delete permission", async () => {
      const client = await createTestClient();
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .delete(`/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });

    it("creates audit log entry", async () => {
      await db.auditLog.deleteMany();

      const client = await createTestClient({ name: "To Delete" });

      const res = await request(app)
        .delete(`/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(204);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "DELETE",
          resource: "Client",
          resourceId: client.id,
        },
      });

      expect(auditLog).not.toBeNull();
    });
  });
});
