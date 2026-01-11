import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { db } from "../../../../config/db.js";
import { createTestApp } from "../../../../test/helpers/index.js";
import { cleanDatabase } from "../../../../test/db-utils.js";
import {
  seedRoleWithClientAdminsPermission,
  seedRoleWithoutPermission,
  seedRoleWithNonUnlimitedScope,
  createTestUser,
  createTestSession,
  createTestEmployee,
  createTestClientAdmin,
  createTestClient,
  assignClientAdminClient,
  SESSION_COOKIE_NAME,
} from "./fixtures.js";

interface ClientAdminClientResponse {
  clientAdminId: string;
  clientId: string;
  clientName: string;
  assignedAt: string;
}

interface ListClientAdminClientsResponse {
  data: ClientAdminClientResponse[];
}

interface AssignClientAdminClientResponse {
  clientAdminId: string;
  clientId: string;
  assignedAt: string;
}

interface ErrorResponse {
  error: {
    message: string;
    code: string;
  };
}

const asList = (body: unknown): ListClientAdminClientsResponse => body as ListClientAdminClientsResponse;
const asAssign = (body: unknown): AssignClientAdminClientResponse => body as AssignClientAdminClientResponse;
const asError = (body: unknown): ErrorResponse => body as ErrorResponse;

describe("Client Admin Clients API", () => {
  const app = createTestApp();

  let testUser: Awaited<ReturnType<typeof createTestUser>>;
  let sessionToken: string;

  beforeEach(async () => {
    await cleanDatabase();

    const role = await seedRoleWithClientAdminsPermission("UNLIMITED");
    const adminEmployee = await createTestEmployee({ firstName: "Admin", lastName: "User" });
    testUser = await createTestUser(role.id);
    await db.employee.update({
      where: { id: adminEmployee.id },
      data: { userId: testUser.id },
    });

    const session = await createTestSession(testUser.id);
    sessionToken = session.token;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // ===========================================================================
  // GET /:clientAdminId/clients - List Client Admin Clients
  // ===========================================================================

  describe("GET /:clientAdminId/clients - List Client Admin Clients", () => {
    it("returns empty list when no clients assigned", async () => {
      const clientAdmin = await createTestClientAdmin();

      const res = await request(app)
        .get(`/client-admins/${clientAdmin.id}/clients`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data).toHaveLength(0);
    });

    it("returns list of assigned clients", async () => {
      const clientAdmin = await createTestClientAdmin();
      const client1 = await createTestClient({ name: "Client One" });
      const client2 = await createTestClient({ name: "Client Two" });
      await assignClientAdminClient(clientAdmin.id, client1.id);
      await assignClientAdminClient(clientAdmin.id, client2.id);

      const res = await request(app)
        .get(`/client-admins/${clientAdmin.id}/clients`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data).toHaveLength(2);
      expect(body.data.map((c) => c.clientName)).toContain("Client One");
      expect(body.data.map((c) => c.clientName)).toContain("Client Two");
    });

    it("returns 404 for non-existent client admin", async () => {
      const res = await request(app)
        .get("/client-admins/nonexistent-id/clients")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("requires authentication", async () => {
      const clientAdmin = await createTestClientAdmin();

      const res = await request(app).get(`/client-admins/${clientAdmin.id}/clients`);

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const clientAdmin = await createTestClientAdmin();
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .get(`/client-admins/${clientAdmin.id}/clients`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`);

      expect(res.status).toBe(403);
    });

    it("requires clientAdmins:read permission", async () => {
      const clientAdmin = await createTestClientAdmin();
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .get(`/client-admins/${clientAdmin.id}/clients`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // POST /:clientAdminId/clients/:clientId - Assign Client to Client Admin
  // ===========================================================================

  describe("POST /:clientAdminId/clients/:clientId - Assign Client to Client Admin", () => {
    it("assigns client to client admin", async () => {
      const clientAdmin = await createTestClientAdmin();
      const client = await createTestClient();

      const res = await request(app)
        .post(`/client-admins/${clientAdmin.id}/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(201);
      const body = asAssign(res.body);
      expect(body.clientAdminId).toBe(clientAdmin.id);
      expect(body.clientId).toBe(client.id);
      expect(body.assignedAt).toBeDefined();

      const assignment = await db.clientAdminClient.findUnique({
        where: { clientAdminId_clientId: { clientAdminId: clientAdmin.id, clientId: client.id } },
      });
      expect(assignment).not.toBeNull();
    });

    it("returns 404 for non-existent client admin", async () => {
      const client = await createTestClient();

      const res = await request(app)
        .post(`/client-admins/nonexistent-id/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("returns 404 for non-existent client", async () => {
      const clientAdmin = await createTestClientAdmin();

      const res = await request(app)
        .post(`/client-admins/${clientAdmin.id}/clients/nonexistent-id`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("returns 409 if already assigned", async () => {
      const clientAdmin = await createTestClientAdmin();
      const client = await createTestClient();
      await assignClientAdminClient(clientAdmin.id, client.id);

      const res = await request(app)
        .post(`/client-admins/${clientAdmin.id}/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(409);
      expect(asError(res.body).error.message).toContain("already assigned");
    });

    it("requires authentication", async () => {
      const clientAdmin = await createTestClientAdmin();
      const client = await createTestClient();

      const res = await request(app).post(`/client-admins/${clientAdmin.id}/clients/${client.id}`);

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const clientAdmin = await createTestClientAdmin();
      const client = await createTestClient();
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .post(`/client-admins/${clientAdmin.id}/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`);

      expect(res.status).toBe(403);
    });

    it("requires clientAdmins:edit permission", async () => {
      const clientAdmin = await createTestClientAdmin();
      const client = await createTestClient();
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .post(`/client-admins/${clientAdmin.id}/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });

    it("creates audit log entry", async () => {
      await db.auditLog.deleteMany();

      const clientAdmin = await createTestClientAdmin();
      const client = await createTestClient();

      const res = await request(app)
        .post(`/client-admins/${clientAdmin.id}/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(201);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "CREATE",
          resource: "ClientAdminClient",
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.userId).toBe(testUser.id);
    });
  });

  // ===========================================================================
  // DELETE /:clientAdminId/clients/:clientId - Remove Client from Client Admin
  // ===========================================================================

  describe("DELETE /:clientAdminId/clients/:clientId - Remove Client from Client Admin", () => {
    it("removes client from client admin", async () => {
      const clientAdmin = await createTestClientAdmin();
      const client = await createTestClient();
      await assignClientAdminClient(clientAdmin.id, client.id);

      const res = await request(app)
        .delete(`/client-admins/${clientAdmin.id}/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(204);

      const assignment = await db.clientAdminClient.findUnique({
        where: { clientAdminId_clientId: { clientAdminId: clientAdmin.id, clientId: client.id } },
      });
      expect(assignment).toBeNull();
    });

    it("returns 404 for non-existent client admin", async () => {
      const client = await createTestClient();

      const res = await request(app)
        .delete(`/client-admins/nonexistent-id/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("returns 404 if not assigned", async () => {
      const clientAdmin = await createTestClientAdmin();
      const client = await createTestClient();

      const res = await request(app)
        .delete(`/client-admins/${clientAdmin.id}/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("requires authentication", async () => {
      const clientAdmin = await createTestClientAdmin();
      const client = await createTestClient();
      await assignClientAdminClient(clientAdmin.id, client.id);

      const res = await request(app).delete(`/client-admins/${clientAdmin.id}/clients/${client.id}`);

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const clientAdmin = await createTestClientAdmin();
      const client = await createTestClient();
      await assignClientAdminClient(clientAdmin.id, client.id);
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .delete(`/client-admins/${clientAdmin.id}/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`);

      expect(res.status).toBe(403);
    });

    it("requires clientAdmins:edit permission", async () => {
      const clientAdmin = await createTestClientAdmin();
      const client = await createTestClient();
      await assignClientAdminClient(clientAdmin.id, client.id);
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .delete(`/client-admins/${clientAdmin.id}/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });

    it("creates audit log entry", async () => {
      await db.auditLog.deleteMany();

      const clientAdmin = await createTestClientAdmin();
      const client = await createTestClient();
      await assignClientAdminClient(clientAdmin.id, client.id);

      const res = await request(app)
        .delete(`/client-admins/${clientAdmin.id}/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(204);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "DELETE",
          resource: "ClientAdminClient",
        },
      });

      expect(auditLog).not.toBeNull();
    });
  });
});
