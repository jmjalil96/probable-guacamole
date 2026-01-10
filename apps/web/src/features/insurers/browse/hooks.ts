import { useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useOpenState } from "@/lib/hooks";
import { useListInsurers } from "../api";
import type { InsurersSearch } from "./schema";
import type { UseInsurersListReturn } from "./types";

// Re-export state hooks for public API
export {
  useInsurersUrlState,
  useInsurersFilters,
  useInsurersTableState,
} from "./state.hooks";

// Import internally
import {
  useInsurersUrlState,
  useInsurersFilters,
  useInsurersTableState,
} from "./state.hooks";

// =============================================================================
// Query Builder
// =============================================================================

function buildQuery(search: InsurersSearch) {
  return {
    page: search.page,
    limit: search.limit,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
    isActive: search.isActive ?? true,
    ...(search.search && { search: search.search }),
    ...(search.type && { type: search.type }),
  };
}

// =============================================================================
// useInsurersList (Master Orchestration)
// =============================================================================

/**
 * Main orchestration hook for the insurers list page.
 * Composes smaller, focused hooks for each concern.
 */
export function useInsurersList(): UseInsurersListReturn {
  // ---------------------------------------------------------------------------
  // 1. URL State (Foundation)
  // ---------------------------------------------------------------------------
  const { search, updateSearch } = useInsurersUrlState();

  // ---------------------------------------------------------------------------
  // 2. Build API Query
  // ---------------------------------------------------------------------------
  const query = useMemo(() => buildQuery(search), [search]);

  // ---------------------------------------------------------------------------
  // 3. Fetch Data
  // ---------------------------------------------------------------------------
  const { data, isLoading, isFetching, isError, refetch } =
    useListInsurers(query);

  // ---------------------------------------------------------------------------
  // 4. Compose Domain Hooks
  // ---------------------------------------------------------------------------
  const filtersHook = useInsurersFilters(search, updateSearch);
  const tableState = useInsurersTableState(search, updateSearch);

  // ---------------------------------------------------------------------------
  // 5. Create Modal State
  // ---------------------------------------------------------------------------
  const createModalState = useOpenState();

  // ---------------------------------------------------------------------------
  // 6. Navigation
  // ---------------------------------------------------------------------------
  const navigate = useNavigate();

  const navigateToInsurer = useCallback(
    (insurerId: string) => {
      void navigate({ to: "/insurers/$insurerId", params: { insurerId } });
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
    navigateToInsurer,
  };
}
