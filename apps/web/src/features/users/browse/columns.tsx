import type { UserListItem } from "shared";
import { createColumnHelper, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/formatting";
import {
  ACTIVE_STYLES,
  ACTIVE_LABELS,
  USER_TYPE_STYLES,
  USER_TYPE_LABELS,
  ACCOUNT_STATUS_STYLES,
  ACCOUNT_STATUS_LABELS,
} from "../shared";

const columnHelper = createColumnHelper<UserListItem>();

function getAccountStatus(user: UserListItem): string {
  if (user.hasAccount) return "has_account";
  if (user.hasPendingInvitation) return "pending_invitation";
  return "no_account";
}

export const usersColumns = [
  columnHelper.accessor((row) => `${row.lastName}, ${row.firstName}`, {
    id: "name",
    header: "Nombre",
    cell: (info) => <span className="font-medium text-text">{info.getValue()}</span>,
  }),
  columnHelper.accessor("email", {
    header: "Email",
    enableSorting: true,
    cell: (info) => <span className="text-text-muted">{info.getValue() ?? "-"}</span>,
  }),
  columnHelper.accessor("type", {
    header: "Tipo",
    enableSorting: true,
    cell: (info) => (
      <StatusBadge
        status={info.getValue()}
        styles={USER_TYPE_STYLES}
        labels={USER_TYPE_LABELS}
      />
    ),
  }),
  columnHelper.display({
    id: "accountStatus",
    header: "Cuenta",
    cell: (info) => {
      const status = getAccountStatus(info.row.original);
      return (
        <StatusBadge
          status={status}
          styles={ACCOUNT_STATUS_STYLES}
          labels={ACCOUNT_STATUS_LABELS}
        />
      );
    },
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
