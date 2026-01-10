import type {
  SortingState,
  PaginationState,
  OnChangeFn,
} from "@tanstack/react-table";
import type { Client } from "shared";
import type { OpenState } from "@/lib/hooks";
import type { ClientsSearch } from "./schema";

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

export interface UseClientsUrlStateReturn {
  search: ClientsSearch;
  updateSearch: (updates: Partial<ClientsSearch>) => void;
}

// =============================================================================
// Table State Hook
// =============================================================================

export interface UseClientsTableStateReturn {
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
}

// =============================================================================
// Filters Hook
// =============================================================================

export interface ClientsFilters {
  search: string | undefined;
  isActive: boolean | undefined;
}

export interface UseClientsFiltersReturn {
  filters: ClientsFilters;
  activeFilters: ActiveFilter[];
  hasActiveFilters: boolean;
  updateFilter: <K extends keyof ClientsFilters>(
    key: K,
    value: ClientsFilters[K]
  ) => void;
  clearAllFilters: () => void;
}

// =============================================================================
// List View Hook
// =============================================================================

export interface UseClientsListReturn {
  // Data
  data: Client[];
  total: number | undefined;
  pageCount: number;
  totalRows: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;

  // Filters
  filters: ClientsFilters;
  activeFilters: ActiveFilter[];
  hasActiveFilters: boolean;
  updateFilter: <K extends keyof ClientsFilters>(
    key: K,
    value: ClientsFilters[K]
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
  navigateToClient: (id: string) => void;
}
