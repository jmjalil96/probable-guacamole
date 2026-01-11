import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { ExpandedState, OnChangeFn } from "@tanstack/react-table";
import { useSheetState } from "@/components/ui/overlays/sheet/use-sheet-state";
import { useListAffiliates } from "../api";
import type { AffiliatesSearch } from "./schema";
import type { AffiliateRow, UseAffiliatesListReturn } from "./types";

// Re-export state hooks for public API
export {
  useAffiliatesUrlState,
  useAffiliatesFilters,
  useAffiliatesTableState,
} from "./state.hooks";

// Import internally
import {
  useAffiliatesUrlState,
  useAffiliatesFilters,
  useAffiliatesTableState,
} from "./state.hooks";

// =============================================================================
// Query Builder
// =============================================================================

function buildQuery(search: AffiliatesSearch) {
  return {
    page: search.page,
    limit: search.limit,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
    isActive: search.isActive ?? true, // Always provide, default to true
    ...(search.search && { search: search.search }),
    ...(search.clientId && { clientId: search.clientId }),
    ...(search.hasPortalAccess && { hasPortalAccess: search.hasPortalAccess }),
  };
}

// =============================================================================
// useAffiliatesList (Master Orchestration)
// =============================================================================

/**
 * Main orchestration hook for the affiliates list page.
 * Composes smaller, focused hooks for each concern.
 */
export function useAffiliatesList(): UseAffiliatesListReturn {
  // ---------------------------------------------------------------------------
  // 1. URL State (Foundation)
  // ---------------------------------------------------------------------------
  const { search, updateSearch } = useAffiliatesUrlState();

  // ---------------------------------------------------------------------------
  // 2. Build API Query
  // ---------------------------------------------------------------------------
  const query = useMemo(() => buildQuery(search), [search]);

  // ---------------------------------------------------------------------------
  // 3. Fetch Data
  // ---------------------------------------------------------------------------
  const { data, isLoading, isFetching, isError, refetch } =
    useListAffiliates(query);

  const rows = useMemo<AffiliateRow[]>(() => {
    if (!data?.data) return [];

    return data.data.map((affiliate) => {
      const subRows: AffiliateRow[] = affiliate.dependents.map((dependent) => ({
        ...affiliate,
        id: dependent.id,
        firstName: dependent.firstName,
        lastName: dependent.lastName,
        documentType: dependent.documentType,
        documentNumber: dependent.documentNumber,
        email: null,
        phone: null,
        dateOfBirth: null,
        gender: null,
        maritalStatus: null,
        isActive: dependent.isActive,
        hasPortalAccess: false,
        portalInvitationPending: false,
        dependentsCount: 0,
        dependents: [],
        __isDependent: true,
        __relationship: dependent.relationship,
        __parentId: affiliate.id,
      }));

      return {
        ...affiliate,
        __isDependent: false,
        subRows,
      };
    });
  }, [data]);

  // ---------------------------------------------------------------------------
  // 4. Compose Domain Hooks
  // ---------------------------------------------------------------------------
  const filtersHook = useAffiliatesFilters(search, updateSearch);
  const tableState = useAffiliatesTableState(search, updateSearch);
  const sheets = useSheetState();

  // ---------------------------------------------------------------------------
  // 5. Expansion State (Local, not in URL)
  // ---------------------------------------------------------------------------
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const onExpandedChange = useCallback<OnChangeFn<ExpandedState>>(
    (updater) => {
      setExpanded((prev) =>
        typeof updater === "function" ? updater(prev) : updater
      );
    },
    []
  );

  // ---------------------------------------------------------------------------
  // 6. Navigation
  // ---------------------------------------------------------------------------
  const navigate = useNavigate();

  const navigateToAffiliate = useCallback(
    (affiliateId: string) => {
      void navigate({ to: "/affiliates/$affiliateId", params: { affiliateId } });
    },
    [navigate]
  );

  // ---------------------------------------------------------------------------
  // 7. Return Composed Interface
  // ---------------------------------------------------------------------------
  return {
    // Data
    data: rows,
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

    // Expansion state
    expanded,
    onExpandedChange,

    // Sheets
    desktopSheetOpen: sheets.desktopOpen,
    mobileSheetOpen: sheets.mobileOpen,
    openDesktopSheet: sheets.openDesktop,
    closeDesktopSheet: sheets.closeDesktop,
    openMobileSheet: sheets.openMobile,
    closeMobileSheet: sheets.closeMobile,

    // Navigation
    navigateToAffiliate,
  };
}
