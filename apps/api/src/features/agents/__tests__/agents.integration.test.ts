import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { db } from "../../../config/db.js";
import { createTestApp } from "../../../test/helpers/index.js";
import { cleanDatabase } from "../../../test/db-utils.js";
import {
  seedRoleWithAgentsPermission,
  seedRoleWithoutPermission,
  seedRoleWithNonUnlimitedScope,
  createTestUser,
  createTestSession,
  createTestEmployee,
  createTestAgent,
  createTestClient,
  assignAgentClient,
  SESSION_COOKIE_NAME,
} from "./fixtures.js";

interface AgentResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  licenseNumber: string | null;
  agencyName: string | null;
  isActive: boolean;
  hasAccount: boolean;
  clientCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ListAgentsResponse {
  data: AgentResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateAgentResponse {
  id: string;
}

interface ErrorResponse {
  error: {
    message: string;
    code: string;
  };
}

const asAgent = (body: unknown): AgentResponse => body as AgentResponse;
const asList = (body: unknown): ListAgentsResponse => body as ListAgentsResponse;
const asCreate = (body: unknown): CreateAgentResponse => body as CreateAgentResponse;
const asError = (body: unknown): ErrorResponse => body as ErrorResponse;

describe("Agents API", () => {
  const app = createTestApp();

  let testUser: Awaited<ReturnType<typeof createTestUser>>;
  let sessionToken: string;

  beforeEach(async () => {
    await cleanDatabase();

    const role = await seedRoleWithAgentsPermission("UNLIMITED");
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
  // GET / - List Agents
  // ===========================================================================

  describe("GET / - List Agents", () => {
    it("returns empty list when no agents exist", async () => {
      const res = await request(app)
        .get("/agents")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data).toHaveLength(0);
      expect(body.pagination.total).toBe(0);
    });

    it("returns paginated list", async () => {
      await createTestAgent({ firstName: "Agent", lastName: "One" });
      await createTestAgent({ firstName: "Agent", lastName: "Two" });
      await createTestAgent({ firstName: "Agent", lastName: "Three" });

      const res = await request(app)
        .get("/agents?limit=2&page=1")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data).toHaveLength(2);
      expect(body.pagination.total).toBe(3);
      expect(body.pagination.totalPages).toBe(2);
    });

    it("filters by isActive=true", async () => {
      await createTestAgent({ firstName: "Active", lastName: "Agent", isActive: true });
      await createTestAgent({ firstName: "Inactive", lastName: "Agent", isActive: false });

      const res = await request(app)
        .get("/agents?isActive=true")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.every((a) => a.isActive === true)).toBe(true);
    });

    it("filters by isActive=false", async () => {
      await createTestAgent({ firstName: "Active", lastName: "Agent", isActive: true });
      await createTestAgent({ firstName: "Inactive", lastName: "Agent", isActive: false });

      const res = await request(app)
        .get("/agents?isActive=false")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.every((a) => a.isActive === false)).toBe(true);
      expect(body.data).toHaveLength(1);
    });

    it("searches by firstName", async () => {
      await createTestAgent({ firstName: "Alice", lastName: "Agent" });
      await createTestAgent({ firstName: "Bob", lastName: "Agent" });

      const res = await request(app)
        .get("/agents?search=Alice")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.some((a) => a.firstName === "Alice")).toBe(true);
      expect(body.data.every((a) => a.firstName === "Bob")).toBe(false);
    });

    it("searches by lastName", async () => {
      await createTestAgent({ firstName: "Alice", lastName: "Smith" });
      await createTestAgent({ firstName: "Bob", lastName: "Jones" });

      const res = await request(app)
        .get("/agents?search=Jones")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.some((a) => a.lastName === "Jones")).toBe(true);
    });

    it("searches by email", async () => {
      await createTestAgent({ firstName: "Test", lastName: "Agent", email: "unique-agent@example.com" });
      await createTestAgent({ firstName: "Other", lastName: "Agent", email: "other-agent@example.com" });

      const res = await request(app)
        .get("/agents?search=unique-agent")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.some((a) => a.email.includes("unique-agent"))).toBe(true);
    });

    it("sorts by firstName ascending", async () => {
      await createTestAgent({ firstName: "Zack", lastName: "Agent" });
      await createTestAgent({ firstName: "Aaron", lastName: "Agent" });

      const res = await request(app)
        .get("/agents?sortBy=firstName&sortOrder=asc")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data[0]!.firstName).toBe("Aaron");
    });

    it("sorts by createdAt descending", async () => {
      const first = await createTestAgent({ firstName: "First", lastName: "Agent" });
      await new Promise((r) => setTimeout(r, 10));
      const second = await createTestAgent({ firstName: "Second", lastName: "Agent" });

      const res = await request(app)
        .get("/agents?sortBy=createdAt&sortOrder=desc")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      const ids = body.data.map((a) => a.id);
      expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));
    });

    it("requires authentication", async () => {
      const res = await request(app).get("/agents");

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .get("/agents")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`);

      expect(res.status).toBe(403);
    });

    it("requires agents:read permission", async () => {
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .get("/agents")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // GET /:id - Get Agent
  // ===========================================================================

  describe("GET /:id - Get Agent", () => {
    it("returns agent details with clientCount", async () => {
      const agent = await createTestAgent({
        firstName: "Test",
        lastName: "Agent",
        phone: "+1234567890",
        licenseNumber: "LIC-123",
        agencyName: "Test Agency",
      });

      const client = await createTestClient();
      await assignAgentClient(agent.id, client.id);

      const res = await request(app)
        .get(`/agents/${agent.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asAgent(res.body);
      expect(body.id).toBe(agent.id);
      expect(body.firstName).toBe("Test");
      expect(body.lastName).toBe("Agent");
      expect(body.phone).toBe("+1234567890");
      expect(body.licenseNumber).toBe("LIC-123");
      expect(body.agencyName).toBe("Test Agency");
      expect(body.isActive).toBe(true);
      expect(body.clientCount).toBe(1);
    });

    it("returns 404 for non-existent agent", async () => {
      const res = await request(app)
        .get("/agents/nonexistent-id")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("requires authentication", async () => {
      const agent = await createTestAgent();

      const res = await request(app).get(`/agents/${agent.id}`);

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const agent = await createTestAgent();
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .get(`/agents/${agent.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // POST / - Create Agent
  // ===========================================================================

  describe("POST / - Create Agent", () => {
    it("creates agent with required fields", async () => {
      const res = await request(app)
        .post("/agents")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          firstName: "New",
          lastName: "Agent",
          email: "new-agent@example.com",
        });

      expect(res.status).toBe(201);
      const body = asCreate(res.body);
      expect(body.id).toBeDefined();

      const agent = await db.agent.findUnique({ where: { id: body.id } });
      expect(agent?.firstName).toBe("New");
      expect(agent?.lastName).toBe("Agent");
      expect(agent?.email).toBe("new-agent@example.com");
      expect(agent?.isActive).toBe(true);
    });

    it("creates agent with all fields", async () => {
      const res = await request(app)
        .post("/agents")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          firstName: "Full",
          lastName: "Agent",
          email: "full-agent@example.com",
          phone: "+1234567890",
          licenseNumber: "LIC-456",
          agencyName: "Full Agency",
        });

      expect(res.status).toBe(201);
      const body = asCreate(res.body);

      const agent = await db.agent.findUnique({ where: { id: body.id } });
      expect(agent?.phone).toBe("+1234567890");
      expect(agent?.licenseNumber).toBe("LIC-456");
      expect(agent?.agencyName).toBe("Full Agency");
    });

    it("validates required firstName", async () => {
      const res = await request(app)
        .post("/agents")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          lastName: "Agent",
          email: "test@example.com",
        });

      expect(res.status).toBe(400);
    });

    it("validates required lastName", async () => {
      const res = await request(app)
        .post("/agents")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          firstName: "Test",
          email: "test@example.com",
        });

      expect(res.status).toBe(400);
    });

    it("validates required email", async () => {
      const res = await request(app)
        .post("/agents")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          firstName: "Test",
          lastName: "Agent",
        });

      expect(res.status).toBe(400);
    });

    it("validates email format", async () => {
      const res = await request(app)
        .post("/agents")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          firstName: "Test",
          lastName: "Agent",
          email: "invalid-email",
        });

      expect(res.status).toBe(400);
    });

    it("rejects duplicate email", async () => {
      await createTestAgent({ email: "existing@example.com" });

      const res = await request(app)
        .post("/agents")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          firstName: "New",
          lastName: "Agent",
          email: "existing@example.com",
        });

      expect(res.status).toBe(409);
      expect(asError(res.body).error.message).toContain("email");
    });

    it("requires authentication", async () => {
      const res = await request(app)
        .post("/agents")
        .send({
          firstName: "Test",
          lastName: "Agent",
          email: "test@example.com",
        });

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .post("/agents")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`)
        .send({
          firstName: "Test",
          lastName: "Agent",
          email: "test@example.com",
        });

      expect(res.status).toBe(403);
    });

    it("requires agents:create permission", async () => {
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .post("/agents")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`)
        .send({
          firstName: "Test",
          lastName: "Agent",
          email: "test@example.com",
        });

      expect(res.status).toBe(403);
    });

    it("creates audit log entry", async () => {
      await db.auditLog.deleteMany();

      const res = await request(app)
        .post("/agents")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          firstName: "Audit",
          lastName: "Agent",
          email: "audit-agent@example.com",
        });

      expect(res.status).toBe(201);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "CREATE",
          resource: "Agent",
          resourceId: asCreate(res.body).id,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.userId).toBe(testUser.id);
    });
  });

  // ===========================================================================
  // PATCH /:id - Update Agent
  // ===========================================================================

  describe("PATCH /:id - Update Agent", () => {
    it("updates firstName", async () => {
      const agent = await createTestAgent({ firstName: "Original" });

      const res = await request(app)
        .patch(`/agents/${agent.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ firstName: "Updated" });

      expect(res.status).toBe(200);
      const body = asAgent(res.body);
      expect(body.firstName).toBe("Updated");
    });

    it("updates lastName", async () => {
      const agent = await createTestAgent({ lastName: "Original" });

      const res = await request(app)
        .patch(`/agents/${agent.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ lastName: "Updated" });

      expect(res.status).toBe(200);
      const body = asAgent(res.body);
      expect(body.lastName).toBe("Updated");
    });

    it("updates email", async () => {
      const agent = await createTestAgent({ email: "original@example.com" });

      const res = await request(app)
        .patch(`/agents/${agent.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ email: "updated@example.com" });

      expect(res.status).toBe(200);
      const body = asAgent(res.body);
      expect(body.email).toBe("updated@example.com");
    });

    it("updates licenseNumber", async () => {
      const agent = await createTestAgent();

      const res = await request(app)
        .patch(`/agents/${agent.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ licenseNumber: "LIC-999" });

      expect(res.status).toBe(200);
      const body = asAgent(res.body);
      expect(body.licenseNumber).toBe("LIC-999");
    });

    it("updates agencyName", async () => {
      const agent = await createTestAgent();

      const res = await request(app)
        .patch(`/agents/${agent.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ agencyName: "New Agency" });

      expect(res.status).toBe(200);
      const body = asAgent(res.body);
      expect(body.agencyName).toBe("New Agency");
    });

    it("updates isActive", async () => {
      const agent = await createTestAgent({ isActive: true });

      const res = await request(app)
        .patch(`/agents/${agent.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      const body = asAgent(res.body);
      expect(body.isActive).toBe(false);
    });

    it("updates multiple fields", async () => {
      const agent = await createTestAgent({
        firstName: "Original",
        licenseNumber: null,
      });

      const res = await request(app)
        .patch(`/agents/${agent.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          firstName: "Updated",
          licenseNumber: "LIC-NEW",
          isActive: false,
        });

      expect(res.status).toBe(200);
      const body = asAgent(res.body);
      expect(body.firstName).toBe("Updated");
      expect(body.licenseNumber).toBe("LIC-NEW");
      expect(body.isActive).toBe(false);
    });

    it("returns 404 for non-existent agent", async () => {
      const res = await request(app)
        .patch("/agents/nonexistent-id")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ firstName: "Updated" });

      expect(res.status).toBe(404);
    });

    it("validates email uniqueness on update", async () => {
      const agent1 = await createTestAgent({ email: "agent1@example.com" });
      await createTestAgent({ email: "agent2@example.com" });

      const res = await request(app)
        .patch(`/agents/${agent1.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ email: "agent2@example.com" });

      expect(res.status).toBe(409);
    });

    it("allows same email when unchanged", async () => {
      const agent = await createTestAgent({ email: "same@example.com" });

      const res = await request(app)
        .patch(`/agents/${agent.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          email: "same@example.com",
          firstName: "Different",
        });

      expect(res.status).toBe(200);
    });

    it("returns unchanged agent when no fields to update", async () => {
      const agent = await createTestAgent({ firstName: "Test" });

      const res = await request(app)
        .patch(`/agents/${agent.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({});

      expect(res.status).toBe(200);
      const body = asAgent(res.body);
      expect(body.firstName).toBe("Test");
    });

    it("requires authentication", async () => {
      const agent = await createTestAgent();

      const res = await request(app)
        .patch(`/agents/${agent.id}`)
        .send({ firstName: "Updated" });

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const agent = await createTestAgent();
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .patch(`/agents/${agent.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`)
        .send({ firstName: "Updated" });

      expect(res.status).toBe(403);
    });

    it("requires agents:edit permission", async () => {
      const agent = await createTestAgent();
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .patch(`/agents/${agent.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`)
        .send({ firstName: "Updated" });

      expect(res.status).toBe(403);
    });

    it("creates audit log entry with old/new values", async () => {
      await db.auditLog.deleteMany();

      const agent = await createTestAgent({ firstName: "Old" });

      const res = await request(app)
        .patch(`/agents/${agent.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ firstName: "New" });

      expect(res.status).toBe(200);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "UPDATE",
          resource: "Agent",
          resourceId: agent.id,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.oldValue).toMatchObject({ firstName: "Old" });
      expect(auditLog!.newValue).toMatchObject({ firstName: "New" });
    });
  });

  // ===========================================================================
  // DELETE /:id - Delete Agent
  // ===========================================================================

  describe("DELETE /:id - Delete Agent", () => {
    it("deletes agent", async () => {
      const agent = await createTestAgent();

      const res = await request(app)
        .delete(`/agents/${agent.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(204);

      const deleted = await db.agent.findUnique({ where: { id: agent.id } });
      expect(deleted).toBeNull();
    });

    it("returns 404 for non-existent agent", async () => {
      const res = await request(app)
        .delete("/agents/nonexistent-id")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("requires authentication", async () => {
      const agent = await createTestAgent();

      const res = await request(app).delete(`/agents/${agent.id}`);

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const agent = await createTestAgent();
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .delete(`/agents/${agent.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`);

      expect(res.status).toBe(403);
    });

    it("requires agents:delete permission", async () => {
      const agent = await createTestAgent();
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .delete(`/agents/${agent.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });

    it("creates audit log entry", async () => {
      await db.auditLog.deleteMany();

      const agent = await createTestAgent({ firstName: "To Delete" });

      const res = await request(app)
        .delete(`/agents/${agent.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(204);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "DELETE",
          resource: "Agent",
          resourceId: agent.id,
        },
      });

      expect(auditLog).not.toBeNull();
    });
  });
});
