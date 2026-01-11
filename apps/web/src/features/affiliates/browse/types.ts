import type {
  SortingState,
  PaginationState,
  OnChangeFn,
  ExpandedState,
} from "@tanstack/react-table";
import type { AffiliateListItem, DependentRelationship } from "shared";

export type AffiliateRow = AffiliateListItem & {
  subRows?: AffiliateRow[];
  __isDependent?: boolean;
  __relationship?: DependentRelationship | null;
  __parentId?: string;
};
import type { AffiliatesSearch } from "./schema";

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

export interface UseAffiliatesUrlStateReturn {
  search: AffiliatesSearch;
  updateSearch: (updates: Partial<AffiliatesSearch>) => void;
}

// =============================================================================
// Table State Hook
// =============================================================================

export interface UseAffiliatesTableStateReturn {
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
}

// =============================================================================
// Filters Hook
// =============================================================================

export interface AffiliatesFilters {
  search: string | undefined;
  clientId: string | undefined;
  isActive: boolean | undefined;
  hasPortalAccess: "true" | "false" | "pending" | undefined;
}

export interface UseAffiliatesFiltersReturn {
  filters: AffiliatesFilters;
  activeFilters: ActiveFilter[];
  hasActiveFilters: boolean;
  updateFilter: <K extends keyof AffiliatesFilters>(
    key: K,
    value: AffiliatesFilters[K]
  ) => void;
  clearAllFilters: () => void;
}

// =============================================================================
// List View Hook
// =============================================================================

export interface UseAffiliatesListReturn {
  // Data
  data: AffiliateRow[];
  total: number | undefined;
  pageCount: number;
  totalRows: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;

  // Filters
  filters: AffiliatesFilters;
  activeFilters: ActiveFilter[];
  hasActiveFilters: boolean;
  updateFilter: <K extends keyof AffiliatesFilters>(
    key: K,
    value: AffiliatesFilters[K]
  ) => void;
  clearAllFilters: () => void;

  // Table state
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;

  // Expansion state
  expanded: ExpandedState;
  onExpandedChange: OnChangeFn<ExpandedState>;

  // Sheets
  desktopSheetOpen: boolean;
  mobileSheetOpen: boolean;
  openDesktopSheet: () => void;
  closeDesktopSheet: () => void;
  openMobileSheet: () => void;
  closeMobileSheet: () => void;

  // Navigation
  navigateToAffiliate: (id: string) => void;
}
