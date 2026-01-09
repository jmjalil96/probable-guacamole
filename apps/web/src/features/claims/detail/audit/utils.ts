import { format, parseISO, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import type { AuditLogItem } from "shared";
import type {
  AuditEventGroup,
  AuditActionColor,
  EventDetail,
  FieldChange,
} from "./types";

// =============================================================================
// Date Grouping
// =============================================================================

/**
 * Actions to exclude from the activity feed.
 * READ actions are internal access logs, not meaningful user actions.
 */
const EXCLUDED_ACTIONS = new Set(["READ"]);

/**
 * Groups audit events by date with localized labels.
 * Groups: "Hoy", "Ayer", or formatted date (e.g., "Miercoles, 18 dic")
 */
export function groupEventsByDate(events: AuditLogItem[]): AuditEventGroup[] {
  if (!events.length) return [];

  // Filter out excluded actions (like READ) and sort by date descending
  const filtered = events.filter((e) => !EXCLUDED_ACTIONS.has(e.action));
  if (!filtered.length) return [];

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const groups: AuditEventGroup[] = [];
  let currentGroup: AuditEventGroup | null = null;

  for (const event of sorted) {
    const eventDate = parseISO(event.createdAt);
    const dateKey = format(eventDate, "yyyy-MM-dd");
    const label = getDateLabel(eventDate);

    if (!currentGroup || currentGroup.date !== dateKey) {
      currentGroup = { label, date: dateKey, events: [] };
      groups.push(currentGroup);
    }
    currentGroup.events.push(event);
  }

  return groups;
}

/**
 * Returns human-readable date label.
 */
function getDateLabel(date: Date): string {
  if (isToday(date)) return "Hoy";
  if (isYesterday(date)) return "Ayer";
  // Format: "Miercoles, 18 dic" - capitalize first letter
  const formatted = format(date, "EEEE, d MMM", { locale: es });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

// =============================================================================
// Relative Time Formatting
// =============================================================================

/**
 * Formats time as relative (e.g., "2h") or short date.
 */
export function formatRelativeTime(dateStr: string): string {
  const date = parseISO(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "ahora";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (isYesterday(date)) return "1d";

  // For older dates, show short date
  return format(date, "d MMM", { locale: es });
}

// =============================================================================
// Action Color Mapping
// =============================================================================

const ACTION_COLOR_MAP: Record<string, AuditActionColor> = {
  // Claim lifecycle
  CLAIM_CREATED: "created",
  CREATE: "created",
  CLAIM_UPDATED: "status",
  UPDATE: "status",
  CLAIM_STATUS_CHANGED: "status",
  CLAIM_TRANSITIONED: "status",
  STATUS_CHANGE: "status",

  // Documents
  FILE_UPLOADED: "document",
  FILE_UPLOAD_INITIATED: "document",
  FILE_DELETED: "document",
  DELETE: "document",

  // Notes
  NOTE_ADDED: "note",
  NOTE_UPDATED: "note",
  NOTE_DELETED: "note",

  // Assignment
  CLAIM_ASSIGNED: "assigned",
  ADJUSTER_ASSIGNED: "assigned",
  ROLE_ASSIGNED: "assigned",

  // Approval/Settlement
  CLAIM_APPROVED: "approved",
  CLAIM_SETTLED: "approved",

  // Payment
  PAYMENT_ISSUED: "payment",
  PAYMENT_DISBURSED: "payment",

  // Invoices
  INVOICE_ADDED: "payment",
  INVOICE_UPDATED: "payment",
  INVOICE_DELETED: "payment",
};

/**
 * Returns the color category for an action.
 */
export function getActionColor(action: string): AuditActionColor {
  return ACTION_COLOR_MAP[action] ?? "default";
}

/**
 * CSS color values for each action category (from design mock).
 */
export const ACTION_COLORS: Record<AuditActionColor, string> = {
  created: "#43a047",
  status: "#0835a0",
  document: "#7b1fa2",
  note: "#5c6bc0",
  assigned: "#00897b",
  approved: "#2e7d32",
  payment: "#0835a0",
  default: "#999999",
};

// =============================================================================
// Action Label Mapping
// =============================================================================

const ACTION_LABELS: Record<string, string> = {
  // Claim lifecycle
  CLAIM_CREATED: "Reclamo creado",
  CREATE: "Registro creado",
  CLAIM_UPDATED: "Reclamo actualizado",
  UPDATE: "Registro actualizado",
  CLAIM_STATUS_CHANGED: "Estado cambiado",
  CLAIM_TRANSITIONED: "Estado cambiado",
  STATUS_CHANGE: "Estado cambiado",

  // Documents
  FILE_UPLOADED: "Documento subido",
  FILE_UPLOAD_INITIATED: "Documento subido",
  FILE_DELETED: "Documento eliminado",
  DELETE: "Registro eliminado",

  // Notes
  NOTE_ADDED: "Nota agregada",
  NOTE_UPDATED: "Nota actualizada",
  NOTE_DELETED: "Nota eliminada",

  // Assignment
  CLAIM_ASSIGNED: "Reclamo asignado",
  ADJUSTER_ASSIGNED: "Ajustador asignado",
  ROLE_ASSIGNED: "Rol asignado",

  // Approval/Settlement
  CLAIM_APPROVED: "Reclamo aprobado",
  CLAIM_SETTLED: "Reclamo liquidado",

  // Payment
  PAYMENT_ISSUED: "Pago emitido",
  PAYMENT_DISBURSED: "Pago procesado",

  // Invoices
  INVOICE_ADDED: "Factura agregada",
  INVOICE_UPDATED: "Factura actualizada",
  INVOICE_DELETED: "Factura eliminada",
};

/**
 * Returns human-readable label for an action.
 */
export function getActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ").toLowerCase();
}

// =============================================================================
// User Initials
// =============================================================================

/**
 * Extracts initials from a user name (up to 2 characters).
 */
export function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (
    parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)
  ).toUpperCase();
}

