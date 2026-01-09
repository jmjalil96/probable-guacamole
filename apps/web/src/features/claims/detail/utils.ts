import type { ClaimDetail, UpdateClaimRequest } from "shared";
import { isApiError } from "@/lib/api";
import { CLAIM_FIELD_LABELS, STATUS_LABELS } from "../shared";
import type { EditClaimForm } from "./schema";
import type { TransitionError } from "./types";

// =============================================================================
// Form Mappers
// =============================================================================

/**
 * Maps a ClaimDetail to EditClaimForm values.
 * Handles nullable fields consistently.
 */
export function mapClaimToFormValues(claim: ClaimDetail): EditClaimForm {
  return {
    policyId: claim.policy?.id ?? null,
    careType: claim.careType,
    diagnosis: claim.diagnosis,
    description: claim.description,
    incidentDate: claim.incidentDate,
    submittedDate: claim.submittedDate,
    settlementDate: claim.settlementDate,
    amountSubmitted: claim.amountSubmitted,
    amountApproved: claim.amountApproved,
    amountDenied: claim.amountDenied,
    amountUnprocessed: claim.amountUnprocessed,
    deductibleApplied: claim.deductibleApplied,
    copayApplied: claim.copayApplied,
    settlementNumber: claim.settlementNumber,
    settlementNotes: claim.settlementNotes,
  };
}

/**
 * Transforms form values to API request format.
 * Only includes fields that have changed.
 */
export function mapFormToRequest(
  data: EditClaimForm,
  original: ClaimDetail
): UpdateClaimRequest {
  const request: UpdateClaimRequest = {};

  if (data.policyId !== (original.policy?.id ?? null)) {
    request.policyId = data.policyId;
  }
  if (data.careType !== original.careType) {
    request.careType = data.careType;
  }
  if (data.diagnosis !== original.diagnosis) {
    request.diagnosis = data.diagnosis;
  }
  if (data.description !== original.description) {
    request.description = data.description;
  }
  if (data.incidentDate !== original.incidentDate) {
    request.incidentDate = data.incidentDate;
  }
  if (data.submittedDate !== original.submittedDate) {
    request.submittedDate = data.submittedDate;
  }
  if (data.settlementDate !== original.settlementDate) {
    request.settlementDate = data.settlementDate;
  }
  if (data.amountSubmitted !== original.amountSubmitted) {
    request.amountSubmitted = data.amountSubmitted;
  }
  if (data.amountApproved !== original.amountApproved) {
    request.amountApproved = data.amountApproved;
  }
  if (data.amountDenied !== original.amountDenied) {
    request.amountDenied = data.amountDenied;
  }
  if (data.amountUnprocessed !== original.amountUnprocessed) {
    request.amountUnprocessed = data.amountUnprocessed;
  }
  if (data.deductibleApplied !== original.deductibleApplied) {
    request.deductibleApplied = data.deductibleApplied;
  }
  if (data.copayApplied !== original.copayApplied) {
    request.copayApplied = data.copayApplied;
  }
  if (data.settlementNumber !== original.settlementNumber) {
    request.settlementNumber = data.settlementNumber;
  }
  if (data.settlementNotes !== original.settlementNotes) {
    request.settlementNotes = data.settlementNotes;
  }

  return request;
}

// =============================================================================
// Error Extraction Types & Defaults
// =============================================================================

interface ExtractErrorOptions {
  /** Default title for generic errors */
  defaultTitle?: string;
  /** Default description for generic errors */
  defaultDescription?: string;
  /** Title for validation errors with items */
  validationTitle?: string;
  /** Description for validation errors with items */
  validationDescription?: string;
}

const TRANSITION_DEFAULTS: ExtractErrorOptions = {
  defaultTitle: "Error al actualizar estado",
  validationTitle: "Campos requeridos",
  validationDescription: "Complete los siguientes campos para continuar:",
};

const FORM_DEFAULTS: ExtractErrorOptions = {
  defaultTitle: "Error al guardar",
  defaultDescription: "No se pudo completar la operación.",
  validationTitle: "Error de validación",
  validationDescription: "Corrija los siguientes campos:",
};

// =============================================================================
// Error Extraction Helpers
// =============================================================================

/**
 * Converts a technical field name to a user-friendly Spanish label.
 */
function getFieldLabel(fieldName: string): string {
  return CLAIM_FIELD_LABELS[fieldName] ?? fieldName;
}

/**
 * Parses "Missing required fields for STATUS: field1, field2" format.
 */
function parseMissingFieldsMessage(message: string): TransitionError | null {
  const match = message.match(/^Missing required fields for (\w+):\s*(.+)$/i);
  if (!match || !match[1] || !match[2]) return null;

  const status = match[1];
  const fieldsStr = match[2];
  const fields = fieldsStr.split(",").map((f) => f.trim());
  const fieldLabels = fields.map(getFieldLabel);
  const statusLabel =
    STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status;

  return {
    title: "Campos requeridos",
    description: `Para pasar a "${statusLabel}", complete los siguientes campos:`,
    items: fieldLabels,
  };
}

/**
 * Parses "Fields not editable in STATUS status: field1, field2" format.
 */
