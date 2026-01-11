import { useCallback, useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type {
  SortingState,
  PaginationState,
  OnChangeFn,
} from "@tanstack/react-table";
import { ACTIVE_LABELS, PORTAL_ACCESS_OPTIONS } from "../shared";
import type { AffiliatesSearch } from "./schema";
import type {
  UseAffiliatesUrlStateReturn,
  AffiliatesFilters,
  UseAffiliatesFiltersReturn,
  ActiveFilter,
  UseAffiliatesTableStateReturn,
} from "./types";

// =============================================================================
// useAffiliatesUrlState
// =============================================================================

/**
 * Manages URL state synchronization with TanStack Router.
 * Provides smart page reset on filter changes.
 */
export function useAffiliatesUrlState(): UseAffiliatesUrlStateReturn {
  const search = useSearch({ from: "/_authenticated/_app/affiliates" });
  const navigate = useNavigate();

  const updateSearch = useCallback(
    (updates: Partial<AffiliatesSearch>) => {
      // Detect if this is a filter change (not pagination/sorting)
      const isFilterChange = Object.keys(updates).some(
        (k) =>
          k !== "page" && k !== "limit" && k !== "sortBy" && k !== "sortOrder"
      );

      void navigate({
        to: "/affiliates",
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
// useAffiliatesFilters
// =============================================================================

/**
 * Manages filter state and active filter chips computation.
 * All handlers are memoized with useCallback.
 */
export function useAffiliatesFilters(
  search: AffiliatesSearch,
  updateSearch: (updates: Partial<AffiliatesSearch>) => void
): UseAffiliatesFiltersReturn {
  // ---------------------------------------------------------------------------
  // Filters Object
  // ---------------------------------------------------------------------------

  const filters = useMemo<AffiliatesFilters>(
    () => ({
      search: search.search,
      clientId: search.clientId,
      isActive: search.isActive,
      hasPortalAccess: search.hasPortalAccess,
    }),
    [search.search, search.clientId, search.isActive, search.hasPortalAccess]
  );

  // ---------------------------------------------------------------------------
  // Filter Update Handlers
  // ---------------------------------------------------------------------------

  const updateFilter = useCallback(
    <K extends keyof AffiliatesFilters>(key: K, value: AffiliatesFilters[K]) => {
      updateSearch({ [key]: value } as Partial<AffiliatesSearch>);
    },
    [updateSearch]
  );

  const clearAllFilters = useCallback(() => {
    // Reset to defaults - isActive defaults to true in the schema
    updateSearch({
      search: undefined,
      clientId: undefined,
      isActive: true,
      hasPortalAccess: undefined,
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
        label: "Búsqueda",
        value: search.search,
        onRemove: () => updateSearch({ search: undefined }),
      });
    }

    // Only show isActive filter chip when set to false (different from default true)
    if (search.isActive === false) {
      result.push({
        key: "isActive",
        label: "Estado",
        value: ACTIVE_LABELS["false"] ?? "Inactivo",
        onRemove: () => updateSearch({ isActive: true }),
      });
    }

    if (search.hasPortalAccess) {
      const label = PORTAL_ACCESS_OPTIONS.find(
        (o) => o.value === search.hasPortalAccess
      )?.label;
      result.push({
        key: "hasPortalAccess",
        label: "Acceso Portal",
        value: label ?? search.hasPortalAccess,
        onRemove: () => updateSearch({ hasPortalAccess: undefined }),
      });
    }

    // Note: clientId filter chip is handled in the component with client name lookup

    return result;
  }, [search.search, search.isActive, search.hasPortalAccess, updateSearch]);

  const hasActiveFilters = activeFilters.length > 0 || !!search.clientId;

  return {
    filters,
    activeFilters,
    hasActiveFilters,
    updateFilter,
    clearAllFilters,
  };
}

// =============================================================================
// useAffiliatesTableState
// =============================================================================

/**
 * Manages sorting and pagination state derived from URL.
 * Converts between URL format and TanStack Table format.
 */
export function useAffiliatesTableState(
  search: AffiliatesSearch,
  updateSearch: (updates: Partial<AffiliatesSearch>) => void
): UseAffiliatesTableStateReturn {
  // ---------------------------------------------------------------------------
  // Sorting
  // ---------------------------------------------------------------------------

  const sorting = useMemo<SortingState>(
    () => [{ id: search.sortBy, desc: search.sortOrder === "desc" }],
    [search.sortBy, search.sortOrder]
  );

  const onSortingChange = useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      const current: SortingState = [
        { id: search.sortBy, desc: search.sortOrder === "desc" },
      ];
      const next = typeof updater === "function" ? updater(current) : updater;

      if (next[0]) {
        updateSearch({
          sortBy: next[0].id as AffiliatesSearch["sortBy"],
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
