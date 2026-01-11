import type { Gender, MaritalStatus, DependentRelationship } from "shared";

// =============================================================================
// Filter Options
// =============================================================================

export const PORTAL_ACCESS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "true", label: "Con acceso" },
  { value: "false", label: "Sin acceso" },
  { value: "pending", label: "Invitación pendiente" },
];

// =============================================================================
// Display Labels & Styles
// =============================================================================

export const ACTIVE_STYLES: Record<string, string> = {
  true: "bg-green-50 text-green-700",
  false: "bg-gray-100 text-text-muted",
};

export const ACTIVE_LABELS: Record<string, string> = {
  true: "Activo",
  false: "Inactivo",
};

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: "Masculino",
  FEMALE: "Femenino",
  OTHER: "Otro",
};

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
  SINGLE: "Soltero/a",
  MARRIED: "Casado/a",
  DIVORCED: "Divorciado/a",
  WIDOWED: "Viudo/a",
  DOMESTIC_PARTNERSHIP: "Unión Libre",
};

export const RELATIONSHIP_LABELS: Record<DependentRelationship, string> = {
  SPOUSE: "Cónyuge",
  CHILD: "Hijo/a",
  PARENT: "Padre/Madre",
  SIBLING: "Hermano/a",
  OTHER: "Otro",
};

// =============================================================================
// Field Labels (for error messages)
// =============================================================================

/**
 * Maps API field names to user-friendly Spanish labels.
 * Used for transforming technical field names in error messages.
 */
export const AFFILIATE_FIELD_LABELS: Record<string, string> = {
  // Relations
  clientId: "Cliente",

  // Personal info
  firstName: "Nombre",
  lastName: "Apellido",
  documentType: "Tipo de Documento",
  documentNumber: "Número de Documento",
  dateOfBirth: "Fecha de Nacimiento",
  gender: "Género",
  maritalStatus: "Estado Civil",

  // Contact
  email: "Email",
  phone: "Teléfono",

  // Portal access
  hasPortalAccess: "Acceso al Portal",
  portalInvitationPending: "Invitación Pendiente",

  // Status
  isActive: "Estado",
};
