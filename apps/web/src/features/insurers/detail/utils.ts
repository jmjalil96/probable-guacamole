import type { Insurer, UpdateInsurerRequest } from "shared";
import { isApiError } from "@/lib/api";
import { INSURER_FIELD_LABELS } from "../shared";
import type { InsurerFormData } from "./schema";
import type { FormError } from "./types";

// =============================================================================
// Form Mappers
// =============================================================================

/**
 * Maps an Insurer to InsurerFormData values.
 * Handles nullable fields consistently.
 */
export function mapInsurerToFormValues(insurer: Insurer): InsurerFormData {
  return {
    name: insurer.name,
    code: insurer.code,
    email: insurer.email,
    phone: insurer.phone,
    website: insurer.website,
    type: insurer.type,
    isActive: insurer.isActive,
  };
}

/**
 * Transforms form values to API request format.
 * Only includes fields that have changed.
 */
export function mapFormToRequest(
  data: InsurerFormData,
  original: Insurer
): UpdateInsurerRequest {
  const request: UpdateInsurerRequest = {};

  if (data.name !== original.name) {
    request.name = data.name;
  }
  if (data.code !== original.code) {
    request.code = data.code;
  }
  if ((data.email || null) !== original.email) {
    request.email = data.email || null;
  }
  if (data.phone !== original.phone) {
    request.phone = data.phone;
  }
  if ((data.website || null) !== original.website) {
    request.website = data.website || null;
  }
  if (data.type !== original.type) {
    request.type = data.type;
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
  return INSURER_FIELD_LABELS[fieldName] ?? fieldName;
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

  // Handle "has policies" error for delete
  if (
    error.message.toLowerCase().includes("policies") ||
    error.message.toLowerCase().includes("polizas")
  ) {
    return {
      title: "No se puede eliminar",
      description: "Esta aseguradora tiene polizas asociadas.",
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
