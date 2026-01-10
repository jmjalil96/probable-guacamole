import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { db } from "../../../config/db.js";
import { createTestApp } from "../../../test/helpers/index.js";
import { cleanDatabase } from "../../../test/db-utils.js";
import {
  seedRoleWithInsurersPermission,
  seedRoleWithoutPermission,
  seedRoleWithNonUnlimitedScope,
  createTestUser,
  createTestSession,
  createTestEmployee,
  createTestInsurer,
  createTestPolicy,
  createTestClient,
  SESSION_COOKIE_NAME,
} from "./fixtures.js";

interface InsurerResponse {
  id: string;
  name: string;
  code: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  type: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ListInsurersResponse {
  data: InsurerResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateInsurerResponse {
  id: string;
}

interface ErrorResponse {
  error: {
    message: string;
    code: string;
  };
}

const asInsurer = (body: unknown): InsurerResponse => body as InsurerResponse;
const asList = (body: unknown): ListInsurersResponse => body as ListInsurersResponse;
const asCreate = (body: unknown): CreateInsurerResponse => body as CreateInsurerResponse;
const asError = (body: unknown): ErrorResponse => body as ErrorResponse;

describe("Insurers API", () => {
  const app = createTestApp();

  let testUser: Awaited<ReturnType<typeof createTestUser>>;
  let sessionToken: string;

  beforeEach(async () => {
    await cleanDatabase();

    const role = await seedRoleWithInsurersPermission("UNLIMITED");
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
  // GET / - List Insurers
  // ===========================================================================

  describe("GET / - List Insurers", () => {
    it("returns empty list when no insurers exist", async () => {
      const res = await request(app)
        .get("/insurers")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data).toHaveLength(0);
      expect(body.pagination.total).toBe(0);
    });

    it("returns paginated list of insurers", async () => {
      await createTestInsurer({ name: "Insurer A", type: "MEDICINA_PREPAGADA" });
      await createTestInsurer({ name: "Insurer B", type: "COMPANIA_DE_SEGUROS" });
      await createTestInsurer({ name: "Insurer C", type: "MEDICINA_PREPAGADA" });

      const res = await request(app)
        .get("/insurers?limit=2&page=1")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data).toHaveLength(2);
      expect(body.pagination.total).toBe(3);
      expect(body.pagination.totalPages).toBe(2);
    });

    it("filters by type", async () => {
      await createTestInsurer({ name: "Prepagada 1", type: "MEDICINA_PREPAGADA" });
      await createTestInsurer({ name: "Seguros 1", type: "COMPANIA_DE_SEGUROS" });
      await createTestInsurer({ name: "Prepagada 2", type: "MEDICINA_PREPAGADA" });

      const res = await request(app)
        .get("/insurers?type=MEDICINA_PREPAGADA")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data).toHaveLength(2);
      expect(body.data.every((i) => i.type === "MEDICINA_PREPAGADA")).toBe(true);
    });

    it("filters by isActive", async () => {
      await createTestInsurer({ name: "Active Insurer", isActive: true });
      await createTestInsurer({ name: "Inactive Insurer", isActive: false });

      const res = await request(app)
        .get("/insurers?isActive=false")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0]!.name).toBe("Inactive Insurer");
    });

    it("searches by name", async () => {
      await createTestInsurer({ name: "Alpha Insurance" });
      await createTestInsurer({ name: "Beta Health" });
      await createTestInsurer({ name: "Gamma Insurance" });

      const res = await request(app)
        .get("/insurers?search=Insurance")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data).toHaveLength(2);
    });

    it("searches by code", async () => {
      await createTestInsurer({ name: "Insurer A", code: "INS-001" });
      await createTestInsurer({ name: "Insurer B", code: "INS-002" });

      const res = await request(app)
        .get("/insurers?search=INS-001")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0]!.code).toBe("INS-001");
    });

    it("sorts by name ascending (default)", async () => {
      await createTestInsurer({ name: "Zebra Insurance" });
      await createTestInsurer({ name: "Alpha Insurance" });

      const res = await request(app)
        .get("/insurers")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data[0]!.name).toBe("Alpha Insurance");
      expect(body.data[1]!.name).toBe("Zebra Insurance");
    });

    it("sorts by createdAt descending", async () => {
      const first = await createTestInsurer({ name: "First" });
      await new Promise((r) => setTimeout(r, 10));
      const second = await createTestInsurer({ name: "Second" });

      const res = await request(app)
        .get("/insurers?sortBy=createdAt&sortOrder=desc")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data[0]!.id).toBe(second.id);
      expect(body.data[1]!.id).toBe(first.id);
    });

    it("requires authentication", async () => {
      const res = await request(app).get("/insurers");

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .get("/insurers")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`);

      expect(res.status).toBe(403);
    });

    it("requires insurers:read permission", async () => {
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .get("/insurers")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // GET /:id - Get Insurer
  // ===========================================================================

  describe("GET /:id - Get Insurer", () => {
    it("returns insurer details", async () => {
      const insurer = await createTestInsurer({
        name: "Test Insurer",
        code: "TEST-001",
        email: "test@insurer.com",
        phone: "123-456-7890",
        website: "https://test.com",
        type: "MEDICINA_PREPAGADA",
      });

      const res = await request(app)
        .get(`/insurers/${insurer.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asInsurer(res.body);
      expect(body.id).toBe(insurer.id);
      expect(body.name).toBe("Test Insurer");
      expect(body.code).toBe("TEST-001");
      expect(body.email).toBe("test@insurer.com");
      expect(body.type).toBe("MEDICINA_PREPAGADA");
    });

    it("returns 404 for non-existent insurer", async () => {
      const res = await request(app)
        .get("/insurers/nonexistent-id")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("requires authentication", async () => {
      const insurer = await createTestInsurer();

      const res = await request(app).get(`/insurers/${insurer.id}`);

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const insurer = await createTestInsurer();
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .get(`/insurers/${insurer.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // POST / - Create Insurer
  // ===========================================================================

  describe("POST / - Create Insurer", () => {
    it("creates insurer with all fields", async () => {
      const res = await request(app)
        .post("/insurers")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          name: "New Insurer",
          code: "NEW-001",
          email: "new@insurer.com",
          phone: "123-456-7890",
          website: "https://new-insurer.com",
          type: "COMPANIA_DE_SEGUROS",
        });

      expect(res.status).toBe(201);
      const body = asCreate(res.body);
      expect(body.id).toBeDefined();

      const insurer = await db.insurer.findUnique({ where: { id: body.id } });
      expect(insurer?.name).toBe("New Insurer");
      expect(insurer?.code).toBe("NEW-001");
      expect(insurer?.email).toBe("new@insurer.com");
      expect(insurer?.type).toBe("COMPANIA_DE_SEGUROS");
      expect(insurer?.isActive).toBe(true);
    });

    it("creates insurer with minimal fields", async () => {
      const res = await request(app)
        .post("/insurers")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          name: "Minimal Insurer",
          type: "MEDICINA_PREPAGADA",
        });

      expect(res.status).toBe(201);
      const body = asCreate(res.body);

      const insurer = await db.insurer.findUnique({ where: { id: body.id } });
      expect(insurer?.name).toBe("Minimal Insurer");
      expect(insurer?.code).toBeNull();
      expect(insurer?.email).toBeNull();
    });

    it("validates required fields", async () => {
      const res = await request(app)
        .post("/insurers")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it("validates name is required", async () => {
      const res = await request(app)
        .post("/insurers")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          type: "MEDICINA_PREPAGADA",
        });

      expect(res.status).toBe(400);
    });

    it("validates type is required", async () => {
      const res = await request(app)
        .post("/insurers")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          name: "Test Insurer",
        });

      expect(res.status).toBe(400);
    });

    it("rejects duplicate name", async () => {
      await createTestInsurer({ name: "Existing Insurer" });

      const res = await request(app)
        .post("/insurers")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          name: "Existing Insurer",
          type: "MEDICINA_PREPAGADA",
        });

      expect(res.status).toBe(409);
      expect(asError(res.body).error.message).toContain("name");
    });

    it("rejects duplicate code", async () => {
      await createTestInsurer({ code: "DUPLICATE-CODE" });

      const res = await request(app)
        .post("/insurers")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          name: "New Insurer",
          code: "DUPLICATE-CODE",
          type: "MEDICINA_PREPAGADA",
        });

      expect(res.status).toBe(409);
      expect(asError(res.body).error.message).toContain("code");
    });

    it("validates email format", async () => {
      const res = await request(app)
        .post("/insurers")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          name: "Test Insurer",
          type: "MEDICINA_PREPAGADA",
          email: "invalid-email",
        });

      expect(res.status).toBe(400);
    });

    it("validates website URL format", async () => {
      const res = await request(app)
        .post("/insurers")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          name: "Test Insurer",
          type: "MEDICINA_PREPAGADA",
          website: "not-a-url",
        });

      expect(res.status).toBe(400);
    });

    it("requires authentication", async () => {
      const res = await request(app)
        .post("/insurers")
        .send({
          name: "Test Insurer",
          type: "MEDICINA_PREPAGADA",
        });

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .post("/insurers")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`)
        .send({
          name: "Test Insurer",
          type: "MEDICINA_PREPAGADA",
        });

      expect(res.status).toBe(403);
    });

    it("requires insurers:create permission", async () => {
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .post("/insurers")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`)
        .send({
          name: "Test Insurer",
          type: "MEDICINA_PREPAGADA",
        });

      expect(res.status).toBe(403);
    });

    it("creates audit log entry", async () => {
      await db.auditLog.deleteMany();

      const res = await request(app)
        .post("/insurers")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          name: "Audit Test Insurer",
          type: "MEDICINA_PREPAGADA",
        });

      expect(res.status).toBe(201);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "CREATE",
          resource: "Insurer",
          resourceId: asCreate(res.body).id,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.userId).toBe(testUser.id);
    });
  });

  // ===========================================================================
  // PATCH /:id - Update Insurer
  // ===========================================================================

  describe("PATCH /:id - Update Insurer", () => {
    it("updates single field", async () => {
      const insurer = await createTestInsurer({ name: "Original Name" });

      const res = await request(app)
        .patch(`/insurers/${insurer.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ name: "Updated Name" });

      expect(res.status).toBe(200);
      const body = asInsurer(res.body);
      expect(body.name).toBe("Updated Name");
    });

    it("updates multiple fields", async () => {
      const insurer = await createTestInsurer({
        name: "Original",
        email: "old@email.com",
      });

      const res = await request(app)
        .patch(`/insurers/${insurer.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          name: "Updated",
          email: "new@email.com",
          phone: "555-1234",
        });

      expect(res.status).toBe(200);
      const body = asInsurer(res.body);
      expect(body.name).toBe("Updated");
      expect(body.email).toBe("new@email.com");
      expect(body.phone).toBe("555-1234");
    });

    it("sets field to null when passed null", async () => {
      const insurer = await createTestInsurer({
        name: "Test",
        code: "CODE-123",
        email: "test@test.com",
      });

      const res = await request(app)
        .patch(`/insurers/${insurer.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ code: null, email: null });

      expect(res.status).toBe(200);
      const body = asInsurer(res.body);
      expect(body.code).toBeNull();
      expect(body.email).toBeNull();
    });

    it("updates isActive status", async () => {
      const insurer = await createTestInsurer({ isActive: true });

      const res = await request(app)
        .patch(`/insurers/${insurer.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      const body = asInsurer(res.body);
      expect(body.isActive).toBe(false);
    });

    it("returns 404 for non-existent insurer", async () => {
      const res = await request(app)
        .patch("/insurers/nonexistent-id")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ name: "Updated" });

      expect(res.status).toBe(404);
    });

    it("validates name uniqueness on update", async () => {
      const insurer1 = await createTestInsurer({ name: "Insurer One" });
      await createTestInsurer({ name: "Insurer Two" });

      const res = await request(app)
        .patch(`/insurers/${insurer1.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ name: "Insurer Two" });

      expect(res.status).toBe(409);
    });

    it("validates code uniqueness on update", async () => {
      const insurer1 = await createTestInsurer({ code: "CODE-1" });
      await createTestInsurer({ code: "CODE-2" });

      const res = await request(app)
        .patch(`/insurers/${insurer1.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ code: "CODE-2" });

      expect(res.status).toBe(409);
    });

    it("allows same name/code when unchanged", async () => {
      const insurer = await createTestInsurer({
        name: "Same Name",
        code: "SAME-CODE",
      });

      const res = await request(app)
        .patch(`/insurers/${insurer.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          name: "Same Name",
          code: "SAME-CODE",
          phone: "555-9999",
        });

      expect(res.status).toBe(200);
    });

    it("returns unchanged insurer when no fields to update", async () => {
      const insurer = await createTestInsurer({ name: "Test" });

      const res = await request(app)
        .patch(`/insurers/${insurer.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({});

      expect(res.status).toBe(200);
      const body = asInsurer(res.body);
      expect(body.name).toBe("Test");
    });

    it("requires authentication", async () => {
      const insurer = await createTestInsurer();

      const res = await request(app)
        .patch(`/insurers/${insurer.id}`)
        .send({ name: "Updated" });

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const insurer = await createTestInsurer();
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .patch(`/insurers/${insurer.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`)
        .send({ name: "Updated" });

      expect(res.status).toBe(403);
    });

    it("requires insurers:edit permission", async () => {
      const insurer = await createTestInsurer();
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .patch(`/insurers/${insurer.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`)
        .send({ name: "Updated" });

      expect(res.status).toBe(403);
    });

    it("creates audit log entry with old/new values", async () => {
      await db.auditLog.deleteMany();

      const insurer = await createTestInsurer({ name: "Old Name" });

      const res = await request(app)
        .patch(`/insurers/${insurer.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ name: "New Name" });

      expect(res.status).toBe(200);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "UPDATE",
          resource: "Insurer",
          resourceId: insurer.id,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.oldValue).toMatchObject({ name: "Old Name" });
      expect(auditLog!.newValue).toMatchObject({ name: "New Name" });
    });
  });

  // ===========================================================================
  // DELETE /:id - Delete Insurer
  // ===========================================================================

  describe("DELETE /:id - Delete Insurer", () => {
    it("deletes insurer", async () => {
      const insurer = await createTestInsurer();

      const res = await request(app)
        .delete(`/insurers/${insurer.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(204);

      const deleted = await db.insurer.findUnique({ where: { id: insurer.id } });
      expect(deleted).toBeNull();
    });

    it("returns 404 for non-existent insurer", async () => {
      const res = await request(app)
        .delete("/insurers/nonexistent-id")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("rejects deletion if insurer has related policies", async () => {
      const insurer = await createTestInsurer();
      const client = await createTestClient();
      await createTestPolicy(insurer.id, client.id);

      const res = await request(app)
        .delete(`/insurers/${insurer.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(409);
      expect(asError(res.body).error.message).toContain("policies");
    });

    it("requires authentication", async () => {
      const insurer = await createTestInsurer();

      const res = await request(app).delete(`/insurers/${insurer.id}`);

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const insurer = await createTestInsurer();
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .delete(`/insurers/${insurer.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`);

      expect(res.status).toBe(403);
    });

    it("requires insurers:delete permission", async () => {
      const insurer = await createTestInsurer();
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .delete(`/insurers/${insurer.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });

    it("creates audit log entry", async () => {
      await db.auditLog.deleteMany();

      const insurer = await createTestInsurer({ name: "To Delete" });

      const res = await request(app)
        .delete(`/insurers/${insurer.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(204);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "DELETE",
          resource: "Insurer",
          resourceId: insurer.id,
        },
      });

      expect(auditLog).not.toBeNull();
    });
  });
});
