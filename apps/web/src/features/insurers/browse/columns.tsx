import type { Insurer } from "shared";
import { createColumnHelper, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/formatting";
import { TYPE_STYLES, TYPE_LABELS, ACTIVE_STYLES, ACTIVE_LABELS } from "../shared";

// =============================================================================
// Table Column Definitions
// =============================================================================

const columnHelper = createColumnHelper<Insurer>();

export const insurersColumns = [
  columnHelper.accessor("name", {
    header: "Nombre",
    cell: (info) => (
      <span className="font-medium text-text">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("code", {
    header: "Codigo",
    cell: (info) => (
      <span className="font-mono text-sm">{info.getValue() ?? "—"}</span>
    ),
  }),
  columnHelper.accessor("type", {
    header: "Tipo",
    cell: (info) => (
      <StatusBadge
        status={info.getValue()}
        styles={TYPE_STYLES}
        labels={TYPE_LABELS}
      />
    ),
  }),
  columnHelper.accessor("email", {
    header: "Email",
    enableSorting: false,
    cell: (info) => info.getValue() ?? "—",
  }),
  columnHelper.accessor("phone", {
    header: "Telefono",
    enableSorting: false,
    cell: (info) => info.getValue() ?? "—",
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
];
