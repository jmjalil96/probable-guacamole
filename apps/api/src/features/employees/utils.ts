import type { Employee } from "shared";
import type { findEmployees } from "./repository.js";

type EmployeeData = Awaited<ReturnType<typeof findEmployees>>[number];

export function mapEmployeeToResponse(employee: EmployeeData): Employee {
  return {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone,
    department: employee.department,
    isActive: employee.isActive,
    hasAccount: employee.userId !== null,
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  };
}
