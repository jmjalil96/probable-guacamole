import { useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useOpenState } from "@/lib/hooks";
import { useListClients } from "../api";
import type { ClientsSearch } from "./schema";
import type { UseClientsListReturn } from "./types";

// Re-export state hooks for public API
export {
  useClientsUrlState,
  useClientsFilters,
  useClientsTableState,
} from "./state.hooks";

// Import internally
import {
  useClientsUrlState,
  useClientsFilters,
  useClientsTableState,
} from "./state.hooks";

// =============================================================================
// Query Builder
// =============================================================================

function buildQuery(search: ClientsSearch) {
  return {
    page: search.page,
    limit: search.limit,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
    isActive: search.isActive ?? true,
    ...(search.search && { search: search.search }),
  };
}

// =============================================================================
// useClientsList (Master Orchestration)
// =============================================================================

/**
 * Main orchestration hook for the clients list page.
 * Composes smaller, focused hooks for each concern.
 */
export function useClientsList(): UseClientsListReturn {
  // ---------------------------------------------------------------------------
  // 1. URL State (Foundation)
  // ---------------------------------------------------------------------------
  const { search, updateSearch } = useClientsUrlState();

  // ---------------------------------------------------------------------------
  // 2. Build API Query
  // ---------------------------------------------------------------------------
  const query = useMemo(() => buildQuery(search), [search]);

  // ---------------------------------------------------------------------------
  // 3. Fetch Data
  // ---------------------------------------------------------------------------
  const { data, isLoading, isFetching, isError, refetch } =
    useListClients(query);

  // ---------------------------------------------------------------------------
  // 4. Compose Domain Hooks
  // ---------------------------------------------------------------------------
  const filtersHook = useClientsFilters(search, updateSearch);
  const tableState = useClientsTableState(search, updateSearch);

  // ---------------------------------------------------------------------------
  // 5. Create Modal State
  // ---------------------------------------------------------------------------
  const createModalState = useOpenState();

  // ---------------------------------------------------------------------------
  // 6. Navigation
  // ---------------------------------------------------------------------------
  const navigate = useNavigate();

  const navigateToClient = useCallback(
    (clientId: string) => {
      void navigate({ to: "/clients/$clientId", params: { clientId } });
    },
    [navigate]
  );

  // ---------------------------------------------------------------------------
  // 7. Return Composed Interface
  // ---------------------------------------------------------------------------
  return {
    // Data
    data: data?.data ?? [],
    total: data?.pagination.total,
    pageCount: data?.pagination.totalPages ?? 1,
    totalRows: data?.pagination.total ?? 0,
    isLoading,
    isFetching,
    isError,
    refetch: () => void refetch(),

    // Filters
    filters: filtersHook.filters,
    activeFilters: filtersHook.activeFilters,
    hasActiveFilters: filtersHook.hasActiveFilters,
    updateFilter: filtersHook.updateFilter,
    clearAllFilters: filtersHook.clearAllFilters,

    // Table state
    sorting: tableState.sorting,
    onSortingChange: tableState.onSortingChange,
    pagination: tableState.pagination,
    onPaginationChange: tableState.onPaginationChange,

    // Create modal
    createModalState,

    // Navigation
    navigateToClient,
  };
}
