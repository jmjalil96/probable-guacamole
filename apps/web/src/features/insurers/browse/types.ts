import type {
  SortingState,
  PaginationState,
  OnChangeFn,
} from "@tanstack/react-table";
import type { InsurerType, Insurer } from "shared";
import type { OpenState } from "@/lib/hooks";
import type { InsurersSearch } from "./schema";

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

export interface UseInsurersUrlStateReturn {
  search: InsurersSearch;
  updateSearch: (updates: Partial<InsurersSearch>) => void;
}

// =============================================================================
// Table State Hook
// =============================================================================

export interface UseInsurersTableStateReturn {
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
}

// =============================================================================
// Filters Hook
// =============================================================================

export interface InsurersFilters {
  search: string | undefined;
  type: InsurerType | undefined;
  isActive: boolean | undefined;
}

export interface UseInsurersFiltersReturn {
  filters: InsurersFilters;
  activeFilters: ActiveFilter[];
  hasActiveFilters: boolean;
  updateFilter: <K extends keyof InsurersFilters>(
    key: K,
    value: InsurersFilters[K]
  ) => void;
  clearAllFilters: () => void;
}

// =============================================================================
// List View Hook
// =============================================================================

export interface UseInsurersListReturn {
  // Data
  data: Insurer[];
  total: number | undefined;
  pageCount: number;
  totalRows: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;

  // Filters
  filters: InsurersFilters;
  activeFilters: ActiveFilter[];
  hasActiveFilters: boolean;
  updateFilter: <K extends keyof InsurersFilters>(
    key: K,
    value: InsurersFilters[K]
  ) => void;
  clearAllFilters: () => void;

  // Table state
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;

  // Create modal
  createModalState: OpenState;

  // Navigation
  navigateToInsurer: (id: string) => void;
}

