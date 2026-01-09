import type { ClaimListItem } from "shared";
import { createColumnHelper, StatusBadge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { STATUS_STYLES, STATUS_LABELS } from "../shared";

// =============================================================================
// Table Column Definitions
// =============================================================================

const columnHelper = createColumnHelper<ClaimListItem>();

export const claimsColumns = [
  columnHelper.accessor("claimNumber", {
    header: "Nro. Reclamo",
    cell: (info) => (
      <span className="font-mono text-sm">#{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Estado",
    cell: (info) => (
      <StatusBadge
        status={info.getValue()}
        styles={STATUS_STYLES}
        labels={STATUS_LABELS}
      />
    ),
  }),
  columnHelper.accessor((row) => row.client?.name, {
    id: "client",
    header: "Cliente",
    enableSorting: false,
  }),
  columnHelper.accessor((row) => row.affiliate?.name, {
    id: "affiliate",
    header: "Afiliado",
    enableSorting: false,
  }),
  columnHelper.accessor((row) => row.patient?.name, {
    id: "patient",
    header: "Paciente",
    enableSorting: false,
  }),
  columnHelper.accessor("incidentDate", {
    header: "Fecha Incidente",
    cell: (info) => formatDate(info.getValue()),
  }),
  columnHelper.accessor("submittedDate", {
    header: "Fecha Envío",
    cell: (info) => formatDate(info.getValue()),
  }),
  columnHelper.accessor("amountSubmitted", {
    header: "Monto Enviado",
    cell: (info) => (
      <span className="tabular-nums">{formatCurrency(info.getValue())}</span>
    ),
  }),
  columnHelper.accessor("amountApproved", {
    header: "Monto Aprobado",
    cell: (info) => (
      <span className="tabular-nums">{formatCurrency(info.getValue())}</span>
    ),
  }),
];
