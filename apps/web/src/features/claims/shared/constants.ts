import type { ClaimStatus, CareType, ClaimFileCategory } from "shared";
import {
  Receipt,
  FileText,
  Stethoscope,
  Pill,
  IdCard,
  FolderOpen,
} from "lucide-react";
import type { FileCategory, CategoryIcons } from "@/components/file-uploader";

// =============================================================================
// Filter Options
// =============================================================================

// These arrays provide label mappings for UI dropdowns.
// Values must match shared ClaimStatus/CareType enums exactly.

export const STATUS_OPTIONS: Array<{ value: ClaimStatus; label: string }> = [
  { value: "DRAFT", label: "Borrador" },
  { value: "SUBMITTED", label: "Enviado" },
  { value: "IN_REVIEW", label: "En Revisión" },
  { value: "PENDING_INFO", label: "Info Pendiente" },
  { value: "RETURNED", label: "Devuelto" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "SETTLED", label: "Liquidado" },
];

export const CARE_TYPE_OPTIONS: Array<{ value: CareType; label: string }> = [
  { value: "AMBULATORY", label: "Ambulatorio" },
  { value: "HOSPITALARY", label: "Hospitalario" },
  { value: "OTHER", label: "Otro" },
];

// =============================================================================
// Display Labels & Styles
// =============================================================================

export const STATUS_STYLES: Record<ClaimStatus, string> = {
  DRAFT: "bg-gray-100 text-text-muted",
  SUBMITTED: "bg-blue-50 text-blue-700",
  IN_REVIEW: "bg-amber-50 text-amber-700",
  PENDING_INFO: "bg-orange-50 text-orange-700",
  RETURNED: "bg-red-50 text-red-700",
  CANCELLED: "bg-gray-100 text-text-muted",
  SETTLED: "bg-green-50 text-green-700",
};

export const STATUS_LABELS: Record<ClaimStatus, string> = {
  DRAFT: "Borrador",
  SUBMITTED: "Enviado",
  IN_REVIEW: "En Revisión",
  PENDING_INFO: "Info Pendiente",
  RETURNED: "Devuelto",
  CANCELLED: "Cancelado",
  SETTLED: "Liquidado",
};

export const CARE_TYPE_LABELS: Record<CareType, string> = {
  AMBULATORY: "Ambulatorio",
  HOSPITALARY: "Hospitalario",
  OTHER: "Otro",
};

export const CARE_TYPE_STYLES: Record<CareType, string> = {
  AMBULATORY: "bg-blue-50 text-blue-700",
  HOSPITALARY: "bg-purple-50 text-purple-700",
  OTHER: "bg-gray-100 text-text-muted",
};

// =============================================================================
// Kanban Board
// =============================================================================

export const KANBAN_STATUSES: ClaimStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "IN_REVIEW",
  "PENDING_INFO",
  "RETURNED",
  "SETTLED",
  "CANCELLED",
];

export const STATUS_COLORS: Record<ClaimStatus, string> = {
  DRAFT: "#6b7280",
  SUBMITTED: "#0835a0",
  IN_REVIEW: "#0835a0",
  PENDING_INFO: "#d97706",
  RETURNED: "#c2410c",
  SETTLED: "#16a34a",
  CANCELLED: "#ed3500",
};

// =============================================================================
// Field Labels (for error messages)
// =============================================================================

/**
 * Maps API field names to user-friendly Spanish labels.
 * Used for transforming technical field names in error messages.
 */
export const CLAIM_FIELD_LABELS: Record<string, string> = {
  // Relations
  clientId: "Cliente",
  affiliateId: "Afiliado",
  patientId: "Paciente",
  policyId: "Póliza",

  // Claim info
  careType: "Tipo de Atención",
  diagnosis: "Diagnóstico",
  description: "Descripción",

  // Dates
  incidentDate: "Fecha de Incidente",
  submittedDate: "Fecha de Envío",
  settlementDate: "Fecha de Liquidación",

  // Financial
  amountSubmitted: "Monto Enviado",
  amountApproved: "Monto Aprobado",
  amountDenied: "Monto Rechazado",
  amountUnprocessed: "Monto Sin Procesar",
  deductibleApplied: "Deducible",
  copayApplied: "Copago",

  // Other
  reason: "Motivo",
  claimNumber: "Número de Reclamo",
};

// =============================================================================
// Invoice Field Labels
// =============================================================================

/**
 * Maps invoice API field names to user-friendly Spanish labels.
 * Used for table headers and error messages.
 */
export const INVOICE_FIELD_LABELS: Record<string, string> = {
  invoiceNumber: "Número de Factura",
  providerName: "Proveedor",
  amountSubmitted: "Monto",
  createdBy: "Creado Por",
  createdAt: "Fecha",
};

// =============================================================================
// File Categories
// =============================================================================

export const CLAIM_FILE_CATEGORIES: FileCategory<ClaimFileCategory>[] = [
  { value: "invoice", label: "Factura" },
  { value: "receipt", label: "Recibo" },
  { value: "medical_report", label: "Informe médico" },
  { value: "prescription", label: "Receta" },
  { value: "id_document", label: "Documento de identidad" },
  { value: "other", label: "Otro" },
];

export const CLAIM_CATEGORY_ICONS: CategoryIcons<ClaimFileCategory> = {
  invoice: Receipt,
  receipt: FileText,
  medical_report: Stethoscope,
  prescription: Pill,
  id_document: IdCard,
  other: FolderOpen,
};

export const CLAIM_CATEGORY_LABELS: Record<ClaimFileCategory, string> = {
  invoice: "Factura",
  receipt: "Recibo",
  medical_report: "Informe médico",
  prescription: "Receta",
  id_document: "Documento de identidad",
  other: "Otro",
};
