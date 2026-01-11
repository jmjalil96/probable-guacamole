import type { Prisma } from "@prisma/client";
import { db } from "../../config/db.js";

// =============================================================================
// Types
// =============================================================================

export interface FindEmployeesParams {
  where: Prisma.EmployeeWhereInput;
  skip: number;
  take: number;
  orderBy:
    | Prisma.EmployeeOrderByWithRelationInput
    | Prisma.EmployeeOrderByWithRelationInput[];
}

export interface CreateEmployeeData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  department?: string | null;
}

// =============================================================================
// Queries
// =============================================================================

export async function findEmployees(params: FindEmployeesParams) {
  return db.employee.findMany({
    where: params.where,
    skip: params.skip,
    take: params.take,
    orderBy: params.orderBy,
  });
}

export async function countEmployees(
  where: Prisma.EmployeeWhereInput
): Promise<number> {
  return db.employee.count({ where });
}

export async function findEmployeeById(id: string) {
  return db.employee.findUnique({
    where: { id },
  });
}

export async function findEmployeeByEmail(email: string) {
  return db.employee.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
}

// =============================================================================
// Mutations
// =============================================================================

export async function createEmployee(data: CreateEmployeeData) {
  return db.employee.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.department !== undefined && { department: data.department }),
    },
  });
}

export async function updateEmployee(
  id: string,
  data: Prisma.EmployeeUpdateInput
) {
  return db.employee.update({
    where: { id },
    data,
  });
}

export async function deleteEmployee(id: string) {
  return db.employee.delete({
    where: { id },
  });
}

// =============================================================================
// Relation Checks
// =============================================================================

export async function countEmployeeInvitations(
  employeeId: string
): Promise<number> {
  return db.invitation.count({
    where: { employeeId },
  });
}
