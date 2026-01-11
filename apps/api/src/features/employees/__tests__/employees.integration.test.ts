import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { db } from "../../../config/db.js";
import { createTestApp } from "../../../test/helpers/index.js";
import { cleanDatabase } from "../../../test/db-utils.js";
import {
  seedRoleWithEmployeesPermission,
  seedRoleWithoutPermission,
  seedRoleWithNonUnlimitedScope,
  createTestUser,
  createTestSession,
  createTestEmployee,
  SESSION_COOKIE_NAME,
} from "./fixtures.js";

interface EmployeeResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  department: string | null;
  isActive: boolean;
  hasAccount: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ListEmployeesResponse {
  data: EmployeeResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateEmployeeResponse {
  id: string;
}

interface ErrorResponse {
  error: {
    message: string;
    code: string;
  };
}

const asEmployee = (body: unknown): EmployeeResponse => body as EmployeeResponse;
const asList = (body: unknown): ListEmployeesResponse => body as ListEmployeesResponse;
const asCreate = (body: unknown): CreateEmployeeResponse => body as CreateEmployeeResponse;
const asError = (body: unknown): ErrorResponse => body as ErrorResponse;

describe("Employees API", () => {
  const app = createTestApp();

  let testUser: Awaited<ReturnType<typeof createTestUser>>;
  let sessionToken: string;
  let adminEmployee: Awaited<ReturnType<typeof createTestEmployee>>;

  beforeEach(async () => {
    await cleanDatabase();

    const role = await seedRoleWithEmployeesPermission("UNLIMITED");
    adminEmployee = await createTestEmployee({ firstName: "Admin", lastName: "User" });
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
  // GET / - List Employees
  // ===========================================================================

  describe("GET / - List Employees", () => {
    it("returns list of employees", async () => {
      const res = await request(app)
        .get("/employees")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      // Admin employee from setup
      expect(body.data).toHaveLength(1);
      expect(body.pagination.total).toBe(1);
    });

    it("returns paginated list", async () => {
      await createTestEmployee({ firstName: "Employee", lastName: "One" });
      await createTestEmployee({ firstName: "Employee", lastName: "Two" });

      const res = await request(app)
        .get("/employees?limit=2&page=1")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data).toHaveLength(2);
      expect(body.pagination.total).toBe(3);
      expect(body.pagination.totalPages).toBe(2);
    });

    it("filters by isActive=true", async () => {
      await createTestEmployee({ firstName: "Active", lastName: "Emp", isActive: true });
      await createTestEmployee({ firstName: "Inactive", lastName: "Emp", isActive: false });

      const res = await request(app)
        .get("/employees?isActive=true")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.every((e) => e.isActive === true)).toBe(true);
    });

    it("filters by isActive=false", async () => {
      await createTestEmployee({ firstName: "Active", lastName: "Emp", isActive: true });
      await createTestEmployee({ firstName: "Inactive", lastName: "Emp", isActive: false });

      const res = await request(app)
        .get("/employees?isActive=false")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.every((e) => e.isActive === false)).toBe(true);
      expect(body.data).toHaveLength(1);
    });

    it("searches by firstName", async () => {
      await createTestEmployee({ firstName: "Alice", lastName: "Smith" });
      await createTestEmployee({ firstName: "Bob", lastName: "Jones" });

      const res = await request(app)
        .get("/employees?search=Alice")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.some((e) => e.firstName === "Alice")).toBe(true);
      expect(body.data.every((e) => e.firstName === "Bob")).toBe(false);
    });

    it("searches by lastName", async () => {
      await createTestEmployee({ firstName: "Alice", lastName: "Smith" });
      await createTestEmployee({ firstName: "Bob", lastName: "Jones" });

      const res = await request(app)
        .get("/employees?search=Jones")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.some((e) => e.lastName === "Jones")).toBe(true);
    });

    it("searches by email", async () => {
      await createTestEmployee({ firstName: "Test", lastName: "User", email: "unique-emp@example.com" });
      await createTestEmployee({ firstName: "Other", lastName: "User", email: "other-emp@example.com" });

      const res = await request(app)
        .get("/employees?search=unique-emp")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data.some((e) => e.email.includes("unique-emp"))).toBe(true);
    });

    it("sorts by firstName ascending", async () => {
      await createTestEmployee({ firstName: "Zack", lastName: "User" });
      await createTestEmployee({ firstName: "Aaron", lastName: "User" });

      const res = await request(app)
        .get("/employees?sortBy=firstName&sortOrder=asc")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      expect(body.data[0]!.firstName).toBe("Aaron");
    });

    it("sorts by createdAt descending", async () => {
      const first = await createTestEmployee({ firstName: "First", lastName: "User" });
      await new Promise((r) => setTimeout(r, 10));
      const second = await createTestEmployee({ firstName: "Second", lastName: "User" });

      const res = await request(app)
        .get("/employees?sortBy=createdAt&sortOrder=desc")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asList(res.body);
      const ids = body.data.map((e) => e.id);
      expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));
    });

    it("requires authentication", async () => {
      const res = await request(app).get("/employees");

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .get("/employees")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`);

      expect(res.status).toBe(403);
    });

    it("requires employees:read permission", async () => {
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .get("/employees")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // GET /:id - Get Employee
  // ===========================================================================

  describe("GET /:id - Get Employee", () => {
    it("returns employee details", async () => {
      const employee = await createTestEmployee({
        firstName: "Test",
        lastName: "Employee",
        phone: "+1234567890",
        department: "Engineering",
      });

      const res = await request(app)
        .get(`/employees/${employee.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(200);
      const body = asEmployee(res.body);
      expect(body.id).toBe(employee.id);
      expect(body.firstName).toBe("Test");
      expect(body.lastName).toBe("Employee");
      expect(body.phone).toBe("+1234567890");
      expect(body.department).toBe("Engineering");
      expect(body.isActive).toBe(true);
    });

    it("returns 404 for non-existent employee", async () => {
      const res = await request(app)
        .get("/employees/nonexistent-id")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("requires authentication", async () => {
      const employee = await createTestEmployee();

      const res = await request(app).get(`/employees/${employee.id}`);

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const employee = await createTestEmployee();
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .get(`/employees/${employee.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // POST / - Create Employee
  // ===========================================================================

  describe("POST / - Create Employee", () => {
    it("creates employee with required fields", async () => {
      const res = await request(app)
        .post("/employees")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          firstName: "New",
          lastName: "Employee",
          email: "new-employee@example.com",
        });

      expect(res.status).toBe(201);
      const body = asCreate(res.body);
      expect(body.id).toBeDefined();

      const employee = await db.employee.findUnique({ where: { id: body.id } });
      expect(employee?.firstName).toBe("New");
      expect(employee?.lastName).toBe("Employee");
      expect(employee?.email).toBe("new-employee@example.com");
      expect(employee?.isActive).toBe(true);
    });

    it("creates employee with all fields", async () => {
      const res = await request(app)
        .post("/employees")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          firstName: "Full",
          lastName: "Employee",
          email: "full-employee@example.com",
          phone: "+1234567890",
          department: "Sales",
        });

      expect(res.status).toBe(201);
      const body = asCreate(res.body);

      const employee = await db.employee.findUnique({ where: { id: body.id } });
      expect(employee?.phone).toBe("+1234567890");
      expect(employee?.department).toBe("Sales");
    });

    it("validates required firstName", async () => {
      const res = await request(app)
        .post("/employees")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          lastName: "Employee",
          email: "test@example.com",
        });

      expect(res.status).toBe(400);
    });

    it("validates required lastName", async () => {
      const res = await request(app)
        .post("/employees")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          firstName: "Test",
          email: "test@example.com",
        });

      expect(res.status).toBe(400);
    });

    it("validates required email", async () => {
      const res = await request(app)
        .post("/employees")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          firstName: "Test",
          lastName: "Employee",
        });

      expect(res.status).toBe(400);
    });

    it("validates email format", async () => {
      const res = await request(app)
        .post("/employees")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          firstName: "Test",
          lastName: "Employee",
          email: "invalid-email",
        });

      expect(res.status).toBe(400);
    });

    it("rejects duplicate email", async () => {
      await createTestEmployee({ email: "existing@example.com" });

      const res = await request(app)
        .post("/employees")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          firstName: "New",
          lastName: "Employee",
          email: "existing@example.com",
        });

      expect(res.status).toBe(409);
      expect(asError(res.body).error.message).toContain("email");
    });

    it("requires authentication", async () => {
      const res = await request(app)
        .post("/employees")
        .send({
          firstName: "Test",
          lastName: "Employee",
          email: "test@example.com",
        });

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .post("/employees")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`)
        .send({
          firstName: "Test",
          lastName: "Employee",
          email: "test@example.com",
        });

      expect(res.status).toBe(403);
    });

    it("requires employees:create permission", async () => {
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .post("/employees")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`)
        .send({
          firstName: "Test",
          lastName: "Employee",
          email: "test@example.com",
        });

      expect(res.status).toBe(403);
    });

    it("creates audit log entry", async () => {
      await db.auditLog.deleteMany();

      const res = await request(app)
        .post("/employees")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          firstName: "Audit",
          lastName: "Employee",
          email: "audit-employee@example.com",
        });

      expect(res.status).toBe(201);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "CREATE",
          resource: "Employee",
          resourceId: asCreate(res.body).id,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.userId).toBe(testUser.id);
    });
  });

  // ===========================================================================
  // PATCH /:id - Update Employee
  // ===========================================================================

  describe("PATCH /:id - Update Employee", () => {
    it("updates firstName", async () => {
      const employee = await createTestEmployee({ firstName: "Original" });

      const res = await request(app)
        .patch(`/employees/${employee.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ firstName: "Updated" });

      expect(res.status).toBe(200);
      const body = asEmployee(res.body);
      expect(body.firstName).toBe("Updated");
    });

    it("updates lastName", async () => {
      const employee = await createTestEmployee({ lastName: "Original" });

      const res = await request(app)
        .patch(`/employees/${employee.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ lastName: "Updated" });

      expect(res.status).toBe(200);
      const body = asEmployee(res.body);
      expect(body.lastName).toBe("Updated");
    });

    it("updates email", async () => {
      const employee = await createTestEmployee({ email: "original@example.com" });

      const res = await request(app)
        .patch(`/employees/${employee.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ email: "updated@example.com" });

      expect(res.status).toBe(200);
      const body = asEmployee(res.body);
      expect(body.email).toBe("updated@example.com");
    });

    it("updates phone", async () => {
      const employee = await createTestEmployee();

      const res = await request(app)
        .patch(`/employees/${employee.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ phone: "+9876543210" });

      expect(res.status).toBe(200);
      const body = asEmployee(res.body);
      expect(body.phone).toBe("+9876543210");
    });

    it("updates department", async () => {
      const employee = await createTestEmployee();

      const res = await request(app)
        .patch(`/employees/${employee.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ department: "Marketing" });

      expect(res.status).toBe(200);
      const body = asEmployee(res.body);
      expect(body.department).toBe("Marketing");
    });

    it("updates isActive", async () => {
      const employee = await createTestEmployee({ isActive: true });

      const res = await request(app)
        .patch(`/employees/${employee.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      const body = asEmployee(res.body);
      expect(body.isActive).toBe(false);
    });

    it("updates multiple fields", async () => {
      const employee = await createTestEmployee({
        firstName: "Original",
        department: null,
      });

      const res = await request(app)
        .patch(`/employees/${employee.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          firstName: "Updated",
          department: "Engineering",
          isActive: false,
        });

      expect(res.status).toBe(200);
      const body = asEmployee(res.body);
      expect(body.firstName).toBe("Updated");
      expect(body.department).toBe("Engineering");
      expect(body.isActive).toBe(false);
    });

    it("returns 404 for non-existent employee", async () => {
      const res = await request(app)
        .patch("/employees/nonexistent-id")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ firstName: "Updated" });

      expect(res.status).toBe(404);
    });

    it("validates email uniqueness on update", async () => {
      const employee1 = await createTestEmployee({ email: "employee1@example.com" });
      await createTestEmployee({ email: "employee2@example.com" });

      const res = await request(app)
        .patch(`/employees/${employee1.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ email: "employee2@example.com" });

      expect(res.status).toBe(409);
    });

    it("allows same email when unchanged", async () => {
      const employee = await createTestEmployee({ email: "same@example.com" });

      const res = await request(app)
        .patch(`/employees/${employee.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({
          email: "same@example.com",
          firstName: "Different",
        });

      expect(res.status).toBe(200);
    });

    it("returns unchanged employee when no fields to update", async () => {
      const employee = await createTestEmployee({ firstName: "Test" });

      const res = await request(app)
        .patch(`/employees/${employee.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({});

      expect(res.status).toBe(200);
      const body = asEmployee(res.body);
      expect(body.firstName).toBe("Test");
    });

    it("requires authentication", async () => {
      const employee = await createTestEmployee();

      const res = await request(app)
        .patch(`/employees/${employee.id}`)
        .send({ firstName: "Updated" });

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const employee = await createTestEmployee();
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .patch(`/employees/${employee.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`)
        .send({ firstName: "Updated" });

      expect(res.status).toBe(403);
    });

    it("requires employees:edit permission", async () => {
      const employee = await createTestEmployee();
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .patch(`/employees/${employee.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`)
        .send({ firstName: "Updated" });

      expect(res.status).toBe(403);
    });

    it("creates audit log entry with old/new values", async () => {
      await db.auditLog.deleteMany();

      const employee = await createTestEmployee({ firstName: "Old" });

      const res = await request(app)
        .patch(`/employees/${employee.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`)
        .send({ firstName: "New" });

      expect(res.status).toBe(200);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "UPDATE",
          resource: "Employee",
          resourceId: employee.id,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.oldValue).toMatchObject({ firstName: "Old" });
      expect(auditLog!.newValue).toMatchObject({ firstName: "New" });
    });
  });

  // ===========================================================================
  // DELETE /:id - Delete Employee
  // ===========================================================================

  describe("DELETE /:id - Delete Employee", () => {
    it("deletes employee", async () => {
      const employee = await createTestEmployee();

      const res = await request(app)
        .delete(`/employees/${employee.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(204);

      const deleted = await db.employee.findUnique({ where: { id: employee.id } });
      expect(deleted).toBeNull();
    });

    it("returns 404 for non-existent employee", async () => {
      const res = await request(app)
        .delete("/employees/nonexistent-id")
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(404);
    });

    it("requires authentication", async () => {
      const employee = await createTestEmployee();

      const res = await request(app).delete(`/employees/${employee.id}`);

      expect(res.status).toBe(401);
    });

    it("requires UNLIMITED scope", async () => {
      const employee = await createTestEmployee();
      const clientRole = await seedRoleWithNonUnlimitedScope("CLIENT");
      const clientUser = await createTestUser(clientRole.id);
      const { token: clientToken } = await createTestSession(clientUser.id);

      const res = await request(app)
        .delete(`/employees/${employee.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${clientToken}`);

      expect(res.status).toBe(403);
    });

    it("requires employees:delete permission", async () => {
      const employee = await createTestEmployee();
      const noPermRole = await seedRoleWithoutPermission();
      const noPermUser = await createTestUser(noPermRole.id);
      const { token: noPermToken } = await createTestSession(noPermUser.id);

      const res = await request(app)
        .delete(`/employees/${employee.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${noPermToken}`);

      expect(res.status).toBe(403);
    });

    it("creates audit log entry", async () => {
      await db.auditLog.deleteMany();

      const employee = await createTestEmployee({ firstName: "To Delete" });

      const res = await request(app)
        .delete(`/employees/${employee.id}`)
        .set("Cookie", `${SESSION_COOKIE_NAME}=${sessionToken}`);

      expect(res.status).toBe(204);

      await new Promise((r) => setTimeout(r, 100));

      const auditLog = await db.auditLog.findFirst({
        where: {
          action: "DELETE",
          resource: "Employee",
          resourceId: employee.id,
        },
      });

      expect(auditLog).not.toBeNull();
    });
  });
});
