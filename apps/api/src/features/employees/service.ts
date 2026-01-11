import type { Prisma } from "@prisma/client";
import type {
  ListEmployeesQuery,
  ListEmployeesResponse,
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
} from "shared";
import { logger } from "../../lib/logger.js";
import { AppError } from "../../lib/errors.js";
import * as audit from "../../services/audit/audit.js";
import * as repo from "./repository.js";
import { mapEmployeeToResponse } from "./utils.js";

// =============================================================================
// Types
// =============================================================================

export interface ListEmployeesParams {
  query: ListEmployeesQuery;
  user: { id: string };
  requestId?: string;
}

export interface GetEmployeeParams {
  employeeId: string;
  user: { id: string };
  requestId?: string;
}

export interface CreateEmployeeParams {
  request: CreateEmployeeRequest;
  user: { id: string };
  requestId?: string;
}

export interface UpdateEmployeeParams {
  employeeId: string;
  updates: UpdateEmployeeRequest;
  user: { id: string };
  requestId?: string;
}

export interface DeleteEmployeeParams {
  employeeId: string;
  user: { id: string };
  requestId?: string;
}

// =============================================================================
// Constants
// =============================================================================

const ORDER_BY_MAP: Record<string, string> = {
  firstName: "firstName",
  lastName: "lastName",
  email: "email",
  department: "department",
  createdAt: "createdAt",
};

// =============================================================================
// Where Clause Building
// =============================================================================

function buildWhereClause(
  query: ListEmployeesQuery
): Prisma.EmployeeWhereInput {
  const where: Prisma.EmployeeWhereInput = {
    isActive: query.isActive,
  };

  // Add search filter (firstName, lastName, email)
  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: "insensitive" } },
      { lastName: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
    ];
  }

  // Add department filter
  if (query.department) {
    where.department = { contains: query.department, mode: "insensitive" };
  }

  // Add hasAccount filter
  if (query.hasAccount !== undefined) {
    where.userId = query.hasAccount ? { not: null } : null;
  }

  return where;
}

// =============================================================================
// List Employees
// =============================================================================

