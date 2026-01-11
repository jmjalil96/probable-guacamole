import { useMemo, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { UserListItem } from "shared";
import { useOpenState } from "@/lib/hooks";
import { useListUsers } from "../api";
import type { UsersSearch } from "./schema";
import type { UseUsersListReturn } from "./types";
import { useUsersUrlState, useUsersFilters, useUsersTableState } from "./state.hooks";

export { useUsersUrlState, useUsersFilters, useUsersTableState } from "./state.hooks";

function buildQuery(search: UsersSearch) {
  return {
    page: search.page,
    limit: search.limit,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
    isActive: search.isActive ?? true,
    ...(search.search && { search: search.search }),
    ...(search.type && { type: search.type }),
    ...(search.hasAccount !== undefined && { hasAccount: search.hasAccount }),
  };
}

export function useUsersList(): UseUsersListReturn {
  const { search, updateSearch } = useUsersUrlState();
  const query = useMemo(() => buildQuery(search), [search]);
  const { data, isLoading, isFetching, isError, refetch } = useListUsers(query);

  const filtersHook = useUsersFilters(search, updateSearch);
  const tableState = useUsersTableState(search, updateSearch);

  // Mobile filter sheet state (like claims pattern)
  const mobileSheet = useOpenState();

  // Navigation - route to appropriate detail view based on user type
  const navigate = useNavigate();

  const navigateToUser = useCallback(
    (user: UserListItem) => {
      switch (user.type) {
        case "employee":
          void navigate({
            to: "/employees/$employeeId",
            params: { employeeId: user.id },
          });
          break;
        case "agent":
          void navigate({
            to: "/agents/$agentId",
            params: { agentId: user.id },
          });
          break;
        case "client_admin":
          void navigate({
            to: "/client-admins/$clientAdminId",
            params: { clientAdminId: user.id },
          });
          break;
        case "affiliate":
          void navigate({
            to: "/affiliates/$affiliateId",
            params: { affiliateId: user.id },
          });
          break;
      }
    },
    [navigate]
  );

  return {
    data: data?.data ?? [],
    total: data?.pagination.total,
    pageCount: data?.pagination.totalPages ?? 1,
    totalRows: data?.pagination.total ?? 0,
    isLoading,
    isFetching,
    isError,
    refetch: () => void refetch(),

    filters: filtersHook.filters,
    activeFilters: filtersHook.activeFilters,
    hasActiveFilters: filtersHook.hasActiveFilters,
    updateFilter: filtersHook.updateFilter,
    clearAllFilters: filtersHook.clearAllFilters,

    sorting: tableState.sorting,
    onSortingChange: tableState.onSortingChange,
    pagination: tableState.pagination,
    onPaginationChange: tableState.onPaginationChange,

    // Mobile sheet
    mobileSheetOpen: mobileSheet.open,
    openMobileSheet: mobileSheet.onOpen,
    closeMobileSheet: mobileSheet.onClose,

    // Navigation
    navigateToUser,
  };
}
