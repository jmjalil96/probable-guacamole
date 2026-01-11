// Filter Options
export const IS_ACTIVE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "true", label: "Activo" },
  { value: "false", label: "Inactivo" },
];

export const USER_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "employee", label: "Empleado" },
  { value: "agent", label: "Agente" },
  { value: "client_admin", label: "Admin Cliente" },
  { value: "affiliate", label: "Afiliado" },
];

export const HAS_ACCOUNT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "true", label: "Con cuenta" },
  { value: "false", label: "Sin cuenta" },
];

// Display Labels
export const ACTIVE_LABELS: Record<string, string> = {
  true: "Activo",
  false: "Inactivo",
};

export const USER_TYPE_LABELS: Record<string, string> = {
  employee: "Empleado",
  agent: "Agente",
  client_admin: "Admin Cliente",
  affiliate: "Afiliado",
};

export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  has_account: "Con cuenta",
  pending_invitation: "Invitacion pendiente",
  no_account: "Sin cuenta",
};

// Styles
export const ACTIVE_STYLES: Record<string, string> = {
  true: "bg-green-50 text-green-700",
  false: "bg-gray-100 text-text-muted",
};

export const USER_TYPE_STYLES: Record<string, string> = {
  employee: "bg-blue-50 text-blue-700",
  agent: "bg-purple-50 text-purple-700",
  client_admin: "bg-amber-50 text-amber-700",
  affiliate: "bg-teal-50 text-teal-700",
};

export const ACCOUNT_STATUS_STYLES: Record<string, string> = {
  has_account: "bg-green-50 text-green-700",
  pending_invitation: "bg-amber-50 text-amber-700",
  no_account: "bg-gray-100 text-text-muted",
};
