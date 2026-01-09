import type { ClaimInvoice } from "shared";
import { createColumnHelper } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/formatting";

// =============================================================================
// Table Column Definitions
// =============================================================================

const columnHelper = createColumnHelper<ClaimInvoice>();

/**
 * Invoice table data columns (without actions).
 * Actions column is added in the component where callbacks are available.
 */
export const invoiceColumns = [
  columnHelper.accessor("invoiceNumber", {
    header: "Nro. Factura",
    cell: (info) => (
      <span className="font-mono text-sm font-medium text-primary">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("providerName", {
    header: "Proveedor",
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor("amountSubmitted", {
    header: "Monto",
    cell: (info) => (
      <span className="font-mono font-semibold">
        {formatCurrency(info.getValue())}
      </span>
    ),
  }),
  columnHelper.accessor("createdBy", {
    header: "Creado Por",
    cell: (info) => (
      <span className="text-text-muted">{info.getValue().name}</span>
    ),
  }),
  columnHelper.accessor("createdAt", {
    header: "Fecha",
    cell: (info) => (
      <span className="text-text-muted">{formatDate(info.getValue())}</span>
    ),
  }),
];

/**
 * Column helper for creating additional columns (e.g., actions).
 * Exported for use in components that need to add dynamic columns.
 */
export { columnHelper as invoiceColumnHelper };
