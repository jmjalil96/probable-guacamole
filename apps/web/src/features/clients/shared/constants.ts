// =============================================================================
// Filter Options
// =============================================================================

export const IS_ACTIVE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "true", label: "Activo" },
  { value: "false", label: "Inactivo" },
];

// =============================================================================
// Display Labels & Styles
// =============================================================================

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
export const CLIENT_FIELD_LABELS: Record<string, string> = {
  name: "Nombre",
  isActive: "Estado",
};
