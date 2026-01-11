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

export const AGENT_FIELD_LABELS: Record<string, string> = {
  firstName: "Nombre",
  lastName: "Apellido",
  email: "Correo Electronico",
  phone: "Telefono",
  licenseNumber: "Numero de Licencia",
  agencyName: "Agencia",
  isActive: "Estado",
};
