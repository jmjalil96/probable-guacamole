import type { UserListItem, UserType } from "shared";
import type { SortingState, PaginationState, OnChangeFn } from "@tanstack/react-table";
import { DataTable, Spinner } from "@/components/ui";
import { UsersErrorState, UsersFetchingOverlay } from "../shared";
import { usersColumns } from "./columns";
import { useUsersList } from "./hooks";
import {
  UsersFilterChips,
  UsersFiltersInline,
  UsersFiltersSheet,
  UsersListHeader,
} from "./filters.components";

export {
  UsersFilterChips,
  UsersFiltersInline,
  UsersFiltersSheet,
  UsersListHeader,
  type UsersFilterChipsProps,
  type UsersFiltersInlineProps,
  type UsersFiltersSheetProps,
  type UsersListHeaderProps,
} from "./filters.components";

// =============================================================================
// UsersTable
// =============================================================================

export interface UsersTableProps {
  data: UserListItem[];
  columns: typeof usersColumns;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRefetch: () => void;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  pageCount: number;
  totalRows: number;
  onRowClick: (user: UserListItem) => void;
}

export function UsersTable({
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
}: UsersTableProps) {
  if (isError) {
    return <UsersErrorState onRetry={onRefetch} />;
  }

  return (
    <div className="min-h-0 flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      {isLoading ? (
        <div className="flex h-full items-center justify-center rounded-2xl border border-border bg-white shadow-sm">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="relative h-full">
          {isFetching && <UsersFetchingOverlay />}
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
            enableSorting
            enablePagination
            itemName="usuarios"
            emptyState="No se encontraron usuarios."
            onRowClick={onRowClick}
          />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// UsersListView (Entry Point)
// =============================================================================

export function UsersListView() {
  const list = useUsersList();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <UsersListHeader total={list.total} />

      <UsersFiltersInline
        search={list.filters.search}
        type={list.filters.type}
        isActive={list.filters.isActive}
        hasAccount={list.filters.hasAccount}
        onSearchChange={(v) => list.updateFilter("search", v)}
        onTypeChange={(v) => list.updateFilter("type", v as UserType | undefined)}
        onIsActiveChange={(v) => list.updateFilter("isActive", v)}
        onHasAccountChange={(v) => list.updateFilter("hasAccount", v)}
        onOpenMobileFilters={list.openMobileSheet}
        onClearAll={list.clearAllFilters}
        hasActiveFilters={list.hasActiveFilters}
      />

      <UsersFilterChips filters={list.activeFilters} />

      <UsersTable
        data={list.data}
        columns={usersColumns}
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
        onRowClick={list.navigateToUser}
      />

      {/* Mobile Filter Sheet */}
      <UsersFiltersSheet
        open={list.mobileSheetOpen}
        onClose={list.closeMobileSheet}
        type={list.filters.type}
        isActive={list.filters.isActive}
        hasAccount={list.filters.hasAccount}
        onTypeChange={(v) => list.updateFilter("type", v)}
        onIsActiveChange={(v) => list.updateFilter("isActive", v)}
        onHasAccountChange={(v) => list.updateFilter("hasAccount", v)}
        onClearAll={list.clearAllFilters}
      />
    </div>
  );
}
