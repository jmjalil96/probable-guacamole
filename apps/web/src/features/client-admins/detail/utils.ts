import type { ClientAdmin, UpdateClientAdminRequest } from "shared";
import { isApiError } from "@/lib/api";
import { CLIENT_ADMIN_FIELD_LABELS } from "../shared";
import type { ClientAdminFormData } from "./schema";
import type { FormError } from "./types";

// =============================================================================
// Form Mappers
// =============================================================================

export function mapClientAdminToFormValues(clientAdmin: ClientAdmin): ClientAdminFormData {
  return {
    firstName: clientAdmin.firstName,
    lastName: clientAdmin.lastName,
    email: clientAdmin.email,
    phone: clientAdmin.phone,
    jobTitle: clientAdmin.jobTitle,
    isActive: clientAdmin.isActive,
  };
}

export function mapFormToRequest(
  data: ClientAdminFormData,
  original: ClientAdmin
): UpdateClientAdminRequest {
  const request: UpdateClientAdminRequest = {};

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
  if (data.jobTitle !== original.jobTitle) {
    request.jobTitle = data.jobTitle;
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
  return CLIENT_ADMIN_FIELD_LABELS[fieldName] ?? fieldName;
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
