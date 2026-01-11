import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { db } from "../../../../config/db.js";
import { createTestApp } from "../../../../test/helpers/index.js";
import { cleanDatabase } from "../../../../test/db-utils.js";
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

interface AgentClientResponse {
  agentId: string;
  clientId: string;
  clientName: string;
  assignedAt: string;
}

interface ListAgentClientsResponse {
  data: AgentClientResponse[];
}

interface AssignAgentClientResponse {
  agentId: string;
  clientId: string;
  assignedAt: string;
}

interface ErrorResponse {
  error: {
    message: string;
    code: string;
  };
}

const asList = (body: unknown): ListAgentClientsResponse => body as ListAgentClientsResponse;
const asAssign = (body: unknown): AssignAgentClientResponse => body as AssignAgentClientResponse;
const asError = (body: unknown): ErrorResponse => body as ErrorResponse;

describe("Agent Clients API", () => {
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
  // GET /:agentId/clients - List Agent Clients
  // ===========================================================================

  describe("GET /:agentId/clients - List Agent Clients", () => {
    it("returns empty list when no clients assigned", async () => {
      const agent = await createTestAgent();

      const res = await request(app)
        .get(`/agents/${agent.id}/clients`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data).toHaveLength(0);
    });

    it("returns list of assigned clients", async () => {
      const agent = await createTestAgent();
      const client1 = await createTestClient({ name: "Client One" });
      const client2 = await createTestClient({ name: "Client Two" });
      await assignAgentClient(agent.id, client1.id);
      await assignAgentClient(agent.id, client2.id);

      const res = await request(app)
        .get(`/agents/${agent.id}/clients`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data).toHaveLength(2);
      expect(body.data.map((c) => c.clientName)).toContain("Client One");
      expect(body.data.map((c) => c.clientName)).toContain("Client Two");
    });

    it("returns 404 for non-existent agent", async () => {
      const res = await request(app)
        .get("/agents/nonexistent-id/clients")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("requires authentication", async () => {
      const agent = await createTestAgent();

      const res = await request(app).get(`/agents/${agent.id}/clients`);

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const agent = await createTestAgent();
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .get(`/agents/${agent.id}/clients`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`);

      expect(res.status).toBe(403);
    });

    it("requires agents:read permission", async () => {
      const agent = await createTestAgent();
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .get(`/agents/${agent.id}/clients`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // POST /:agentId/clients/:clientId - Assign Client to Agent
  // ===========================================================================

  describe("POST /:agentId/clients/:clientId - Assign Client to Agent", () => {
    it("assigns client to agent", async () => {
      const agent = await createTestAgent();
      const client = await createTestClient();

      const res = await request(app)
        .post(`/agents/${agent.id}/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(201);
      const body = asAssign(res.body);
      expect(body.agentId).toBe(agent.id);
      expect(body.clientId).toBe(client.id);
      expect(body.assignedAt).toBeDefined();

      const assignment = await db.agentClient.findUnique({
        where: { agentId_clientId: { agentId: agent.id, clientId: client.id } },
      });
      expect(assignment).not.toBeNull();
    });

    it("returns 404 for non-existent agent", async () => {
      const client = await createTestClient();

      const res = await request(app)
        .post(`/agents/nonexistent-id/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("returns 404 for non-existent client", async () => {
      const agent = await createTestAgent();

      const res = await request(app)
        .post(`/agents/${agent.id}/clients/nonexistent-id`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("returns 409 if already assigned", async () => {
      const agent = await createTestAgent();
      const client = await createTestClient();
      await assignAgentClient(agent.id, client.id);

      const res = await request(app)
        .post(`/agents/${agent.id}/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(409);
      expect(asError(res.body).error.message).toContain("already assigned");
    });

    it("requires authentication", async () => {
      const agent = await createTestAgent();
      const client = await createTestClient();

      const res = await request(app).post(`/agents/${agent.id}/clients/${client.id}`);

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const agent = await createTestAgent();
      const client = await createTestClient();
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .post(`/agents/${agent.id}/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`);

      expect(res.status).toBe(403);
    });

    it("requires agents:edit permission", async () => {
      const agent = await createTestAgent();
      const client = await createTestClient();
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .post(`/agents/${agent.id}/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });

    it("creates audit log entry", async () => {
      await db.auditLog.deleteMany();

      const agent = await createTestAgent();
      const client = await createTestClient();

      const res = await request(app)
        .post(`/agents/${agent.id}/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(201);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "CREATE",
          resource: "AgentClient",
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.userId).toBe(testUser.id);
    });
  });

  // ===========================================================================
  // DELETE /:agentId/clients/:clientId - Remove Client from Agent
  // ===========================================================================

  describe("DELETE /:agentId/clients/:clientId - Remove Client from Agent", () => {
    it("removes client from agent", async () => {
      const agent = await createTestAgent();
      const client = await createTestClient();
      await assignAgentClient(agent.id, client.id);

      const res = await request(app)
        .delete(`/agents/${agent.id}/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(204);

      const assignment = await db.agentClient.findUnique({
        where: { agentId_clientId: { agentId: agent.id, clientId: client.id } },
      });
      expect(assignment).toBeNull();
    });

    it("returns 404 for non-existent agent", async () => {
      const client = await createTestClient();

      const res = await request(app)
        .delete(`/agents/nonexistent-id/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("returns 404 if not assigned", async () => {
      const agent = await createTestAgent();
      const client = await createTestClient();

      const res = await request(app)
        .delete(`/agents/${agent.id}/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("requires authentication", async () => {
      const agent = await createTestAgent();
      const client = await createTestClient();
      await assignAgentClient(agent.id, client.id);

      const res = await request(app).delete(`/agents/${agent.id}/clients/${client.id}`);

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const agent = await createTestAgent();
      const client = await createTestClient();
      await assignAgentClient(agent.id, client.id);
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .delete(`/agents/${agent.id}/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`);

      expect(res.status).toBe(403);
    });

    it("requires agents:edit permission", async () => {
      const agent = await createTestAgent();
      const client = await createTestClient();
      await assignAgentClient(agent.id, client.id);
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .delete(`/agents/${agent.id}/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });

    it("creates audit log entry", async () => {
      await db.auditLog.deleteMany();

      const agent = await createTestAgent();
      const client = await createTestClient();
      await assignAgentClient(agent.id, client.id);

      const res = await request(app)
        .delete(`/agents/${agent.id}/clients/${client.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(204);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "DELETE",
          resource: "AgentClient",
        },
      });

      expect(auditLog).not.toBeNull();
    });
  });
});
