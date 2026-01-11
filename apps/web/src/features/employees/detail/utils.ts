import type { Employee, UpdateEmployeeRequest } from "shared";
import { isApiError } from "@/lib/api";
import { EMPLOYEE_FIELD_LABELS } from "../shared";
import type { EmployeeFormData } from "./schema";
import type { FormError } from "./types";

// =============================================================================
// Form Mappers
// =============================================================================

export function mapEmployeeToFormValues(employee: Employee): EmployeeFormData {
  return {
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone,
    department: employee.department,
    isActive: employee.isActive,
  };
}

export function mapFormToRequest(
  data: EmployeeFormData,
  original: Employee
): UpdateEmployeeRequest {
  const request: UpdateEmployeeRequest = {};

  if (data.firstName !== original.firstName) {
    request.firstName = data.firstName;
  }
  if (data.lastName !== original.lastName) {
    request.lastName = data.lastName;
  }
  if (data.email !== original.email) {
    request.email = data.email;
  }
  if (data.phone !== original.phone) {
    request.phone = data.phone;
  }
  if (data.department !== original.department) {
    request.department = data.department;
  }
  if (data.isActive !== original.isActive) {
    request.isActive = data.isActive;
  }

  return request;
}

// =============================================================================
// Error Extraction
// =============================================================================

function getFieldLabel(fieldName: string): string {
  return EMPLOYEE_FIELD_LABELS[fieldName] ?? fieldName;
}

export function extractFormError(error: Error): FormError {
  if (!isApiError(error)) {
    return {
      title: "Error al guardar",
      description: error.message || "Ocurrio un error inesperado",
    };
  }

  if (error.isNetworkError) {
    return {
      title: "Sin conexion",
      description: "Verifique su conexion a internet e intente nuevamente.",
    };
  }

  // Handle uniqueness errors
  if (
    error.message.toLowerCase().includes("already exists") ||
    error.message.toLowerCase().includes("ya existe")
  ) {
    return {
      title: "Error de validacion",
      description: error.message,
    };
  }

  // Extract field errors
  const items: string[] = [];
  if (error.details?.fieldErrors) {
    for (const [field, messages] of Object.entries(error.details.fieldErrors)) {
      const label = getFieldLabel(field);
      for (const message of messages) {
        items.push(`${label}: ${message}`);
      }
    }
  }

  if (items.length > 0) {
    return {
      title: "Error de validacion",
      description: "Corrija los siguientes campos:",
      items,
    };
  }

  return {
    title: "Error al guardar",
    description: error.message || "No se pudo completar la operacion.",
  };
}
