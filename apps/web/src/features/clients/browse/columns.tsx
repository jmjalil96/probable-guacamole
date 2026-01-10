import type { Client } from "shared";
import { createColumnHelper, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/formatting";
import { ACTIVE_STYLES, ACTIVE_LABELS } from "../shared";

// =============================================================================
// Table Column Definitions
// =============================================================================

const columnHelper = createColumnHelper<Client>();

export const clientsColumns = [
  columnHelper.accessor("name", {
    header: "Nombre",
    cell: (info) => (
      <span className="font-medium text-text">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("isActive", {
    header: "Estado",
    enableSorting: false,
    cell: (info) => (
      <StatusBadge
        status={String(info.getValue())}
        styles={ACTIVE_STYLES}
        labels={ACTIVE_LABELS}
      />
    ),
  }),
  columnHelper.accessor("createdAt", {
    header: "Creado",
    cell: (info) => formatDate(info.getValue()),
  }),
  columnHelper.accessor("updatedAt", {
    header: "Actualizado",
    cell: (info) => formatDate(info.getValue()),
  }),
];
