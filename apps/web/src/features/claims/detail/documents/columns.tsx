import {
  File,
  FileText,
  FileSpreadsheet,
  Image,
  type LucideIcon,
} from "lucide-react";
import type { ClaimFile, ClaimFileCategory } from "shared";
import { createColumnHelper } from "@/components/ui";
import {
  formatDate,
  formatFileSize,
  getFileIconType,
  type FileIconType,
} from "@/lib/formatting";

// =============================================================================
// Constants
// =============================================================================

const FILE_ICONS: Record<FileIconType, LucideIcon> = {
  image: Image,
  spreadsheet: FileSpreadsheet,
  document: FileText,
  file: File,
};

// Category display configuration
const CATEGORY_DISPLAY: Record<
  ClaimFileCategory,
  { label: string; bgColor: string; textColor: string }
> = {
  invoice: {
    label: "Factura",
    bgColor: "rgba(249, 168, 37, 0.15)",
    textColor: "#f9a825",
  },
  receipt: {
    label: "Recibo",
    bgColor: "rgba(67, 160, 71, 0.15)",
    textColor: "#43a047",
  },
  medical_report: {
    label: "Informe médico",
    bgColor: "rgba(8, 53, 160, 0.15)",
    textColor: "#0835a0",
  },
  prescription: {
    label: "Receta",
    bgColor: "rgba(142, 36, 170, 0.15)",
    textColor: "#8e24aa",
  },
  id_document: {
    label: "Documento",
    bgColor: "rgba(13, 148, 136, 0.15)",
    textColor: "#0d9488",
  },
  other: {
    label: "Otro",
    bgColor: "rgba(107, 114, 128, 0.15)",
    textColor: "#6b7280",
  },
};

// Content type derived display (fallback when no category)
const CONTENT_TYPE_DISPLAY: Record<
  FileIconType,
  { label: string; bgColor: string; textColor: string }
> = {
  image: {
    label: "Foto",
    bgColor: "rgba(67, 160, 71, 0.15)",
    textColor: "#43a047",
  },
  spreadsheet: {
    label: "Excel",
    bgColor: "rgba(67, 160, 71, 0.15)",
    textColor: "#43a047",
  },
  document: {
    label: "PDF",
    bgColor: "rgba(229, 57, 53, 0.15)",
    textColor: "#e53935",
  },
  file: {
    label: "Archivo",
    bgColor: "rgba(107, 114, 128, 0.15)",
    textColor: "#6b7280",
  },
};

// Status display configuration
const STATUS_DISPLAY: Record<
  string,
  { label: string; variant: "success" | "warning" | "error" }
> = {
  READY: { label: "Verificado", variant: "success" },
  PENDING: { label: "Pendiente", variant: "warning" },
  FAILED: { label: "Error", variant: "error" },
};

// =============================================================================
// Helpers
// =============================================================================

function getTypeDisplay(file: ClaimFile): {
  label: string;
  bgColor: string;
  textColor: string;
} {
  // If category is set, use category display
  if (file.category && CATEGORY_DISPLAY[file.category as ClaimFileCategory]) {
    return CATEGORY_DISPLAY[file.category as ClaimFileCategory];
  }
  // Otherwise derive from content type
  const iconType = getFileIconType(file.contentType);
  return CONTENT_TYPE_DISPLAY[iconType];
}

function getIconColor(file: ClaimFile): string {
  const display = getTypeDisplay(file);
  return display.textColor;
}

function getIconBgColor(file: ClaimFile): string {
  const display = getTypeDisplay(file);
  return display.bgColor;
}

// =============================================================================
// Table Column Definitions
// =============================================================================

const columnHelper = createColumnHelper<ClaimFile>();

/**
 * Document table data columns (without actions).
 * Actions column is added in the component where callbacks are available.
 */
export const documentColumns = [
  // Document cell: icon + filename + uploader
  columnHelper.accessor("fileName", {
    header: "Documento",
    cell: (info) => {
      const file = info.row.original;
      const iconType = getFileIconType(file.contentType);
      const Icon = FILE_ICONS[iconType];
      const iconColor = getIconColor(file);
      const iconBgColor = getIconBgColor(file);

      return (
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: iconBgColor, color: iconColor }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-text">
              {info.getValue()}
            </div>
            <div className="text-xs text-text-muted">
              por {file.createdBy.name}
            </div>
          </div>
        </div>
      );
    },
  }),

  // Type/Category badge
  columnHelper.display({
    id: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const display = getTypeDisplay(row.original);
      return (
        <span
          className="inline-flex rounded-md px-2.5 py-1 text-xs font-medium"
          style={{ backgroundColor: display.bgColor, color: display.textColor }}
        >
          {display.label}
        </span>
      );
    },
  }),

  // Date
  columnHelper.accessor("createdAt", {
    header: "Fecha",
    cell: (info) => (
      <span className="text-text-muted">{formatDate(info.getValue())}</span>
    ),
  }),

  // Size
  columnHelper.accessor("fileSize", {
    header: "Tamaño",
    cell: (info) => (
      <span className="text-text-muted">{formatFileSize(info.getValue())}</span>
    ),
  }),

  // Status
  columnHelper.accessor("status", {
    header: "Estado",
    cell: (info) => {
      const status = info.getValue();
      const defaultDisplay = {
        label: "Pendiente",
        variant: "warning" as const,
      };
      const display = STATUS_DISPLAY[status] ?? defaultDisplay;
      const variantStyles = {
        success: "bg-success-light text-success-text",
        warning: "bg-warning-light text-warning-text",
        error: "bg-alert-light text-alert",
      };
      return (
        <span
          className={`inline-flex rounded-xl px-2.5 py-1 text-xs font-semibold ${variantStyles[display.variant]}`}
        >
          {display.label}
        </span>
      );
    },
  }),
];

/**
 * Column helper for creating additional columns (e.g., actions).
 * Exported for use in components that need to add dynamic columns.
 */
export { columnHelper as documentColumnHelper };
