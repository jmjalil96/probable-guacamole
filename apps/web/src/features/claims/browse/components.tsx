import type { ReactNode } from "react";
import type { ClaimListItem } from "shared";
import type {
  SortingState,
  PaginationState,
  OnChangeFn,
} from "@tanstack/react-table";
import { DataTable, Spinner, StatusBadge } from "@/components/ui";
import { KanbanBoard, KanbanColumn, KanbanCard } from "@/components/patterns";
import { formatCurrency, formatDate } from "@/lib/formatting";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  CARE_TYPE_LABELS,
  CARE_TYPE_STYLES,
  ClaimsErrorState,
  ClaimsFetchingOverlay,
} from "../shared";
import { claimsColumns } from "./columns";
import { useClaimsUrlState, useClaimsList, useClaimsKanban } from "./hooks";
import {
  ClaimsFilterChips,
  ClaimsFiltersInline,
  ClaimsFiltersSheet,
  ClaimsListHeader,
  type FilterState,
  type FilterHandlers,
  type SheetState,
} from "./filters.components";
import type { KanbanColumnData, ClaimsColumns } from "./types";

// Re-export filter types and components for public API
export {
  ClaimsFilterChips,
  ClaimsFiltersInline,
  ClaimsFiltersSheet,
  ClaimsListHeader,
  type FilterState,
  type FilterHandlers,
  type SheetState,
  type ClaimsFilterChipsProps,
  type ClaimsFiltersInlineProps,
  type ClaimsFiltersSheetProps,
  type ClaimsListHeaderProps,
  type ClaimsView,
} from "./filters.components";

// =============================================================================
// ClaimsViewLayout
// =============================================================================

export interface ClaimsViewLayoutProps {
  // Header
  total: number | undefined;
  currentView: "list" | "kanban";
  onViewChange: (view: "list" | "kanban") => void;
  navigateToNewClaim: () => void;
  // Grouped props
  filterState: FilterState;
  filterHandlers: FilterHandlers;
  sheetState: SheetState;
  // Content
  children: ReactNode;
}

export function ClaimsViewLayout({
  total,
  currentView,
  onViewChange,
  navigateToNewClaim,
  filterState,
  filterHandlers,
  sheetState,
  children,
}: ClaimsViewLayoutProps) {
  const { filters, activeFilters, hasActiveFilters } = filterState;
  const {
    updateFilter,
    clearAllFilters,
    handleSubmittedDateChange,
    handleIncidentDateChange,
    clearIncidentDate,
  } = filterHandlers;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ClaimsListHeader
        total={total}
        view={currentView}
        onViewChange={onViewChange}
        onNewClaim={navigateToNewClaim}
      />

      <ClaimsFiltersInline
        search={filters.search}
        status={filters.status}
        careType={filters.careType}
        submittedDateFrom={filters.submittedDateFrom}
        submittedDateTo={filters.submittedDateTo}
        onSearchChange={(v) => updateFilter("search", v)}
        onStatusChange={(v) => updateFilter("status", v)}
        onCareTypeChange={(v) => updateFilter("careType", v)}
        onSubmittedDateChange={handleSubmittedDateChange}
        onOpenMobileFilters={sheetState.mobile.onOpen}
        onOpenDesktopFilters={sheetState.desktop.onOpen}
        onClearAll={clearAllFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <ClaimsFilterChips filters={activeFilters} />

      {children}

      <ClaimsFiltersSheet
        variant="desktop"
        open={sheetState.desktop.open}
        onClose={sheetState.desktop.onClose}
        status={filters.status}
        careType={filters.careType}
        submittedDateFrom={filters.submittedDateFrom}
        submittedDateTo={filters.submittedDateTo}
        incidentDateFrom={filters.incidentDateFrom}
        incidentDateTo={filters.incidentDateTo}
        onStatusChange={(v) => updateFilter("status", v)}
        onCareTypeChange={(v) => updateFilter("careType", v)}
        onSubmittedDateChange={handleSubmittedDateChange}
        onIncidentDateChange={handleIncidentDateChange}
        onClearAll={clearAllFilters}
        onClearIncidentDate={clearIncidentDate}
      />

      <ClaimsFiltersSheet
        variant="mobile"
        open={sheetState.mobile.open}
        onClose={sheetState.mobile.onClose}
        status={filters.status}
        careType={filters.careType}
        submittedDateFrom={filters.submittedDateFrom}
        submittedDateTo={filters.submittedDateTo}
        incidentDateFrom={filters.incidentDateFrom}
        incidentDateTo={filters.incidentDateTo}
        onStatusChange={(v) => updateFilter("status", v)}
        onCareTypeChange={(v) => updateFilter("careType", v)}
        onSubmittedDateChange={handleSubmittedDateChange}
        onIncidentDateChange={handleIncidentDateChange}
        onClearAll={clearAllFilters}
        onClearIncidentDate={clearIncidentDate}
      />
    </div>
  );
}

// =============================================================================
// ClaimsTable
// =============================================================================

