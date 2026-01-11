import type { ClientAdminClient } from "shared";
import { createColumnHelper } from "@/components/ui";
import { formatDate } from "@/lib/formatting";

// =============================================================================
// Table Column Definitions
// =============================================================================

const columnHelper = createColumnHelper<ClientAdminClient>();

/**
 * Client table data columns (without actions).
 * Actions column is added in the component where callbacks are available.
 */
export const clientColumns = [
  columnHelper.accessor("clientName", {
    header: "Cliente",
    cell: (info) => (
      <span className="font-medium text-text">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("assignedAt", {
    header: "Fecha de Asignacion",
    cell: (info) => (
      <span className="text-text-muted">{formatDate(info.getValue())}</span>
    ),
  }),
];

/**
 * Column helper for creating additional columns (e.g., actions).
 * Exported for use in components that need to add dynamic columns.
 */
export { columnHelper as clientColumnHelper };