// =============================================================================
// Field Labels (Spanish)
// =============================================================================

const FIELD_LABELS: Record<string, string> = {
  // Claim fields
  description: "Descripción",
  diagnosis: "Diagnóstico",
  incidentDate: "Fecha de Incidente",
  careType: "Tipo de Atención",
  status: "Estado",
  // Submission fields
  amountSubmitted: "Monto Enviado",
  submittedDate: "Fecha de Envío",
  // Settlement fields
  amountApproved: "Monto Aprobado",
  amountDenied: "Monto Rechazado",
  amountUnprocessed: "Sin Procesar",
  deductibleApplied: "Deducible",
  copayApplied: "Copago",
  settlementDate: "Fecha de Liquidación",
  settlementNumber: "Número de Liquidación",
  settlementNotes: "Notas de Liquidación",
  businessDays: "Días Hábiles",
  // Invoice fields
  invoiceNumber: "Número de Factura",
  providerName: "Proveedor",
  // File fields
  fileName: "Nombre de Archivo",
  fileSize: "Tamaño",
  contentType: "Tipo",
  category: "Categoría",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  IN_REVIEW: "En Revisión",
  SUBMITTED: "Enviado",
  PENDING_INFO: "Info Pendiente",
  RETURNED: "Devuelto",
  CANCELLED: "Cancelado",
  SETTLED: "Liquidado",
};

const CATEGORY_LABELS: Record<string, string> = {
  invoice: "Factura",
  receipt: "Recibo",
  medical_report: "Informe Médico",
  prescription: "Receta",
  id_document: "Documento de Identidad",
  other: "Otro",
};

// =============================================================================
// Formatting Helpers
// =============================================================================

function formatFieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

