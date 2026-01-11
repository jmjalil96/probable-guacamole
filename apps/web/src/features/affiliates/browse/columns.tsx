import { createColumnHelper, StatusBadge, ExpandToggle } from "@/components/ui";
import { ACTIVE_STYLES, ACTIVE_LABELS, RELATIONSHIP_LABELS } from "../shared";
import type { AffiliateRow } from "./types";

// =============================================================================
// Table Column Definitions
// =============================================================================

const columnHelper = createColumnHelper<AffiliateRow>();

export const affiliatesColumns = [
  // Expand toggle column with dependent count indicator
  columnHelper.display({
    id: "expand",
    header: () => null,
    cell: ({ row }) => {
      if (row.depth > 0) return null;
      const count = row.original.dependentsCount;
      const canExpand = count > 0;
      const isExpanded = row.getIsExpanded();

      return (
        <div className="flex items-center gap-1">
          <ExpandToggle
            isExpanded={isExpanded}
            canExpand={canExpand}
            onToggle={() => row.toggleExpanded()}
          />
          {canExpand && !isExpanded && (
            <span className="text-xs tabular-nums text-text-muted">{count}</span>
          )}
        </div>
      );
    },
    size: 56,
  }),

  // Name column
  columnHelper.accessor((row) => `${row.lastName}, ${row.firstName}`, {
    id: "name",
    header: "Nombre",
    cell: (info) => {
      const isDependent = info.row.depth > 0;
      const relationship = info.row.original.__relationship;

      return (
        <div className={isDependent ? "pl-6" : undefined}>
          <span className="font-medium">{info.getValue()}</span>
          {isDependent && relationship && (
            <span className="ml-2 text-xs text-text-muted">
              ({RELATIONSHIP_LABELS[relationship] ?? relationship})
            </span>
          )}
        </div>
      );
    },
  }),

  columnHelper.accessor("documentNumber", {
    header: "Documento",
    cell: (info) => info.getValue() ?? "—",
  }),

  columnHelper.accessor("email", {
    header: "Email",
    cell: (info) => (info.row.depth > 0 ? "—" : info.getValue() ?? "—"),
  }),

  columnHelper.accessor("phone", {
    header: "Teléfono",
    cell: (info) => (info.row.depth > 0 ? "—" : info.getValue() ?? "—"),
    enableSorting: false,
  }),

  columnHelper.accessor((row) => row.client.name, {
    id: "client",
    header: "Cliente",
    enableSorting: false,
    cell: (info) => (info.row.depth > 0 ? "—" : info.getValue()),
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
];
