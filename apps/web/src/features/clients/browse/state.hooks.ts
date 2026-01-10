import { useCallback, useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type {
  SortingState,
  PaginationState,
  OnChangeFn,
} from "@tanstack/react-table";
import { ACTIVE_LABELS } from "../shared";
import type { ClientsSearch } from "./schema";
import type {
  UseClientsUrlStateReturn,
  ClientsFilters,
  UseClientsFiltersReturn,
  ActiveFilter,
  UseClientsTableStateReturn,
} from "./types";

// =============================================================================
// useClientsUrlState
// =============================================================================

/**
 * Manages URL state synchronization with TanStack Router.
 * Provides smart page reset on filter changes.
 */
export function useClientsUrlState(): UseClientsUrlStateReturn {
  const search = useSearch({ from: "/_authenticated/_app/clients" });
  const navigate = useNavigate();

  const updateSearch = useCallback(
    (updates: Partial<ClientsSearch>) => {
      // Detect if this is a filter change (not pagination/sorting)
      const isFilterChange = Object.keys(updates).some(
        (k) =>
          k !== "page" && k !== "limit" && k !== "sortBy" && k !== "sortOrder"
      );

      void navigate({
        to: "/clients",
        search: {
          ...search,
          ...updates,
          // Reset page to 1 when filters change (unless page is explicitly set)
          ...(isFilterChange && updates.page === undefined ? { page: 1 } : {}),
        },
        replace: true,
      });
    },
    [navigate, search]
  );

  return {
    search,
    updateSearch,
  };
}

// =============================================================================
// useClientsFilters
// =============================================================================

/**
 * Manages filter state and active filter chips computation.
 * All handlers are memoized with useCallback.
 */
export function useClientsFilters(
  search: ClientsSearch,
  updateSearch: (updates: Partial<ClientsSearch>) => void
): UseClientsFiltersReturn {
  // ---------------------------------------------------------------------------
  // Filters Object
  // ---------------------------------------------------------------------------

  const filters = useMemo<ClientsFilters>(
    () => ({
      search: search.search,
      isActive: search.isActive,
    }),
    [search.search, search.isActive]
  );

  // ---------------------------------------------------------------------------
  // Filter Update Handlers
  // ---------------------------------------------------------------------------

  const updateFilter = useCallback(
    <K extends keyof ClientsFilters>(key: K, value: ClientsFilters[K]) => {
      updateSearch({ [key]: value } as Partial<ClientsSearch>);
    },
    [updateSearch]
  );

  const clearAllFilters = useCallback(() => {
    updateSearch({
      search: undefined,
      isActive: true, // Reset to default (show active)
    });
  }, [updateSearch]);

  // ---------------------------------------------------------------------------
  // Active Filters (Memoized)
  // ---------------------------------------------------------------------------

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

    // Only show isActive chip if explicitly false (showing inactive)
    if (search.isActive === false) {
      result.push({
        key: "isActive",
        label: "Estado",
        value: ACTIVE_LABELS["false"] ?? "Inactivo",
        onRemove: () => updateSearch({ isActive: true }),
      });
    }

    return result;
  }, [search.search, search.isActive, updateSearch]);

  const hasActiveFilters = activeFilters.length > 0;

  return {
    filters,
    activeFilters,
    hasActiveFilters,
    updateFilter,
    clearAllFilters,
  };
}

// =============================================================================
// useClientsTableState
// =============================================================================

/**
 * Manages sorting and pagination state derived from URL.
 * Converts between URL format and TanStack Table format.
 */
export function useClientsTableState(
  search: ClientsSearch,
  updateSearch: (updates: Partial<ClientsSearch>) => void
): UseClientsTableStateReturn {
  // ---------------------------------------------------------------------------
  // Sorting
  // ---------------------------------------------------------------------------

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
          sortBy: next[0].id as ClientsSearch["sortBy"],
          sortOrder: next[0].desc ? "desc" : "asc",
        });
      }
    },
    [search.sortBy, search.sortOrder, updateSearch]
  );

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------

  const pagination = useMemo<PaginationState>(
    () => ({
      pageIndex: search.page - 1, // TanStack Table uses 0-based index
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
        page: next.pageIndex + 1, // Convert back to 1-based
        limit: next.pageSize,
      });
    },
    [search.page, search.limit, updateSearch]
  );

  return {
    sorting,
    onSortingChange,
    pagination,
    onPaginationChange,
  };
}