export interface ClaimsTableProps {
  data: ClaimListItem[];
  columns: ClaimsColumns;
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

export function ClaimsTable({
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
}: ClaimsTableProps) {
  if (isError) {
    return <ClaimsErrorState onRetry={onRefetch} />;
  }

  return (
    <div className="flex-1 min-h-0 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      {isLoading ? (
        <div className="h-full rounded-2xl border border-border bg-white shadow-sm flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="relative h-full">
          {isFetching && <ClaimsFetchingOverlay />}
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
            itemName="reclamos"
            emptyState="No se encontraron reclamos."
          />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ClaimsListView (Entry Point)
// =============================================================================

export function ClaimsListView() {
  const { search, updateSearch } = useClaimsUrlState();
  const list = useClaimsList();

  return (
    <ClaimsViewLayout
      total={list.total}
      currentView={search.view ?? "list"}
      onViewChange={(view) => updateSearch({ view })}
      navigateToNewClaim={list.navigateToNewClaim}
      filterState={{
        filters: list.filters,
        activeFilters: list.activeFilters,
        hasActiveFilters: list.hasActiveFilters,
      }}
      filterHandlers={{
        updateFilter: list.updateFilter,
        clearAllFilters: list.clearAllFilters,
        handleSubmittedDateChange: list.handleSubmittedDateChange,
        handleIncidentDateChange: list.handleIncidentDateChange,
        clearIncidentDate: list.clearIncidentDate,
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
      <ClaimsTable
        data={list.data}
        columns={claimsColumns}
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
        onRowClick={list.navigateToClaim}
      />
    </ClaimsViewLayout>
  );
}

// =============================================================================
// ClaimCardContent
// =============================================================================

export interface ClaimCardContentProps {
  claim: ClaimListItem;
  onClick: () => void;
}

export function ClaimCardContent({ claim, onClick }: ClaimCardContentProps) {
  return (
    <KanbanCard onClick={onClick}>
      {/* Header: claim number + amount */}
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[13px] font-medium text-primary">
          CL-{claim.claimNumber}
        </span>
        <span className="font-mono text-[13px] font-medium text-text">
          {formatCurrency(claim.amountSubmitted)}
        </span>
      </div>

      {/* Patient & Affiliate */}
      <p className="text-sm font-medium text-text">{claim.patient.name}</p>
      <p className="-mt-2 text-[13px] text-text-muted">
        {claim.affiliate.name}
      </p>

      {/* Footer: care type + date */}
      <div className="flex items-center justify-between gap-2">
        {claim.careType ? (
          <StatusBadge
            status={claim.careType}
            labels={CARE_TYPE_LABELS}
            styles={CARE_TYPE_STYLES}
          />
        ) : (
          <span />
        )}
        <span className="text-xs text-text-light">
          {formatDate(claim.createdAt)}
        </span>
      </div>
    </KanbanCard>
  );
}

// =============================================================================
// ClaimsKanban
// =============================================================================

export interface ClaimsKanbanProps {
  columns: KanbanColumnData[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRefetch: () => void;
  onCardClick: (id: string) => void;
}

export function ClaimsKanban({
  columns,
  isLoading,
  isFetching,
  isError,
  onRefetch,
  onCardClick,
}: ClaimsKanbanProps) {
  if (isError) {
    return <ClaimsErrorState onRetry={onRefetch} />;
  }

  // Loading state (initial load)
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="relative min-h-0 flex-1">
      {isFetching && <ClaimsFetchingOverlay />}

      <KanbanBoard>
        {columns.map((column) => (
          <KanbanColumn
            key={column.status}
            title={STATUS_LABELS[column.status]}
            count={column.total}
            loadedCount={column.data.length}
            color={STATUS_COLORS[column.status]}
            isLoading={column.isLoading}
            hasMore={column.hasMore}
            isFetchingNextPage={column.isFetchingNextPage}
            onLoadMore={column.fetchNextPage}
            emptyState={
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <p className="text-[13px] text-text-muted">Sin reclamos</p>
              </div>
            }
          >
            {column.data.map((claim) => (
              <ClaimCardContent
                key={claim.id}
                claim={claim}
                onClick={() => onCardClick(claim.id)}
              />
            ))}
          </KanbanColumn>
        ))}
      </KanbanBoard>
    </div>
  );
}

// =============================================================================
// ClaimsKanbanView (Entry Point)
// =============================================================================

export function ClaimsKanbanView() {
  const { search, updateSearch } = useClaimsUrlState();
  const kanban = useClaimsKanban();

  return (
    <ClaimsViewLayout
      total={kanban.total}
      currentView={search.view ?? "list"}
      onViewChange={(view) => updateSearch({ view })}
      navigateToNewClaim={kanban.navigateToNewClaim}
      filterState={{
        filters: kanban.filters,
        activeFilters: kanban.activeFilters,
        hasActiveFilters: kanban.hasActiveFilters,
      }}
      filterHandlers={{
        updateFilter: kanban.updateFilter,
        clearAllFilters: kanban.clearAllFilters,
        handleSubmittedDateChange: kanban.handleSubmittedDateChange,
        handleIncidentDateChange: kanban.handleIncidentDateChange,
        clearIncidentDate: kanban.clearIncidentDate,
      }}
      sheetState={{
        desktop: {
          open: kanban.desktopSheetOpen,
          onOpen: kanban.openDesktopSheet,
          onClose: kanban.closeDesktopSheet,
        },
        mobile: {
          open: kanban.mobileSheetOpen,
          onOpen: kanban.openMobileSheet,
          onClose: kanban.closeMobileSheet,
        },
      }}
    >
      <ClaimsKanban
        columns={kanban.columns}
        isLoading={kanban.isLoading}
        isFetching={kanban.isFetching}
        isError={kanban.isError}
        onRefetch={kanban.refetch}
        onCardClick={kanban.navigateToClaim}
      />
    </ClaimsViewLayout>
  );
}
