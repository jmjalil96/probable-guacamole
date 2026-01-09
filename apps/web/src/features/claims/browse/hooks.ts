import { useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { ClaimStatus, ListClaimsResponse } from "shared";
import { useSheetState } from "@/components/ui/overlays/sheet/use-sheet-state";
import { api } from "@/lib/api/client";
import { useListClaims } from "../api";
import { KANBAN_STATUSES } from "../shared";
import type { ClaimsSearch } from "./schema";
import type {
  UseClaimsListReturn,
  KanbanBaseQuery,
  KanbanColumnData,
  UseKanbanColumnsReturn,
  UseClaimsKanbanReturn,
} from "./types";

// Re-export state hooks for public API
export {
  useClaimsUrlState,
  useClaimsFilters,
  useClaimsTableState,
} from "./state.hooks";

// Import internally
import {
  useClaimsUrlState,
  useClaimsFilters,
  useClaimsTableState,
} from "./state.hooks";

// =============================================================================
// Query Builder
// =============================================================================

function buildQuery(search: ClaimsSearch) {
  return {
    page: search.page,
    limit: search.limit,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
    ...(search.search && { search: search.search }),
    ...(search.status?.length && { status: search.status }),
    ...(search.careType && { careType: search.careType }),
    ...(search.submittedDateFrom && {
      submittedDateFrom: search.submittedDateFrom,
    }),
    ...(search.submittedDateTo && { submittedDateTo: search.submittedDateTo }),
    ...(search.incidentDateFrom && {
      incidentDateFrom: search.incidentDateFrom,
    }),
    ...(search.incidentDateTo && { incidentDateTo: search.incidentDateTo }),
  };
}

// =============================================================================
// useClaimsList (Master Orchestration)
// =============================================================================

/**
 * Main orchestration hook for the claims list page.
 * Composes smaller, focused hooks for each concern.
 */
export function useClaimsList(): UseClaimsListReturn {
  // ---------------------------------------------------------------------------
  // 1. URL State (Foundation)
  // ---------------------------------------------------------------------------
  const { search, updateSearch } = useClaimsUrlState();

  // ---------------------------------------------------------------------------
  // 2. Build API Query
  // ---------------------------------------------------------------------------
  const query = useMemo(() => buildQuery(search), [search]);

  // ---------------------------------------------------------------------------
  // 3. Fetch Data
  // ---------------------------------------------------------------------------
  const { data, isLoading, isFetching, isError, refetch } =
    useListClaims(query);

  // ---------------------------------------------------------------------------
  // 4. Compose Domain Hooks
  // ---------------------------------------------------------------------------
  const filtersHook = useClaimsFilters(search, updateSearch);
  const tableState = useClaimsTableState(search, updateSearch);
  const sheets = useSheetState();

  // ---------------------------------------------------------------------------
  // 5. Navigation
  // ---------------------------------------------------------------------------
  const navigate = useNavigate();

  const navigateToNewClaim = useCallback(() => {
    void navigate({ to: "/new-claim" });
  }, [navigate]);

  const navigateToClaim = useCallback(
    (claimId: string) => {
      void navigate({ to: "/claims/$claimId", params: { claimId } });
    },
    [navigate]
  );

  // ---------------------------------------------------------------------------
  // 6. Return Composed Interface
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
    handleSubmittedDateChange: filtersHook.handleSubmittedDateChange,
    handleIncidentDateChange: filtersHook.handleIncidentDateChange,
    clearIncidentDate: filtersHook.clearIncidentDate,

    // Table state
    sorting: tableState.sorting,
    onSortingChange: tableState.onSortingChange,
    pagination: tableState.pagination,
    onPaginationChange: tableState.onPaginationChange,

    // Sheets
    desktopSheetOpen: sheets.desktopOpen,
    mobileSheetOpen: sheets.mobileOpen,
    openDesktopSheet: sheets.openDesktop,
    closeDesktopSheet: sheets.closeDesktop,
    openMobileSheet: sheets.openMobile,
    closeMobileSheet: sheets.closeMobile,

    // Navigation
    navigateToNewClaim,
    navigateToClaim,
  };
}

// =============================================================================
// Kanban Constants & API
// =============================================================================

const ITEMS_PER_PAGE = 20;

async function fetchClaimsByStatus(
  baseQuery: KanbanBaseQuery,
  status: ClaimStatus,
  page: number
): Promise<ListClaimsResponse> {
  const params = new URLSearchParams();

  // Pagination
  params.set("page", String(page));
  params.set("limit", String(ITEMS_PER_PAGE));

  // Fixed for kanban
  params.set("status", status);
  params.set("sortBy", "createdAt");
  params.set("sortOrder", "desc");

  // Pass through filters
  if (baseQuery.search) params.set("search", baseQuery.search);
  if (baseQuery.careType) params.set("careType", baseQuery.careType);
  if (baseQuery.submittedDateFrom)
    params.set("submittedDateFrom", baseQuery.submittedDateFrom);
  if (baseQuery.submittedDateTo)
    params.set("submittedDateTo", baseQuery.submittedDateTo);
  if (baseQuery.incidentDateFrom)
    params.set("incidentDateFrom", baseQuery.incidentDateFrom);
  if (baseQuery.incidentDateTo)
    params.set("incidentDateTo", baseQuery.incidentDateTo);

  const { data } = await api.get<ListClaimsResponse>(
    `/claims?${params.toString()}`
  );
  return data;
}

