import type {
  SortingState,
  PaginationState,
  OnChangeFn,
} from "@tanstack/react-table";
import type { ClaimStatus, CareType, ClaimListItem } from "shared";
import type { DateRange } from "@/components/ui";
import type { ClaimsSearch } from "./schema";

// =============================================================================
// Active Filter (used by both hooks and components)
// =============================================================================

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
}

// =============================================================================
// URL State Hook
// =============================================================================

export interface UseClaimsUrlStateReturn {
  search: ClaimsSearch;
  updateSearch: (updates: Partial<ClaimsSearch>) => void;
}

// =============================================================================
// Table State Hook
// =============================================================================

export interface UseClaimsTableStateReturn {
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
}

// =============================================================================
// Filters Hook
// =============================================================================

export interface ClaimsFilters {
  search: string | undefined;
  status: ClaimStatus[] | undefined;
  careType: CareType | undefined;
  submittedDateFrom: string | undefined;
  submittedDateTo: string | undefined;
  incidentDateFrom: string | undefined;
  incidentDateTo: string | undefined;
}

export interface UseClaimsFiltersReturn {
  filters: ClaimsFilters;
  activeFilters: ActiveFilter[];
  hasActiveFilters: boolean;
  updateFilter: <K extends keyof ClaimsFilters>(
    key: K,
    value: ClaimsFilters[K]
  ) => void;
  clearAllFilters: () => void;
  handleSubmittedDateChange: (range: DateRange) => void;
  handleIncidentDateChange: (range: DateRange) => void;
  clearIncidentDate: () => void;
}

// =============================================================================
// List View Hook
// =============================================================================

export interface UseClaimsListReturn {
  // Data
  data: ClaimListItem[];
  total: number | undefined;
  pageCount: number;
  totalRows: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;

  // Filters
  filters: ClaimsFilters;
  activeFilters: ActiveFilter[];
  hasActiveFilters: boolean;
  updateFilter: <K extends keyof ClaimsFilters>(
    key: K,
    value: ClaimsFilters[K]
  ) => void;
  clearAllFilters: () => void;
  handleSubmittedDateChange: (range: DateRange) => void;
  handleIncidentDateChange: (range: DateRange) => void;
  clearIncidentDate: () => void;

  // Table state
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;

  // Sheets
  desktopSheetOpen: boolean;
  mobileSheetOpen: boolean;
  openDesktopSheet: () => void;
  closeDesktopSheet: () => void;
  openMobileSheet: () => void;
  closeMobileSheet: () => void;

  // Navigation
  navigateToNewClaim: () => void;
  navigateToClaim: (id: string) => void;
}

// =============================================================================
// Kanban View Types
// =============================================================================

export interface KanbanBaseQuery {
  search?: string | undefined;
  careType?: "AMBULATORY" | "HOSPITALARY" | "OTHER" | undefined;
  submittedDateFrom?: string | undefined;
  submittedDateTo?: string | undefined;
  incidentDateFrom?: string | undefined;
  incidentDateTo?: string | undefined;
}

export interface KanbanColumnData {
  status: ClaimStatus;
  data: ClaimListItem[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isError: boolean;
  hasMore: boolean;
  fetchNextPage: () => void;
}

export interface UseKanbanColumnsReturn {
  columns: KanbanColumnData[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;
}

export interface UseClaimsKanbanReturn {
  // Columns
  columns: KanbanColumnData[];
  total: number;

  // Loading States
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;

  // Filters
  filters: ClaimsFilters;
  activeFilters: ActiveFilter[];
  hasActiveFilters: boolean;
  updateFilter: UseClaimsFiltersReturn["updateFilter"];
  clearAllFilters: UseClaimsFiltersReturn["clearAllFilters"];
  handleSubmittedDateChange: UseClaimsFiltersReturn["handleSubmittedDateChange"];
  handleIncidentDateChange: UseClaimsFiltersReturn["handleIncidentDateChange"];
  clearIncidentDate: UseClaimsFiltersReturn["clearIncidentDate"];

  // Sheets
  desktopSheetOpen: boolean;
  mobileSheetOpen: boolean;
  openDesktopSheet: () => void;
  closeDesktopSheet: () => void;
  openMobileSheet: () => void;
  closeMobileSheet: () => void;

  // Navigation
  navigateToClaim: (id: string) => void;
  navigateToNewClaim: () => void;
}

// =============================================================================
// Column Type
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClaimsColumns = import("@tanstack/react-table").ColumnDef<
  ClaimListItem,
  any
>[];
