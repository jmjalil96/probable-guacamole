import type { InsurerType } from "shared";

// =============================================================================
// Filter Options
// =============================================================================

// These arrays provide label mappings for UI dropdowns.
// Values must match shared InsurerType enum exactly.

export const TYPE_OPTIONS: Array<{ value: InsurerType; label: string }> = [
  { value: "MEDICINA_PREPAGADA", label: "Medicina Prepagada" },
  { value: "COMPANIA_DE_SEGUROS", label: "Compania de Seguros" },
];

export const IS_ACTIVE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "true", label: "Activo" },
  { value: "false", label: "Inactivo" },
];

// =============================================================================
// Display Labels & Styles
// =============================================================================

export const TYPE_LABELS: Record<InsurerType, string> = {
  MEDICINA_PREPAGADA: "Medicina Prepagada",
  COMPANIA_DE_SEGUROS: "Compania de Seguros",
};

export const TYPE_STYLES: Record<InsurerType, string> = {
  MEDICINA_PREPAGADA: "bg-purple-50 text-purple-700",
  COMPANIA_DE_SEGUROS: "bg-blue-50 text-blue-700",
};

export const ACTIVE_LABELS: Record<string, string> = {
  true: "Activo",
  false: "Inactivo",
};

export const ACTIVE_STYLES: Record<string, string> = {
  true: "bg-green-50 text-green-700",
  false: "bg-gray-100 text-text-muted",
};

// =============================================================================
// Field Labels (for error messages)
// =============================================================================

/**
 * Maps API field names to user-friendly Spanish labels.
 * Used for transforming technical field names in error messages.
 */
export const INSURER_FIELD_LABELS: Record<string, string> = {
  name: "Nombre",
  code: "Codigo",
  email: "Email",
  phone: "Telefono",
  website: "Sitio Web",
  type: "Tipo",
  isActive: "Estado",
};