function parseNotEditableFieldsMessage(
  message: string
): TransitionError | null {
  const match = message.match(/^Fields not editable in (\w+) status:\s*(.+)$/i);
  if (!match || !match[1] || !match[2]) return null;

  const status = match[1];
  const fieldsStr = match[2];
  const fields = fieldsStr.split(",").map((f) => f.trim());
  const fieldLabels = fields.map(getFieldLabel);
  const statusLabel =
    STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status;

  return {
    title: "Campos no editables",
    description: `Los siguientes campos no pueden modificarse en estado "${statusLabel}":`,
    items: fieldLabels,
  };
}

/**
 * Transforms common error message patterns to user-friendly text.
 */
function transformErrorMessage(
  message: string,
  defaultTitle: string
): { title: string; description: string } {
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes("network") || lowerMsg.includes("timeout")) {
    return {
      title: "Error de conexión",
      description:
        "No se pudo conectar con el servidor. Verifique su conexión e intente de nuevo.",
    };
  }

  if (lowerMsg.includes("unauthorized") || lowerMsg.includes("401")) {
    return {
      title: "Sesión expirada",
      description:
        "Su sesión ha expirado. Por favor, inicie sesión nuevamente.",
    };
  }

  if (lowerMsg.includes("forbidden") || lowerMsg.includes("403")) {
    return {
      title: "Acceso denegado",
      description: "No tiene permisos para realizar esta acción.",
    };
  }

  return {
    title: defaultTitle,
    description: message,
  };
}

/**
 * Extracts field error items from API error details.
 */
function extractFieldErrorItems(error: {
  details:
    | {
        fieldErrors?: Record<string, string[]>;
        formErrors?: string[];
      }
    | undefined;
  message: string;
}): string[] {
  const items: string[] = [];

  // Extract formErrors (check for "Missing required fields" patterns)
  if (error.details?.formErrors) {
    for (const formError of error.details.formErrors) {
      const parsed = parseMissingFieldsMessage(formError);
      if (parsed) {
        items.push(...parsed.items);
      } else {
        items.push(formError);
      }
    }
  }

  // Extract fieldErrors with Spanish labels
  if (error.details?.fieldErrors) {
    for (const [field, messages] of Object.entries(error.details.fieldErrors)) {
      const label = getFieldLabel(field);
      for (const message of messages) {
        const lowerMsg = message.toLowerCase();
        if (lowerMsg === "required" || lowerMsg === "requerido") {
          items.push(label);
        } else {
          items.push(`${label}: ${message}`);
        }
      }
    }
  }

  return items;
}

// =============================================================================
// Core Extraction Function
// =============================================================================

/**
 * Core error extraction with configurable defaults.
 * Used by both extractTransitionError and extractFormError.
 */
function extractError(
  error: Error,
  options: ExtractErrorOptions = {}
): TransitionError {
  const {
    defaultTitle = "Error",
    defaultDescription = "Ocurrió un error inesperado",
    validationTitle = "Campos requeridos",
    validationDescription = "Complete los siguientes campos:",
  } = options;

  // Handle non-API errors
  if (!isApiError(error)) {
    const { title, description } = transformErrorMessage(
      error.message || defaultDescription,
      defaultTitle
    );
    return { title, description, items: [] };
  }

  // Check for "Not editable fields" pattern (form-specific)
  const parsedNotEditable = parseNotEditableFieldsMessage(error.message);
  if (parsedNotEditable) {
    return parsedNotEditable;
  }

  // Check for "Missing required fields" pattern in main message
  const parsedMissing = parseMissingFieldsMessage(error.message);
  if (parsedMissing) {
    return parsedMissing;
  }

  // Handle network errors
  if (error.isNetworkError) {
    return {
      title: "Sin conexión",
      description: "Verifique su conexión a internet e intente nuevamente.",
      items: [],
    };
  }

  // Handle auth errors
  if (error.isUnauthorized) {
    return {
      title: "Sesión expirada",
      description: "Por favor inicie sesión nuevamente.",
      items: [],
    };
  }

  // Extract field error items
  const items = extractFieldErrorItems(error);

  // If we have validation items, use validation title/description
  if (items.length > 0) {
    const isRequiredError = error.message.toLowerCase().includes("required");
    return {
      title: isRequiredError ? validationTitle : validationTitle,
      description: validationDescription,
      items,
    };
  }

  // Generic API error
  const { title, description } = transformErrorMessage(
    error.message || defaultDescription,
    defaultTitle
  );
  return { title, description, items: [] };
}

// =============================================================================
// Public Functions
// =============================================================================

/**
 * Extracts a structured, user-friendly error from an ApiError or generic Error.
 * Transforms technical field names to Spanish labels and parses common error patterns.
 * Used for status transitions.
 */
export function extractTransitionError(error: Error): TransitionError {
  return extractError(error, TRANSITION_DEFAULTS);
}

/**
 * Extracts a structured, user-friendly error from an ApiError or generic Error.
 * Similar to extractTransitionError but with form-appropriate default messages.
 * Used for form submissions (edit modal, etc.).
 */
export function extractFormError(error: Error): TransitionError {
  return extractError(error, FORM_DEFAULTS);
}