export async function listEmployees(
  params: ListEmployeesParams
): Promise<ListEmployeesResponse> {
  const { query, user, requestId } = params;
  const log = logger.child({ module: "employees", requestId });

  log.debug({ userId: user.id }, "list employees started");

  const where = buildWhereClause(query);
  const orderBy = [
    { [ORDER_BY_MAP[query.sortBy] ?? "lastName"]: query.sortOrder },
    { id: "asc" as const },
  ];

  const [employees, total] = await Promise.all([
    repo.findEmployees({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy,
    }),
    repo.countEmployees(where),
  ]);

  log.debug({ count: employees.length, total }, "list employees completed");

  return {
    data: employees.map(mapEmployeeToResponse),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

// =============================================================================
// Get Employee
// =============================================================================

export async function getEmployee(
  params: GetEmployeeParams,
  context: audit.AuditContext
): Promise<Employee> {
  const { employeeId, user, requestId } = params;
  const log = logger.child({ module: "employees", requestId });

  log.debug({ employeeId, userId: user.id }, "get employee started");

  const employee = await repo.findEmployeeById(employeeId);

  if (!employee) {
    log.debug({ employeeId }, "employee not found");
    throw AppError.notFound("Employee");
  }

  audit.log(
    {
      action: audit.AuditActions.READ,
      resource: "Employee",
      resourceId: employee.id,
    },
    context
  );

  log.debug({ employeeId }, "get employee completed");

  return mapEmployeeToResponse(employee);
}

// =============================================================================
// Create Employee
// =============================================================================

export interface CreateEmployeeResult {
  id: string;
}

export async function createEmployee(
  params: CreateEmployeeParams,
  context: audit.AuditContext
): Promise<CreateEmployeeResult> {
  const { request, user, requestId } = params;
  const log = logger.child({ module: "employees", requestId });

  log.debug(
    { email: request.email, userId: user.id },
    "create employee started"
  );

  // Check email uniqueness (case-insensitive)
  const existingByEmail = await repo.findEmployeeByEmail(request.email);
  if (existingByEmail) {
    log.debug({ email: request.email }, "employee email already exists");
    throw AppError.conflict("Employee with this email already exists");
  }

  // Create employee
  const employee = await repo.createEmployee({
    firstName: request.firstName,
    lastName: request.lastName,
    email: request.email,
    phone: request.phone && request.phone !== "" ? request.phone : null,
    department:
      request.department && request.department !== "" ? request.department : null,
  });

  log.info(
    { employeeId: employee.id, email: employee.email },
    "employee created"
  );

  audit.log(
    {
      action: audit.AuditActions.CREATE,
      resource: "Employee",
      resourceId: employee.id,
      metadata: {
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
      },
    },
    context
  );

  log.debug({ employeeId: employee.id }, "create employee completed");

  return { id: employee.id };
}

// =============================================================================
// Update Employee
// =============================================================================

export async function updateEmployee(
  params: UpdateEmployeeParams,
  context: audit.AuditContext
): Promise<Employee> {
  const { employeeId, updates, user, requestId } = params;
  const log = logger.child({ module: "employees", requestId });

  log.debug({ employeeId, userId: user.id }, "update employee started");

  // Fetch existing
  const existing = await repo.findEmployeeById(employeeId);
  if (!existing) {
    log.debug({ employeeId }, "employee not found");
    throw AppError.notFound("Employee");
  }

  // Check email uniqueness if changed
  if (
    updates.email !== undefined &&
    updates.email.toLowerCase() !== existing.email.toLowerCase()
  ) {
    const existingByEmail = await repo.findEmployeeByEmail(updates.email);
    if (existingByEmail) {
      log.debug({ email: updates.email }, "employee email already exists");
      throw AppError.conflict("Employee with this email already exists");
    }
  }

  // Build update data
  const updateData: Record<string, unknown> = {};
  const updatedFields: string[] = [];

  if (updates.firstName !== undefined) {
    updateData.firstName = updates.firstName;
    updatedFields.push("firstName");
  }
  if (updates.lastName !== undefined) {
    updateData.lastName = updates.lastName;
    updatedFields.push("lastName");
  }
  if (updates.email !== undefined) {
    updateData.email = updates.email;
    updatedFields.push("email");
  }
  if (updates.phone !== undefined) {
    updateData.phone = updates.phone === "" ? null : updates.phone;
    updatedFields.push("phone");
  }
  if (updates.department !== undefined) {
    updateData.department = updates.department === "" ? null : updates.department;
    updatedFields.push("department");
  }
  if (updates.isActive !== undefined) {
    updateData.isActive = updates.isActive;
    updatedFields.push("isActive");
  }

  // Check for empty update
  if (updatedFields.length === 0) {
    log.debug({ employeeId }, "no fields to update");
    return mapEmployeeToResponse(existing);
  }

  // Update employee
  const updated = await repo.updateEmployee(employeeId, updateData);

  log.info({ employeeId, fields: updatedFields }, "employee updated");

  // Extract old/new values for audit
  const extractFields = (record: Record<string, unknown>, fields: string[]) =>
    Object.fromEntries(fields.map((f) => [f, record[f]]));

  audit.log(
    {
      action: audit.AuditActions.UPDATE,
      resource: "Employee",
      resourceId: employeeId,
      oldValue: extractFields(
        existing as unknown as Record<string, unknown>,
        updatedFields
      ),
      newValue: extractFields(
        updated as unknown as Record<string, unknown>,
        updatedFields
      ),
      metadata: { updatedFields },
    },
    context
  );

  log.debug({ employeeId }, "update employee completed");

  return mapEmployeeToResponse(updated);
}

// =============================================================================
// Delete Employee
// =============================================================================

export async function deleteEmployee(
  params: DeleteEmployeeParams,
  context: audit.AuditContext
): Promise<void> {
  const { employeeId, user, requestId } = params;
  const log = logger.child({ module: "employees", requestId });

  log.debug({ employeeId, userId: user.id }, "delete employee started");

  // Fetch existing
  const existing = await repo.findEmployeeById(employeeId);
  if (!existing) {
    log.debug({ employeeId }, "employee not found");
    throw AppError.notFound("Employee");
  }

  // Check for related invitations
  const invitationCount = await repo.countEmployeeInvitations(employeeId);
  if (invitationCount > 0) {
    log.debug(
      { employeeId, invitationCount },
      "employee has related invitations"
    );
    throw AppError.conflict(
      `Cannot delete employee with ${invitationCount} related invitations`
    );
  }

  // Delete employee
  await repo.deleteEmployee(employeeId);

  log.info({ employeeId, email: existing.email }, "employee deleted");

  audit.log(
    {
      action: audit.AuditActions.DELETE,
      resource: "Employee",
      resourceId: employeeId,
      metadata: {
        email: existing.email,
        firstName: existing.firstName,
        lastName: existing.lastName,
      },
    },
    context
  );

  log.debug({ employeeId }, "delete employee completed");
}
