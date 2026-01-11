import { useCallback, useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { SortingState, PaginationState, OnChangeFn } from "@tanstack/react-table";
import { ACTIVE_LABELS, USER_TYPE_LABELS, ACCOUNT_STATUS_LABELS } from "../shared";
import type { UsersSearch } from "./schema";
import type {
  UseUsersUrlStateReturn,
  UsersFilters,
  UseUsersFiltersReturn,
  ActiveFilter,
  UseUsersTableStateReturn,
} from "./types";

// =============================================================================
// useUsersUrlState
// =============================================================================

export function useUsersUrlState(): UseUsersUrlStateReturn {
  const search = useSearch({ from: "/_authenticated/_app/users" });
  const navigate = useNavigate();

  const updateSearch = useCallback(
    (updates: Partial<UsersSearch>) => {
      const isFilterChange = Object.keys(updates).some(
        (k) => k !== "page" && k !== "limit" && k !== "sortBy" && k !== "sortOrder"
      );

      void navigate({
        to: "/users",
        search: {
          ...search,
          ...updates,
          ...(isFilterChange && updates.page === undefined ? { page: 1 } : {}),
        },
        replace: true,
      });
    },
    [navigate, search]
  );

  return { search, updateSearch };
}

// =============================================================================
// useUsersFilters
// =============================================================================

export function useUsersFilters(
  search: UsersSearch,
  updateSearch: (updates: Partial<UsersSearch>) => void
): UseUsersFiltersReturn {
  const filters = useMemo<UsersFilters>(
    () => ({
      search: search.search,
      type: search.type,
      isActive: search.isActive,
      hasAccount: search.hasAccount,
    }),
    [search.search, search.type, search.isActive, search.hasAccount]
  );

  const updateFilter = useCallback(
    <K extends keyof UsersFilters>(key: K, value: UsersFilters[K]) => {
      updateSearch({ [key]: value } as Partial<UsersSearch>);
    },
    [updateSearch]
  );

  const clearAllFilters = useCallback(() => {
    updateSearch({
      search: undefined,
      type: undefined,
      isActive: true,
      hasAccount: undefined,
    });
  }, [updateSearch]);

  const activeFilters = useMemo<ActiveFilter[]>(() => {
    const result: ActiveFilter[] = [];

    if (search.search) {
      result.push({
        key: "search",
        label: "Busqueda",
        value: search.search,
        onRemove: () => updateSearch({ search: undefined }),
      });
    }

    if (search.type) {
      result.push({
        key: "type",
        label: "Tipo",
        value: USER_TYPE_LABELS[search.type] ?? search.type,
        onRemove: () => updateSearch({ type: undefined }),
      });
    }

    if (search.isActive === false) {
      result.push({
        key: "isActive",
        label: "Estado",
        value: ACTIVE_LABELS["false"] ?? "Inactivo",
        onRemove: () => updateSearch({ isActive: true }),
      });
    }

    if (search.hasAccount !== undefined) {
      result.push({
        key: "hasAccount",
        label: "Cuenta",
        value: search.hasAccount
          ? (ACCOUNT_STATUS_LABELS.has_account ?? "Con cuenta")
          : (ACCOUNT_STATUS_LABELS.no_account ?? "Sin cuenta"),
        onRemove: () => updateSearch({ hasAccount: undefined }),
      });
    }

    return result;
  }, [search.search, search.type, search.isActive, search.hasAccount, updateSearch]);

  return {
    filters,
    activeFilters,
    hasActiveFilters: activeFilters.length > 0,
    updateFilter,
    clearAllFilters,
  };
}

// =============================================================================
// useUsersTableState
// =============================================================================

export function useUsersTableState(
  search: UsersSearch,
  updateSearch: (updates: Partial<UsersSearch>) => void
): UseUsersTableStateReturn {
  const sorting = useMemo<SortingState>(
    () => [{ id: search.sortBy ?? "name", desc: search.sortOrder === "desc" }],
    [search.sortBy, search.sortOrder]
  );

  const onSortingChange = useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      const current: SortingState = [
        { id: search.sortBy ?? "name", desc: search.sortOrder === "desc" },
      ];
      const next = typeof updater === "function" ? updater(current) : updater;

      if (next[0]) {
        updateSearch({
          sortBy: next[0].id as UsersSearch["sortBy"],
          sortOrder: next[0].desc ? "desc" : "asc",
        });
      }
    },
    [search.sortBy, search.sortOrder, updateSearch]
  );

  const pagination = useMemo<PaginationState>(
    () => ({
      pageIndex: search.page - 1,
      pageSize: search.limit,
    }),
    [search.page, search.limit]
  );

  const onPaginationChange = useCallback<OnChangeFn<PaginationState>>(
    (updater) => {
      const current: PaginationState = {
        pageIndex: search.page - 1,
        pageSize: search.limit,
      };
      const next = typeof updater === "function" ? updater(current) : updater;

      updateSearch({
        page: next.pageIndex + 1,
        limit: next.pageSize,
      });
    },
    [search.page, search.limit, updateSearch]
  );

  return { sorting, onSortingChange, pagination, onPaginationChange };
}
