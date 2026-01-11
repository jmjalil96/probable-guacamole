import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { createTestApp } from "../../../test/helpers/index.js";
import { cleanDatabase } from "../../../test/db-utils.js";
import {
  seedRoleWithUsersPermission,
  seedRoleWithoutPermission,
  seedRoleWithNonUnlimitedScope,
  createTestUser,
  createTestSession,
  createTestEmployee,
  createTestAgent,
  createTestClientAdmin,
  createTestClient,
  createTestAffiliate,
  SESSION_COOKIE_NAME,
} from "./fixtures.js";

interface UserListItem {
  id: string;
  type: "employee" | "agent" | "client_admin" | "affiliate";
  firstName: string;
  lastName: string;
  email: string | null;
  isActive: boolean;
  hasAccount: boolean;
  createdAt: string;
}

interface ListUsersResponse {
  data: UserListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const asList = (body: unknown): ListUsersResponse => body as ListUsersResponse;

describe("Users API", () => {
  const app = createTestApp();

  let testUser: Awaited<ReturnType<typeof createTestUser>>;
  let sessionToken: string;

  beforeEach(async () => {
    await cleanDatabase();

    const role = await seedRoleWithUsersPermission("UNLIMITED");
    const testEmployee = await createTestEmployee({ firstName: "Admin", lastName: "User" });
    testUser = await createTestUser(role.id);
    await import("../../../config/db.js").then(({ db }) =>
      db.employee.update({
        where: { id: testEmployee.id },
        data: { userId: testUser.id },
      })
    );

    const session = await createTestSession(testUser.id);
    sessionToken = session.token;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // ===========================================================================
  // GET / - List Users
  // ===========================================================================

  describe("GET / - List Users", () => {
    it("returns empty list when no users exist (except test user's employee)", async () => {
      const res = await request(app)
        .get("/users")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      // Only the admin employee from setup
      expect(body.data).toHaveLength(1);
      expect(body.data[0]!.type).toBe("employee");
    });

    it("returns paginated list of users", async () => {
      await createTestEmployee({ firstName: "Employee", lastName: "One" });
      await createTestEmployee({ firstName: "Employee", lastName: "Two" });

      const res = await request(app)
        .get("/users?limit=2&page=1")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data).toHaveLength(2);
      // 3 total: Admin from setup + 2 new
      expect(body.pagination.total).toBe(3);
      expect(body.pagination.totalPages).toBe(2);
    });

    it("returns users of all types", async () => {
      await createTestEmployee({ firstName: "Emp", lastName: "User" });
      await createTestAgent({ firstName: "Agent", lastName: "User" });
      await createTestClientAdmin({ firstName: "ClientAdmin", lastName: "User" });
      const client = await createTestClient();
      await createTestAffiliate(client.id, { firstName: "Affiliate", lastName: "User" });

      const res = await request(app)
        .get("/users?limit=100")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);

      const types = body.data.map((u) => u.type);
      expect(types).toContain("employee");
      expect(types).toContain("agent");
      expect(types).toContain("client_admin");
      expect(types).toContain("affiliate");
    });

    it("filters by type=employee", async () => {
      await createTestEmployee({ firstName: "Emp", lastName: "One" });
      await createTestAgent({ firstName: "Agent", lastName: "One" });

      const res = await request(app)
        .get("/users?type=employee")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.every((u) => u.type === "employee")).toBe(true);
    });

    it("filters by type=agent", async () => {
      await createTestEmployee({ firstName: "Emp", lastName: "One" });
      await createTestAgent({ firstName: "Agent", lastName: "One" });

      const res = await request(app)
        .get("/users?type=agent")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.every((u) => u.type === "agent")).toBe(true);
      expect(body.data).toHaveLength(1);
    });

    it("filters by type=client_admin", async () => {
      await createTestEmployee({ firstName: "Emp", lastName: "One" });
      await createTestClientAdmin({ firstName: "ClientAdmin", lastName: "One" });

      const res = await request(app)
        .get("/users?type=client_admin")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.every((u) => u.type === "client_admin")).toBe(true);
      expect(body.data).toHaveLength(1);
    });

    it("filters by type=affiliate", async () => {
      await createTestEmployee({ firstName: "Emp", lastName: "One" });
      const client = await createTestClient();
      await createTestAffiliate(client.id, { firstName: "Aff", lastName: "One" });

      const res = await request(app)
        .get("/users?type=affiliate")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.every((u) => u.type === "affiliate")).toBe(true);
      expect(body.data).toHaveLength(1);
    });

