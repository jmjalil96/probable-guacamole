import { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { format } from "date-fns";
import type {
  SortingState,
  PaginationState,
  OnChangeFn,
} from "@tanstack/react-table";
import type { DateRange } from "@/components/ui";
import { formatDate } from "@/lib/formatting";
import { STATUS_LABELS, CARE_TYPE_LABELS } from "../shared";
import type { ClaimsSearch } from "./schema";
import type {
  UseClaimsUrlStateReturn,
  ClaimsFilters,
  UseClaimsFiltersReturn,
  ActiveFilter,
  UseClaimsTableStateReturn,
} from "./types";

// =============================================================================
// useClaimsUrlState
// =============================================================================

/**
 * Manages URL state synchronization with TanStack Router.
 * Provides smart page reset on filter changes.
 */
export function useClaimsUrlState(): UseClaimsUrlStateReturn {
  const search = useSearch({ from: "/_authenticated/_app/claims" });
  const navigate = useNavigate();

  const updateSearch = useCallback(
    (updates: Partial<ClaimsSearch>) => {
      // Detect if this is a filter change (not pagination/sorting)
      const isFilterChange = Object.keys(updates).some(
        (k) =>
          k !== "page" && k !== "limit" && k !== "sortBy" && k !== "sortOrder"
      );

      void navigate({
        to: "/claims",
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

  // Persist view preference to localStorage
  useEffect(() => {
    localStorage.setItem("claims-view", search.view);
  }, [search.view]);

  return {
    search,
    updateSearch,
  };
}

// =============================================================================
// useClaimsFilters
// =============================================================================

/**
 * Manages filter state and active filter chips computation.
 * All handlers are memoized with useCallback.
 */
export function useClaimsFilters(
  search: ClaimsSearch,
  updateSearch: (updates: Partial<ClaimsSearch>) => void
): UseClaimsFiltersReturn {
  // ---------------------------------------------------------------------------
  // Filters Object
  // ---------------------------------------------------------------------------

  const filters = useMemo<ClaimsFilters>(
    () => ({
      search: search.search,
      status: search.status,
      careType: search.careType,
      submittedDateFrom: search.submittedDateFrom,
      submittedDateTo: search.submittedDateTo,
      incidentDateFrom: search.incidentDateFrom,
      incidentDateTo: search.incidentDateTo,
    }),
    [
      search.search,
      search.status,
      search.careType,
      search.submittedDateFrom,
      search.submittedDateTo,
      search.incidentDateFrom,
      search.incidentDateTo,
    ]
  );

  // ---------------------------------------------------------------------------
  // Filter Update Handlers
  // ---------------------------------------------------------------------------

  const updateFilter = useCallback(
    <K extends keyof ClaimsFilters>(key: K, value: ClaimsFilters[K]) => {
      updateSearch({ [key]: value } as Partial<ClaimsSearch>);
    },
    [updateSearch]
  );

  const clearAllFilters = useCallback(() => {
    updateSearch({
      search: undefined,
      status: undefined,
      careType: undefined,
      submittedDateFrom: undefined,
      submittedDateTo: undefined,
      incidentDateFrom: undefined,
      incidentDateTo: undefined,
    });
  }, [updateSearch]);

  const handleSubmittedDateChange = useCallback(
    (range: DateRange) => {
      updateSearch({
        submittedDateFrom: range.from
          ? format(range.from, "yyyy-MM-dd")
          : undefined,
        submittedDateTo: range.to ? format(range.to, "yyyy-MM-dd") : undefined,
      });
    },
    [updateSearch]
  );

  const handleIncidentDateChange = useCallback(
    (range: DateRange) => {
      updateSearch({
        incidentDateFrom: range.from
          ? format(range.from, "yyyy-MM-dd")
          : undefined,
        incidentDateTo: range.to ? format(range.to, "yyyy-MM-dd") : undefined,
      });
    },
    [updateSearch]
  );

  const clearIncidentDate = useCallback(() => {
    updateSearch({ incidentDateFrom: undefined, incidentDateTo: undefined });
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

    if (search.status?.length) {
      result.push({
        key: "status",
        label: "Estado",
        value: search.status.map((s) => STATUS_LABELS[s]).join(", "),
        onRemove: () => updateSearch({ status: undefined }),
      });
    }

    if (search.careType) {
      result.push({
        key: "careType",
        label: "Tipo de Atención",
        value: CARE_TYPE_LABELS[search.careType],
        onRemove: () => updateSearch({ careType: undefined }),
      });
    }

    if (search.submittedDateFrom || search.submittedDateTo) {
      const from = search.submittedDateFrom
        ? formatDate(search.submittedDateFrom)
        : "...";
      const to = search.submittedDateTo
        ? formatDate(search.submittedDateTo)
        : "...";
      result.push({
        key: "submittedDate",
        label: "Enviado",
        value: `${from} - ${to}`,
        onRemove: () =>
          updateSearch({
            submittedDateFrom: undefined,
            submittedDateTo: undefined,
          }),
      });
    }

    if (search.incidentDateFrom || search.incidentDateTo) {
      const from = search.incidentDateFrom
        ? formatDate(search.incidentDateFrom)
        : "...";
      const to = search.incidentDateTo
        ? formatDate(search.incidentDateTo)
        : "...";
      result.push({
        key: "incidentDate",
        label: "Fecha Incidente",
        value: `${from} - ${to}`,
        onRemove: () =>
          updateSearch({
            incidentDateFrom: undefined,
            incidentDateTo: undefined,
          }),
      });
    }

    return result;
  }, [
    search.search,
    search.status,
    search.careType,
    search.submittedDateFrom,
    search.submittedDateTo,
    search.incidentDateFrom,
    search.incidentDateTo,
    updateSearch,
  ]);

  const hasActiveFilters = activeFilters.length > 0;

  return {
    filters,
    activeFilters,
    hasActiveFilters,
    updateFilter,
    clearAllFilters,
    handleSubmittedDateChange,
    handleIncidentDateChange,
    clearIncidentDate,
  };
}

// =============================================================================
// useClaimsTableState
// =============================================================================

/**
 * Manages sorting and pagination state derived from URL.
 * Converts between URL format and TanStack Table format.
 */
export function useClaimsTableState(
  search: ClaimsSearch,
  updateSearch: (updates: Partial<ClaimsSearch>) => void
): UseClaimsTableStateReturn {
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
          sortBy: next[0].id as ClaimsSearch["sortBy"],
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