// =============================================================================
// Single Column Hook
// =============================================================================

function useInfiniteKanbanColumn(
  status: ClaimStatus,
  baseQuery: KanbanBaseQuery
) {
  return useInfiniteQuery({
    queryKey: ["claims", "kanban", status, baseQuery] as const,
    queryFn: ({ pageParam }) =>
      fetchClaimsByStatus(baseQuery, status, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });
}

// =============================================================================
// useKanbanColumns
// =============================================================================

/**
 * Makes parallel requests for each status column in the kanban board.
 * Supports infinite loading via fetchNextPage per column.
 */
export function useKanbanColumns(
  baseQuery: KanbanBaseQuery
): UseKanbanColumnsReturn {
  // Record ensures type-safe lookup and compile-time enforcement that all statuses are covered
  const queryByStatus = {
    DRAFT: useInfiniteKanbanColumn("DRAFT", baseQuery),
    SUBMITTED: useInfiniteKanbanColumn("SUBMITTED", baseQuery),
    IN_REVIEW: useInfiniteKanbanColumn("IN_REVIEW", baseQuery),
    PENDING_INFO: useInfiniteKanbanColumn("PENDING_INFO", baseQuery),
    RETURNED: useInfiniteKanbanColumn("RETURNED", baseQuery),
    SETTLED: useInfiniteKanbanColumn("SETTLED", baseQuery),
    CANCELLED: useInfiniteKanbanColumn("CANCELLED", baseQuery),
  } satisfies Record<ClaimStatus, ReturnType<typeof useInfiniteKanbanColumn>>;

  const columns: KanbanColumnData[] = KANBAN_STATUSES.map((status) => {
    const query = queryByStatus[status];
    const allData = query.data?.pages.flatMap((p) => p.data) ?? [];
    const total = query.data?.pages[0]?.pagination.total ?? 0;

    return {
      status,
      data: allData,
      total,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      isFetchingNextPage: query.isFetchingNextPage,
      isError: query.isError,
      hasMore: query.hasNextPage ?? false,
      fetchNextPage: () => void query.fetchNextPage(),
    };
  });

  const queries = Object.values(queryByStatus);
  const isLoading = queries.some((q) => q.isLoading);
  const isFetching = queries.some((q) => q.isFetching);
  const isError = queries.some((q) => q.isError);

  const refetch = () => {
    queries.forEach((q) => void q.refetch());
  };

  return {
    columns,
    isLoading,
    isFetching,
    isError,
    refetch,
  };
}

// =============================================================================
// useClaimsKanban (Master Orchestration)
// =============================================================================

/**
 * Main orchestrator hook for the claims kanban view.
 * Composes URL state, filters, and parallel column queries.
 */
export function useClaimsKanban(): UseClaimsKanbanReturn {
  const { search, updateSearch } = useClaimsUrlState();
  const navigate = useNavigate();

  // Build base query (without status - that's per-column)
  const baseQuery = useMemo<KanbanBaseQuery>(
    () => ({
      search: search.search,
      careType: search.careType,
      submittedDateFrom: search.submittedDateFrom,
      submittedDateTo: search.submittedDateTo,
      incidentDateFrom: search.incidentDateFrom,
      incidentDateTo: search.incidentDateTo,
    }),
    [
      search.search,
      search.careType,
      search.submittedDateFrom,
      search.submittedDateTo,
      search.incidentDateFrom,
      search.incidentDateTo,
    ]
  );

  // Parallel column queries
  const { columns, isLoading, isFetching, isError, refetch } =
    useKanbanColumns(baseQuery);

  // Filters (reuse from browse state)
  const filtersHook = useClaimsFilters(search, updateSearch);

  // Sheet state for "More Filters"
  const sheets = useSheetState();

  // Navigation handlers
  const navigateToClaim = useCallback(
    (claimId: string) => {
      void navigate({ to: "/claims/$claimId", params: { claimId } });
    },
    [navigate]
  );

  const navigateToNewClaim = useCallback(() => {
    void navigate({ to: "/new-claim" });
  }, [navigate]);

  // Total across all columns
  const total = useMemo(
    () => columns.reduce((sum, col) => sum + col.total, 0),
    [columns]
  );

  return {
    // Columns
    columns,
    total,

    // Loading States
    isLoading,
    isFetching,
    isError,
    refetch,

    // Filters
    filters: filtersHook.filters,
    activeFilters: filtersHook.activeFilters,
    hasActiveFilters: filtersHook.hasActiveFilters,
    updateFilter: filtersHook.updateFilter,
    clearAllFilters: filtersHook.clearAllFilters,
    handleSubmittedDateChange: filtersHook.handleSubmittedDateChange,
    handleIncidentDateChange: filtersHook.handleIncidentDateChange,
    clearIncidentDate: filtersHook.clearIncidentDate,

    // Sheets
    desktopSheetOpen: sheets.desktopOpen,
    mobileSheetOpen: sheets.mobileOpen,
    openDesktopSheet: sheets.openDesktop,
    closeDesktopSheet: sheets.closeDesktop,
    openMobileSheet: sheets.openMobile,
    closeMobileSheet: sheets.closeMobile,

    // Navigation
    navigateToClaim,
    navigateToNewClaim,
  };
}