    it("filters by isActive=true", async () => {
      await createTestEmployee({ firstName: "Active", lastName: "User", isActive: true });
      await createTestEmployee({ firstName: "Inactive", lastName: "User", isActive: false });

      const res = await request(app)
        .get("/users?isActive=true")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.every((u) => u.isActive === true)).toBe(true);
    });

    it("filters by isActive=false", async () => {
      await createTestEmployee({ firstName: "Active", lastName: "User", isActive: true });
      await createTestEmployee({ firstName: "Inactive", lastName: "User", isActive: false });

      const res = await request(app)
        .get("/users?isActive=false")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.every((u) => u.isActive === false)).toBe(true);
      expect(body.data).toHaveLength(1);
    });

    it("filters by hasAccount=true", async () => {
      const role = await seedRoleWithUsersPermission("UNLIMITED", `role-${Date.now()}`);
      const userWithAccount = await createTestUser(role.id);
      await createTestEmployee({
        firstName: "With",
        lastName: "Account",
        userId: userWithAccount.id
      });
      await createTestEmployee({ firstName: "No", lastName: "Account" });

      const res = await request(app)
        .get("/users?hasAccount=true")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.every((u) => u.hasAccount === true)).toBe(true);
    });

    it("filters by hasAccount=false", async () => {
      const role = await seedRoleWithUsersPermission("UNLIMITED", `role-${Date.now()}`);
      const userWithAccount = await createTestUser(role.id);
      await createTestEmployee({
        firstName: "With",
        lastName: "Account",
        userId: userWithAccount.id
      });
      await createTestEmployee({ firstName: "No", lastName: "Account" });

      const res = await request(app)
        .get("/users?hasAccount=false")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.every((u) => u.hasAccount === false)).toBe(true);
    });

    it("searches by firstName", async () => {
      await createTestEmployee({ firstName: "Alice", lastName: "Smith" });
      await createTestEmployee({ firstName: "Bob", lastName: "Jones" });

      const res = await request(app)
        .get("/users?search=Alice")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.some((u) => u.firstName === "Alice")).toBe(true);
      expect(body.data.every((u) => u.firstName === "Bob")).toBe(false);
    });

    it("searches by lastName", async () => {
      await createTestEmployee({ firstName: "Alice", lastName: "Smith" });
      await createTestEmployee({ firstName: "Bob", lastName: "Jones" });

      const res = await request(app)
        .get("/users?search=Jones")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.some((u) => u.lastName === "Jones")).toBe(true);
    });

    it("searches by email", async () => {
      await createTestEmployee({ firstName: "Test", lastName: "User", email: "unique-test@example.com" });
      await createTestEmployee({ firstName: "Other", lastName: "User", email: "other@example.com" });

      const res = await request(app)
        .get("/users?search=unique-test")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.some((u) => u.email?.includes("unique-test"))).toBe(true);
    });

    it("sorts by name ascending (default)", async () => {
      await createTestEmployee({ firstName: "Zack", lastName: "Zebra" });
      await createTestEmployee({ firstName: "Aaron", lastName: "Aardvark" });

      const res = await request(app)
        .get("/users?sortBy=name&sortOrder=asc")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      // Sort by lastName + firstName
      const firstUser = body.data[0]!;
      expect(firstUser.lastName).toBe("Aardvark");
    });

    it("sorts by name descending", async () => {
      await createTestEmployee({ firstName: "Aaron", lastName: "Aardvark" });
      await createTestEmployee({ firstName: "Zack", lastName: "Zebra" });

      const res = await request(app)
        .get("/users?sortBy=name&sortOrder=desc")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      const firstUser = body.data[0]!;
      expect(firstUser.lastName).toBe("Zebra");
    });

    it("sorts by createdAt descending", async () => {
      const first = await createTestEmployee({ firstName: "First", lastName: "User" });
      await new Promise((r) => setTimeout(r, 10));
      const second = await createTestEmployee({ firstName: "Second", lastName: "User" });

      const res = await request(app)
        .get("/users?sortBy=createdAt&sortOrder=desc&type=employee")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      // Second should be first in desc order
      const ids = body.data.map((u) => u.id);
      expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));
    });

    it("requires authentication", async () => {
      const res = await request(app).get("/users");

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .get("/users")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`);

      expect(res.status).toBe(403);
    });

    it("requires users:read permission", async () => {
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .get("/users")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });
  });
});
