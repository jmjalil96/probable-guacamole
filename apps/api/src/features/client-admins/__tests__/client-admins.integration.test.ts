import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { db } from "../../../config/db.js";
import { createTestApp } from "../../../test/helpers/index.js";
import { cleanDatabase } from "../../../test/db-utils.js";
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

interface ClientAdminResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  isActive: boolean;
  hasAccount: boolean;
  clientCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ListClientAdminsResponse {
  data: ClientAdminResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateClientAdminResponse {
  id: string;
}

interface ErrorResponse {
  error: {
    message: string;
    code: string;
  };
}

const asClientAdmin = (body: unknown): ClientAdminResponse => body as ClientAdminResponse;
const asList = (body: unknown): ListClientAdminsResponse => body as ListClientAdminsResponse;
const asCreate = (body: unknown): CreateClientAdminResponse => body as CreateClientAdminResponse;
const asError = (body: unknown): ErrorResponse => body as ErrorResponse;

describe("Client Admins API", () => {
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
  // GET / - List Client Admins
  // ===========================================================================

  describe("GET / - List Client Admins", () => {
    it("returns empty list when no client admins exist", async () => {
      const res = await request(app)
        .get("/client-admins")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data).toHaveLength(0);
      expect(body.pagination.total).toBe(0);
    });

    it("returns paginated list", async () => {
      await createTestClientAdmin({ firstName: "Admin", lastName: "One" });
      await createTestClientAdmin({ firstName: "Admin", lastName: "Two" });
      await createTestClientAdmin({ firstName: "Admin", lastName: "Three" });

      const res = await request(app)
        .get("/client-admins?limit=2&page=1")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data).toHaveLength(2);
      expect(body.pagination.total).toBe(3);
      expect(body.pagination.totalPages).toBe(2);
    });

    it("filters by isActive=true", async () => {
      await createTestClientAdmin({ firstName: "Active", lastName: "Admin", isActive: true });
      await createTestClientAdmin({ firstName: "Inactive", lastName: "Admin", isActive: false });

      const res = await request(app)
        .get("/client-admins?isActive=true")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.every((a) => a.isActive === true)).toBe(true);
    });

    it("filters by isActive=false", async () => {
      await createTestClientAdmin({ firstName: "Active", lastName: "Admin", isActive: true });
      await createTestClientAdmin({ firstName: "Inactive", lastName: "Admin", isActive: false });

      const res = await request(app)
        .get("/client-admins?isActive=false")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.every((a) => a.isActive === false)).toBe(true);
      expect(body.data).toHaveLength(1);
    });

    it("searches by firstName", async () => {
      await createTestClientAdmin({ firstName: "Alice", lastName: "Admin" });
      await createTestClientAdmin({ firstName: "Bob", lastName: "Admin" });

      const res = await request(app)
        .get("/client-admins?search=Alice")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.some((a) => a.firstName === "Alice")).toBe(true);
      expect(body.data.every((a) => a.firstName === "Bob")).toBe(false);
    });

    it("searches by lastName", async () => {
      await createTestClientAdmin({ firstName: "Alice", lastName: "Smith" });
      await createTestClientAdmin({ firstName: "Bob", lastName: "Jones" });

      const res = await request(app)
        .get("/client-admins?search=Jones")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.some((a) => a.lastName === "Jones")).toBe(true);
    });

    it("searches by email", async () => {
      await createTestClientAdmin({ firstName: "Test", lastName: "Admin", email: "unique-admin@example.com" });
      await createTestClientAdmin({ firstName: "Other", lastName: "Admin", email: "other-admin@example.com" });

      const res = await request(app)
        .get("/client-admins?search=unique-admin")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.some((a) => a.email.includes("unique-admin"))).toBe(true);
    });

    it("sorts by firstName ascending", async () => {
      await createTestClientAdmin({ firstName: "Zack", lastName: "Admin" });
      await createTestClientAdmin({ firstName: "Aaron", lastName: "Admin" });

      const res = await request(app)
        .get("/client-admins?sortBy=firstName&sortOrder=asc")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data[0]!.firstName).toBe("Aaron");
    });

    it("sorts by createdAt descending", async () => {
      const first = await createTestClientAdmin({ firstName: "First", lastName: "Admin" });
      await new Promise((r) => setTimeout(r, 10));
      const second = await createTestClientAdmin({ firstName: "Second", lastName: "Admin" });

      const res = await request(app)
        .get("/client-admins?sortBy=createdAt&sortOrder=desc")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      const ids = body.data.map((a) => a.id);
      expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));
    });

    it("requires authentication", async () => {
      const res = await request(app).get("/client-admins");

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .get("/client-admins")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`);

      expect(res.status).toBe(403);
    });

    it("requires clientAdmins:read permission", async () => {
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .get("/client-admins")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // GET /:id - Get Client Admin
  // ===========================================================================

  describe("GET /:id - Get Client Admin", () => {
    it("returns client admin details with clientCount", async () => {
      const clientAdmin = await createTestClientAdmin({
        firstName: "Test",
        lastName: "Admin",
        phone: "+1234567890",
        jobTitle: "Senior Manager",
      });

      const client = await createTestClient();
      await assignClientAdminClient(clientAdmin.id, client.id);

      const res = await request(app)
        .get(`/client-admins/${clientAdmin.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asClientAdmin(res.body);
      expect(body.id).toBe(clientAdmin.id);
      expect(body.firstName).toBe("Test");
      expect(body.lastName).toBe("Admin");
      expect(body.phone).toBe("+1234567890");
      expect(body.jobTitle).toBe("Senior Manager");
      expect(body.isActive).toBe(true);
      expect(body.clientCount).toBe(1);
    });

    it("returns 404 for non-existent client admin", async () => {
      const res = await request(app)
        .get("/client-admins/nonexistent-id")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("requires authentication", async () => {
      const clientAdmin = await createTestClientAdmin();

      const res = await request(app).get(`/client-admins/${clientAdmin.id}`);

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const clientAdmin = await createTestClientAdmin();
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .get(`/client-admins/${clientAdmin.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // POST / - Create Client Admin
  // ===========================================================================

  describe("POST / - Create Client Admin", () => {
    it("creates client admin with required fields", async () => {
      const res = await request(app)
        .post("/client-admins")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          firstName: "New",
          lastName: "Admin",
          email: "new-admin@example.com",
        });

      expect(res.status).toBe(201);
      const body = asCreate(res.body);
      expect(body.id).toBeDefined();

      const clientAdmin = await db.clientAdmin.findUnique({ where: { id: body.id } });
      expect(clientAdmin?.firstName).toBe("New");
      expect(clientAdmin?.lastName).toBe("Admin");
      expect(clientAdmin?.email).toBe("new-admin@example.com");
      expect(clientAdmin?.isActive).toBe(true);
    });

    it("creates client admin with all fields", async () => {
      const res = await request(app)
        .post("/client-admins")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          firstName: "Full",
          lastName: "Admin",
          email: "full-admin@example.com",
          phone: "+1234567890",
          jobTitle: "Director",
        });

      expect(res.status).toBe(201);
      const body = asCreate(res.body);

      const clientAdmin = await db.clientAdmin.findUnique({ where: { id: body.id } });
      expect(clientAdmin?.phone).toBe("+1234567890");
      expect(clientAdmin?.jobTitle).toBe("Director");
    });

    it("validates required firstName", async () => {
      const res = await request(app)
        .post("/client-admins")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          lastName: "Admin",
          email: "test@example.com",
        });

      expect(res.status).toBe(400);
    });

    it("validates required lastName", async () => {
      const res = await request(app)
        .post("/client-admins")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          firstName: "Test",
          email: "test@example.com",
        });

      expect(res.status).toBe(400);
    });

    it("validates required email", async () => {
      const res = await request(app)
        .post("/client-admins")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          firstName: "Test",
          lastName: "Admin",
        });

      expect(res.status).toBe(400);
    });

    it("validates email format", async () => {
      const res = await request(app)
        .post("/client-admins")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          firstName: "Test",
          lastName: "Admin",
          email: "invalid-email",
        });

      expect(res.status).toBe(400);
    });

    it("rejects duplicate email", async () => {
      await createTestClientAdmin({ email: "existing@example.com" });

      const res = await request(app)
        .post("/client-admins")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          firstName: "New",
          lastName: "Admin",
          email: "existing@example.com",
        });

      expect(res.status).toBe(409);
      expect(asError(res.body).error.message).toContain("email");
    });

    it("requires authentication", async () => {
      const res = await request(app)
        .post("/client-admins")
        .send({
          firstName: "Test",
          lastName: "Admin",
          email: "test@example.com",
        });

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .post("/client-admins")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`)
        .send({
          firstName: "Test",
          lastName: "Admin",
          email: "test@example.com",
        });

      expect(res.status).toBe(403);
    });

    it("requires clientAdmins:create permission", async () => {
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .post("/client-admins")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`)
        .send({
          firstName: "Test",
          lastName: "Admin",
          email: "test@example.com",
        });

      expect(res.status).toBe(403);
    });

    it("creates audit log entry", async () => {
      await db.auditLog.deleteMany();

      const res = await request(app)
        .post("/client-admins")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          firstName: "Audit",
          lastName: "Admin",
          email: "audit-admin@example.com",
        });

      expect(res.status).toBe(201);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "CREATE",
          resource: "ClientAdmin",
          resourceId: asCreate(res.body).id,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.userId).toBe(testUser.id);
    });
  });

  // ===========================================================================
  // PATCH /:id - Update Client Admin
  // ===========================================================================

  describe("PATCH /:id - Update Client Admin", () => {
    it("updates firstName", async () => {
      const clientAdmin = await createTestClientAdmin({ firstName: "Original" });

      const res = await request(app)
        .patch(`/client-admins/${clientAdmin.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ firstName: "Updated" });

      expect(res.status).toBe(200);
      const body = asClientAdmin(res.body);
      expect(body.firstName).toBe("Updated");
    });

    it("updates lastName", async () => {
      const clientAdmin = await createTestClientAdmin({ lastName: "Original" });

      const res = await request(app)
        .patch(`/client-admins/${clientAdmin.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ lastName: "Updated" });

      expect(res.status).toBe(200);
      const body = asClientAdmin(res.body);
      expect(body.lastName).toBe("Updated");
    });

    it("updates email", async () => {
      const clientAdmin = await createTestClientAdmin({ email: "original@example.com" });

      const res = await request(app)
        .patch(`/client-admins/${clientAdmin.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ email: "updated@example.com" });

      expect(res.status).toBe(200);
      const body = asClientAdmin(res.body);
      expect(body.email).toBe("updated@example.com");
    });

    it("updates jobTitle", async () => {
      const clientAdmin = await createTestClientAdmin();

      const res = await request(app)
        .patch(`/client-admins/${clientAdmin.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ jobTitle: "VP of Operations" });

      expect(res.status).toBe(200);
      const body = asClientAdmin(res.body);
      expect(body.jobTitle).toBe("VP of Operations");
    });

    it("updates isActive", async () => {
      const clientAdmin = await createTestClientAdmin({ isActive: true });

      const res = await request(app)
        .patch(`/client-admins/${clientAdmin.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      const body = asClientAdmin(res.body);
      expect(body.isActive).toBe(false);
    });

    it("updates multiple fields", async () => {
      const clientAdmin = await createTestClientAdmin({
        firstName: "Original",
        jobTitle: null,
      });

      const res = await request(app)
        .patch(`/client-admins/${clientAdmin.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          firstName: "Updated",
          jobTitle: "Manager",
          isActive: false,
        });

      expect(res.status).toBe(200);
      const body = asClientAdmin(res.body);
      expect(body.firstName).toBe("Updated");
      expect(body.jobTitle).toBe("Manager");
      expect(body.isActive).toBe(false);
    });

    it("returns 404 for non-existent client admin", async () => {
      const res = await request(app)
        .patch("/client-admins/nonexistent-id")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ firstName: "Updated" });

      expect(res.status).toBe(404);
    });

    it("validates email uniqueness on update", async () => {
      const admin1 = await createTestClientAdmin({ email: "admin1@example.com" });
      await createTestClientAdmin({ email: "admin2@example.com" });

      const res = await request(app)
        .patch(`/client-admins/${admin1.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ email: "admin2@example.com" });

      expect(res.status).toBe(409);
    });

    it("allows same email when unchanged", async () => {
      const clientAdmin = await createTestClientAdmin({ email: "same@example.com" });

      const res = await request(app)
        .patch(`/client-admins/${clientAdmin.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          email: "same@example.com",
          firstName: "Different",
        });

      expect(res.status).toBe(200);
    });

    it("returns unchanged client admin when no fields to update", async () => {
      const clientAdmin = await createTestClientAdmin({ firstName: "Test" });

      const res = await request(app)
        .patch(`/client-admins/${clientAdmin.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({});

      expect(res.status).toBe(200);
      const body = asClientAdmin(res.body);
      expect(body.firstName).toBe("Test");
    });

    it("requires authentication", async () => {
      const clientAdmin = await createTestClientAdmin();

      const res = await request(app)
        .patch(`/client-admins/${clientAdmin.id}`)
        .send({ firstName: "Updated" });

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const clientAdmin = await createTestClientAdmin();
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .patch(`/client-admins/${clientAdmin.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`)
        .send({ firstName: "Updated" });

      expect(res.status).toBe(403);
    });

    it("requires clientAdmins:edit permission", async () => {
      const clientAdmin = await createTestClientAdmin();
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .patch(`/client-admins/${clientAdmin.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`)
        .send({ firstName: "Updated" });

      expect(res.status).toBe(403);
    });

    it("creates audit log entry with old/new values", async () => {
      await db.auditLog.deleteMany();

      const clientAdmin = await createTestClientAdmin({ firstName: "Old" });

      const res = await request(app)
        .patch(`/client-admins/${clientAdmin.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ firstName: "New" });

      expect(res.status).toBe(200);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "UPDATE",
          resource: "ClientAdmin",
          resourceId: clientAdmin.id,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.oldValue).toMatchObject({ firstName: "Old" });
      expect(auditLog!.newValue).toMatchObject({ firstName: "New" });
    });
  });

  // ===========================================================================
  // DELETE /:id - Delete Client Admin
  // ===========================================================================

  describe("DELETE /:id - Delete Client Admin", () => {
    it("deletes client admin", async () => {
      const clientAdmin = await createTestClientAdmin();

      const res = await request(app)
        .delete(`/client-admins/${clientAdmin.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(204);

      const deleted = await db.clientAdmin.findUnique({ where: { id: clientAdmin.id } });
      expect(deleted).toBeNull();
    });

    it("returns 404 for non-existent client admin", async () => {
      const res = await request(app)
        .delete("/client-admins/nonexistent-id")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("requires authentication", async () => {
      const clientAdmin = await createTestClientAdmin();

      const res = await request(app).delete(`/client-admins/${clientAdmin.id}`);

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const clientAdmin = await createTestClientAdmin();
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .delete(`/client-admins/${clientAdmin.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`);

      expect(res.status).toBe(403);
    });

    it("requires clientAdmins:delete permission", async () => {
      const clientAdmin = await createTestClientAdmin();
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .delete(`/client-admins/${clientAdmin.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });

    it("creates audit log entry", async () => {
      await db.auditLog.deleteMany();

      const clientAdmin = await createTestClientAdmin({ firstName: "To Delete" });

      const res = await request(app)
        .delete(`/client-admins/${clientAdmin.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(204);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "DELETE",
          resource: "ClientAdmin",
          resourceId: clientAdmin.id,
        },
      });

      expect(auditLog).not.toBeNull();
    });
  });
});