function formatClaimStatus(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

function formatFileCategory(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

function formatMonetaryValue(value: unknown): string {
  if (typeof value === "number") {
    return `$${value.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
  }
  if (typeof value === "string") {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return `$${num.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
    }
    return value;
  }
  return "—";
}

function formatFileSizeValue(bytes: unknown): string {
  if (typeof bytes === "number") {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (typeof bytes === "string") return bytes;
  return "—";
}

function formatDateValue(value: unknown): string {
  if (typeof value !== "string") return "—";
  try {
    const date = parseISO(value);
    return format(date, "d MMM yyyy", { locale: es });
  } catch {
    return value;
  }
}

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return "—";
}

function formatFieldValue(field: string, value: unknown): string {
  if (value === null || value === undefined) return "—";

  // Status fields
  if (field === "status" || field === "fromStatus" || field === "toStatus") {
    if (typeof value === "string") return formatClaimStatus(value);
    return "—";
  }

  // Monetary fields
  if (
    field.includes("amount") ||
    field.includes("Amount") ||
    field.includes("deductible") ||
    field.includes("copay")
  ) {
    return formatMonetaryValue(value);
  }

  // Date fields
  if (
    field.includes("Date") ||
    field.includes("date") ||
    field === "createdAt"
  ) {
    return formatDateValue(value);
  }

  // File size
  if (field === "fileSize") {
    return formatFileSizeValue(value);
  }

  // Category
  if (field === "category") {
    if (typeof value === "string") return formatFileCategory(value);
    return "—";
  }

  return safeString(value);
}

// =============================================================================
// Event Detail Extraction
// =============================================================================

type MetaRecord = Record<string, unknown>;
type ValueRecord = Record<string, unknown>;

/**
 * Infers the resource type from action and metadata.
 * The API doesn't return resource, so we infer it from context.
 */
function inferResource(
  action: string,
  meta: MetaRecord,
  oldVal: ValueRecord,
  newVal: ValueRecord
): string | null {
  // File-related actions
  if (action === "FILE_UPLOAD_INITIATED") return "ClaimFile";
  if (action.includes("FILE")) return "ClaimFile";

  // Invoice-related - check for invoice fields
  if (oldVal.invoiceNumber !== undefined || newVal.invoiceNumber !== undefined)
    return "ClaimInvoice";
  if (oldVal.providerName !== undefined || newVal.providerName !== undefined)
    return "ClaimInvoice";

  // Claim by default for most operations
  if (meta.claimNumber !== undefined) return "Claim";
  if (action === "STATUS_CHANGE") return "Claim";

  return null;
}

/**
 * Extracts rich, display-friendly details from audit event.
 */
export function getEventDetail(event: AuditLogItem): EventDetail {
  const { action, oldValue, newValue, metadata } = event;

  const meta = (metadata ?? {}) as MetaRecord;
  const oldVal = (oldValue ?? {}) as ValueRecord;
  const newVal = (newValue ?? {}) as ValueRecord;
  const resource = inferResource(action, meta, oldVal, newVal);

  // ---------------------------------------------------------------------------
  // STATUS_CHANGE - Show transition with reason/notes
  // ---------------------------------------------------------------------------
  if (action === "STATUS_CHANGE") {
    const fromStatusVal = oldVal.status;
    const toStatusVal = newVal.status;

    const fromStatus =
      typeof fromStatusVal === "string"
        ? formatClaimStatus(fromStatusVal)
        : null;
    const toStatus =
      typeof toStatusVal === "string" ? formatClaimStatus(toStatusVal) : null;

    const primary =
      fromStatus && toStatus ? `${fromStatus} → ${toStatus}` : toStatus;

    const secondaryParts: string[] = [];
    if (typeof meta.reason === "string" && meta.reason) {
      secondaryParts.push(`Motivo: ${meta.reason}`);
    }
    if (typeof meta.notes === "string" && meta.notes) {
      secondaryParts.push(meta.notes);
    }

    return {
      primary,
      secondary: secondaryParts.length > 0 ? secondaryParts.join(" • ") : null,
      changes: null,
    };
  }

  // ---------------------------------------------------------------------------
  // UPDATE - Show field changes
  // ---------------------------------------------------------------------------
  if (action === "UPDATE") {
    const updatedFields = Array.isArray(meta.updatedFields)
      ? meta.updatedFields
      : [];
    const changes: FieldChange[] = [];

    // Build changes from oldValue/newValue
    const allFields = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);
    for (const field of allFields) {
      if (field === "updatedAt" || field === "updatedById") continue;

      const oldFieldVal = oldVal[field];
      const newFieldVal = newVal[field];

      // Only show if there's actually a change
      if (JSON.stringify(oldFieldVal) !== JSON.stringify(newFieldVal)) {
        changes.push({
          field,
          label: formatFieldLabel(field),
          oldValue: formatFieldValue(field, oldFieldVal),
          newValue: formatFieldValue(field, newFieldVal),
        });
      }
    }

    const changeCount = changes.length || updatedFields.length;
    const primary =
      changeCount > 0
        ? `${changeCount} campo${changeCount !== 1 ? "s" : ""} modificado${changeCount !== 1 ? "s" : ""}`
        : null;

    return {
      primary,
      secondary: null,
      changes: changes.length > 0 ? changes : null,
    };
  }

  // ---------------------------------------------------------------------------
  // CREATE - Claim
  // ---------------------------------------------------------------------------
  if (action === "CREATE" && resource === "Claim") {
    const claimNumber = meta.claimNumber;
    const fileCount = typeof meta.fileCount === "number" ? meta.fileCount : 0;

    const primary =
      typeof claimNumber === "number" ? `CLM-${claimNumber}` : null;
    const secondary =
      fileCount > 0
        ? `${fileCount} archivo${fileCount !== 1 ? "s" : ""} adjunto${fileCount !== 1 ? "s" : ""}`
        : null;

    return { primary, secondary, changes: null };
  }

  // ---------------------------------------------------------------------------
  // CREATE - Invoice
  // ---------------------------------------------------------------------------
  if (action === "CREATE" && resource === "ClaimInvoice") {
    const invoiceNumber = newVal.invoiceNumber ?? meta.invoiceNumber;
    const providerName = newVal.providerName ?? meta.providerName;
    const amount = newVal.amountSubmitted ?? meta.amountSubmitted;

    const primary = typeof invoiceNumber === "string" ? invoiceNumber : null;
    const secondaryParts: string[] = [];
    if (typeof providerName === "string") secondaryParts.push(providerName);
    if (amount !== undefined) secondaryParts.push(formatMonetaryValue(amount));

    return {
      primary,
      secondary: secondaryParts.length > 0 ? secondaryParts.join(": ") : null,
      changes: null,
    };
  }

  // ---------------------------------------------------------------------------
  // DELETE - Invoice
  // ---------------------------------------------------------------------------
  if (action === "DELETE" && resource === "ClaimInvoice") {
    const invoiceNumber = oldVal.invoiceNumber;
    const providerName = oldVal.providerName;
    const amount = oldVal.amountSubmitted;

    const primary = typeof invoiceNumber === "string" ? invoiceNumber : null;
    const secondaryParts: string[] = [];
    if (typeof providerName === "string") secondaryParts.push(providerName);
    if (amount !== undefined)
      secondaryParts.push(`${formatMonetaryValue(amount)} eliminado`);

    return {
      primary,
      secondary: secondaryParts.length > 0 ? secondaryParts.join(" • ") : null,
      changes: null,
    };
  }

  // ---------------------------------------------------------------------------
  // FILE_UPLOAD_INITIATED - File
  // ---------------------------------------------------------------------------
  if (
    action === "FILE_UPLOAD_INITIATED" ||
    (action === "CREATE" && resource === "ClaimFile")
  ) {
    const fileName = newVal.fileName ?? meta.fileName;
    const fileSize = newVal.fileSize ?? meta.fileSize;
    const category = newVal.category ?? meta.category;

    const primary = typeof fileName === "string" ? fileName : null;
    const secondaryParts: string[] = [];
    if (fileSize !== undefined)
      secondaryParts.push(formatFileSizeValue(fileSize));
    if (typeof category === "string")
      secondaryParts.push(formatFileCategory(category));

    return {
      primary,
      secondary: secondaryParts.length > 0 ? secondaryParts.join(" • ") : null,
      changes: null,
    };
  }

  // ---------------------------------------------------------------------------
  // DELETE - File
  // ---------------------------------------------------------------------------
  if (action === "DELETE" && resource === "ClaimFile") {
    const fileName = oldVal.fileName;
    const category = oldVal.category;

    const primary = typeof fileName === "string" ? fileName : null;
    const secondary =
      typeof category === "string" ? formatFileCategory(category) : null;

    return { primary, secondary, changes: null };
  }

  // ---------------------------------------------------------------------------
  // Fallback for other actions
  // ---------------------------------------------------------------------------
  return { primary: null, secondary: null, changes: null };
}
