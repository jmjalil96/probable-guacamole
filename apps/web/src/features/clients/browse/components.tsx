import type { Client } from "shared";
import type {
  SortingState,
  PaginationState,
  OnChangeFn,
} from "@tanstack/react-table";
import { DataTable, Spinner } from "@/components/ui";
import { ClientsErrorState, ClientsFetchingOverlay } from "../shared";
import { clientsColumns } from "./columns";
import { useClientsList } from "./hooks";
import {
  ClientsFilterChips,
  ClientsFiltersInline,
  ClientsListHeader,
} from "./filters.components";
import { ClientCreateModal } from "../detail/client-edit.components";

// Re-export filter types and components for public API
export {
  ClientsFilterChips,
  ClientsFiltersInline,
  ClientsListHeader,
  type ClientsFilterChipsProps,
  type ClientsFiltersInlineProps,
  type ClientsListHeaderProps,
} from "./filters.components";

// =============================================================================
// ClientsTable
// =============================================================================

export interface ClientsTableProps {
  data: Client[];
  columns: typeof clientsColumns;
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

export function ClientsTable({
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
}: ClientsTableProps) {
  if (isError) {
    return <ClientsErrorState onRetry={onRefetch} />;
  }

  return (
    <div className="min-h-0 flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      {isLoading ? (
        <div className="flex h-full items-center justify-center rounded-2xl border border-border bg-white shadow-sm">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="relative h-full">
          {isFetching && <ClientsFetchingOverlay />}
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
            itemName="clientes"
            emptyState="No se encontraron clientes."
          />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ClientsListView (Entry Point)
// =============================================================================

export function ClientsListView() {
  const list = useClientsList();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ClientsListHeader
        total={list.total}
        onNew={list.createModalState.onOpen}
      />

      <ClientsFiltersInline
        search={list.filters.search}
        isActive={list.filters.isActive}
        onSearchChange={(v) => list.updateFilter("search", v)}
        onIsActiveChange={(v) => list.updateFilter("isActive", v)}
        onClearAll={list.clearAllFilters}
        hasActiveFilters={list.hasActiveFilters}
      />

      <ClientsFilterChips filters={list.activeFilters} />

      <ClientsTable
        data={list.data}
        columns={clientsColumns}
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
        onRowClick={list.navigateToClient}
      />

      {/* Create Modal - key resets form on each open */}
      <ClientCreateModal
        key={list.createModalState.key}
        open={list.createModalState.open}
        onClose={list.createModalState.onClose}
      />
    </div>
  );
}
