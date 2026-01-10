import type { Insurer } from "shared";
import type {
  SortingState,
  PaginationState,
  OnChangeFn,
} from "@tanstack/react-table";
import { DataTable, Spinner } from "@/components/ui";
import { InsurersErrorState, InsurersFetchingOverlay } from "../shared";
import { insurersColumns } from "./columns";
import { useInsurersList } from "./hooks";
import {
  InsurersFilterChips,
  InsurersFiltersInline,
  InsurersListHeader,
} from "./filters.components";
import { InsurerCreateModal } from "../detail/insurer-edit.components";

// Re-export filter types and components for public API
export {
  InsurersFilterChips,
  InsurersFiltersInline,
  InsurersListHeader,
  type InsurersFilterChipsProps,
  type InsurersFiltersInlineProps,
  type InsurersListHeaderProps,
} from "./filters.components";

// =============================================================================
// InsurersTable
// =============================================================================

export interface InsurersTableProps {
  data: Insurer[];
  columns: typeof insurersColumns;
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
  // Navigation
  onRowClick: (id: string) => void;
}

export function InsurersTable({
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
  onRowClick,
}: InsurersTableProps) {
  if (isError) {
    return <InsurersErrorState onRetry={onRefetch} />;
  }

  return (
    <div className="min-h-0 flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      {isLoading ? (
        <div className="flex h-full items-center justify-center rounded-2xl border border-border bg-white shadow-sm">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="relative h-full">
          {isFetching && <InsurersFetchingOverlay />}
          <DataTable
            className="h-full rounded-2xl border border-border bg-white shadow-sm"
            data={data}
            columns={columns}
            getRowId={(row) => row.id}
            sorting={sorting}
            onSortingChange={onSortingChange}
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
            totalRows={totalRows}
            onRowClick={(row) => onRowClick(row.id)}
            enableSorting
            enablePagination
            itemName="aseguradoras"
            emptyState="No se encontraron aseguradoras."
          />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// InsurersListView (Entry Point)
// =============================================================================

export function InsurersListView() {
  const list = useInsurersList();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <InsurersListHeader
        total={list.total}
        onNew={list.createModalState.onOpen}
      />

      <InsurersFiltersInline
        search={list.filters.search}
        type={list.filters.type}
        isActive={list.filters.isActive}
        onSearchChange={(v) => list.updateFilter("search", v)}
        onTypeChange={(v) => list.updateFilter("type", v)}
        onIsActiveChange={(v) => list.updateFilter("isActive", v)}
        onClearAll={list.clearAllFilters}
        hasActiveFilters={list.hasActiveFilters}
      />

      <InsurersFilterChips filters={list.activeFilters} />

      <InsurersTable
        data={list.data}
        columns={insurersColumns}
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
        onRowClick={list.navigateToInsurer}
      />

      {/* Create Modal - key resets form on each open */}
      <InsurerCreateModal
        key={list.createModalState.key}
        open={list.createModalState.open}
        onClose={list.createModalState.onClose}
      />
    </div>
  );
}
