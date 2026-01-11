import type { ReactNode } from "react";
import type {
  SortingState,
  PaginationState,
  OnChangeFn,
  ExpandedState,
} from "@tanstack/react-table";
import { DataTable, Spinner } from "@/components/ui";
import {
  AffiliatesErrorState,
  AffiliatesFetchingOverlay,
} from "../shared";
import type { AffiliateRow } from "./types";
import { affiliatesColumns } from "./columns";
import { useAffiliatesList } from "./hooks";
import {
  AffiliatesFilterChips,
  AffiliatesFiltersInline,
  AffiliatesFiltersSheet,
  AffiliatesListHeader,
  type FilterState,
  type FilterHandlers,
  type SheetState,
} from "./filters.components";

// Re-export filter types and components for public API
export {
  AffiliatesFilterChips,
  AffiliatesFiltersInline,
  AffiliatesFiltersSheet,
  AffiliatesListHeader,
  type FilterState,
  type FilterHandlers,
  type SheetState,
  type AffiliatesFilterChipsProps,
  type AffiliatesFiltersInlineProps,
  type AffiliatesFiltersSheetProps,
  type AffiliatesListHeaderProps,
} from "./filters.components";

// =============================================================================
// AffiliatesViewLayout
// =============================================================================

export interface AffiliatesViewLayoutProps {
  // Header
  total: number | undefined;
  // Grouped props
  filterState: FilterState;
  filterHandlers: FilterHandlers;
  sheetState: SheetState;
  // Content
  children: ReactNode;
}

export function AffiliatesViewLayout({
  total,
  filterState,
  filterHandlers,
  sheetState,
  children,
}: AffiliatesViewLayoutProps) {
  const { filters, activeFilters, hasActiveFilters } = filterState;
  const { updateFilter, clearAllFilters } = filterHandlers;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AffiliatesListHeader total={total} />

      <AffiliatesFiltersInline
        search={filters.search}
        isActive={filters.isActive}
        hasPortalAccess={filters.hasPortalAccess}
        onSearchChange={(v) => updateFilter("search", v)}
        onIsActiveChange={(v) => updateFilter("isActive", v)}
        onHasPortalAccessChange={(v) => updateFilter("hasPortalAccess", v)}
        onOpenMobileFilters={sheetState.mobile.onOpen}
        onOpenDesktopFilters={sheetState.desktop.onOpen}
        onClearAll={clearAllFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <AffiliatesFilterChips filters={activeFilters} />

      {children}

      <AffiliatesFiltersSheet
        open={sheetState.mobile.open}
        onClose={sheetState.mobile.onClose}
        isActive={filters.isActive}
        hasPortalAccess={filters.hasPortalAccess}
        onIsActiveChange={(v) => updateFilter("isActive", v)}
        onHasPortalAccessChange={(v) => updateFilter("hasPortalAccess", v)}
        onClearAll={clearAllFilters}
      />
    </div>
  );
}

// =============================================================================
// AffiliatesTable
// =============================================================================

export interface AffiliatesTableProps {
  data: AffiliateRow[];
  columns: typeof affiliatesColumns;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRefetch: () => void;
  // Sorting
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  // Pagination
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  pageCount: number;
  totalRows: number;
  // Expansion
  expanded: ExpandedState;
  onExpandedChange: OnChangeFn<ExpandedState>;
  // Navigation
  onRowClick: (id: string) => void;
}

export function AffiliatesTable({
  data,
  columns,
  isLoading,
  isFetching,
  isError,
  onRefetch,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
  pageCount,
  totalRows,
  expanded,
  onExpandedChange,
  onRowClick,
}: AffiliatesTableProps) {
  if (isError) {
    return <AffiliatesErrorState onRetry={onRefetch} />;
  }

  return (
    <div className="flex-1 min-h-0 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      {isLoading ? (
        <div className="h-full rounded-2xl border border-border bg-white shadow-sm flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="relative h-full">
          {isFetching && <AffiliatesFetchingOverlay />}
          <DataTable
            className="h-full rounded-2xl border border-border bg-white shadow-sm"
            data={data}
            columns={columns}
            getRowId={(row) =>
              row.__isDependent && row.__parentId
                ? `${row.__parentId}:${row.id}`
                : row.id
            }
            sorting={sorting}
            onSortingChange={onSortingChange}
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
            totalRows={totalRows}
            expanded={expanded}
            onExpandedChange={onExpandedChange}
            onRowClick={(row) => onRowClick(row.id)}
            enableSorting
            enablePagination
            itemName="afiliados"
            emptyState="No se encontraron afiliados."
          />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// AffiliatesListView (Entry Point)
// =============================================================================

export function AffiliatesListView() {
  const list = useAffiliatesList();

  return (
    <AffiliatesViewLayout
      total={list.total}
      filterState={{
        filters: list.filters,
        activeFilters: list.activeFilters,
        hasActiveFilters: list.hasActiveFilters,
      }}
      filterHandlers={{
        updateFilter: list.updateFilter,
        clearAllFilters: list.clearAllFilters,
      }}
      sheetState={{
        desktop: {
          open: list.desktopSheetOpen,
          onOpen: list.openDesktopSheet,
          onClose: list.closeDesktopSheet,
        },
        mobile: {
          open: list.mobileSheetOpen,
          onOpen: list.openMobileSheet,
          onClose: list.closeMobileSheet,
        },
      }}
    >
      <AffiliatesTable
        data={list.data}
        columns={affiliatesColumns}
        isLoading={list.isLoading}
        isFetching={list.isFetching}
        isError={list.isError}
        onRefetch={list.refetch}
        sorting={list.sorting}
        onSortingChange={list.onSortingChange}
        pagination={list.pagination}
        onPaginationChange={list.onPaginationChange}
        pageCount={list.pageCount}
        totalRows={list.totalRows}
        expanded={list.expanded}
        onExpandedChange={list.onExpandedChange}
        onRowClick={list.navigateToAffiliate}
      />
    </AffiliatesViewLayout>
  );
}
