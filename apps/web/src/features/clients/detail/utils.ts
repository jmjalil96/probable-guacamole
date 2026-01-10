import type { Client, UpdateClientRequest } from "shared";
import { isApiError } from "@/lib/api";
import { CLIENT_FIELD_LABELS } from "../shared";
import type { ClientFormData } from "./schema";
import type { FormError } from "./types";

// =============================================================================
// Form Mappers
// =============================================================================

/**
 * Maps a Client to ClientFormData values.
 */
export function mapClientToFormValues(client: Client): ClientFormData {
  return {
    name: client.name,
    isActive: client.isActive,
  };
}

/**
 * Transforms form values to API request format.
 * Only includes fields that have changed.
 */
export function mapFormToRequest(
  data: ClientFormData,
  original: Client
): UpdateClientRequest {
  const request: UpdateClientRequest = {};

  if (data.name !== original.name) {
    request.name = data.name;
  }
  if (data.isActive !== original.isActive) {
    request.isActive = data.isActive;
  }

  return request;
}

// =============================================================================
// Error Extraction
// =============================================================================

/**
 * Converts a technical field name to a user-friendly Spanish label.
 */
function getFieldLabel(fieldName: string): string {
  return CLIENT_FIELD_LABELS[fieldName] ?? fieldName;
}

/**
 * Extracts a structured, user-friendly error from an ApiError or generic Error.
 * Transforms technical field names to Spanish labels.
 */
export function extractFormError(error: Error): FormError {
  if (!isApiError(error)) {
    return {
      title: "Error al guardar",
      description: error.message || "Ocurrio un error inesperado",
    };
  }

  // Handle network errors
  if (error.isNetworkError) {
    return {
      title: "Sin conexion",
      description: "Verifique su conexion a internet e intente nuevamente.",
    };
  }

  // Handle "has affiliates" error for delete
  if (
    error.message.toLowerCase().includes("affiliates") ||
    error.message.toLowerCase().includes("afiliados")
  ) {
    return {
      title: "No se puede eliminar",
      description: "Este cliente tiene afiliados asociados.",
    };
  }

  // Handle "has claims" error for delete
  if (
    error.message.toLowerCase().includes("claims") ||
    error.message.toLowerCase().includes("reclamos")
  ) {
    return {
      title: "No se puede eliminar",
      description: "Este cliente tiene reclamos asociados.",
    };
  }

  // Handle "has policies" error for delete
  if (
    error.message.toLowerCase().includes("policies") ||
    error.message.toLowerCase().includes("polizas")
  ) {
    return {
      title: "No se puede eliminar",
      description: "Este cliente tiene polizas asociadas.",
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
