import type { SortingState, PaginationState, OnChangeFn } from "@tanstack/react-table";
import type { UserListItem, UserType } from "shared";
import type { UsersSearch } from "./schema";

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
}

export interface UseUsersUrlStateReturn {
  search: UsersSearch;
  updateSearch: (updates: Partial<UsersSearch>) => void;
}

export interface UseUsersTableStateReturn {
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
}

export interface UsersFilters {
  search: string | undefined;
  type: UserType | undefined;
  isActive: boolean | undefined;
  hasAccount: boolean | undefined;
}

export interface UseUsersFiltersReturn {
  filters: UsersFilters;
  activeFilters: ActiveFilter[];
  hasActiveFilters: boolean;
  updateFilter: <K extends keyof UsersFilters>(key: K, value: UsersFilters[K]) => void;
  clearAllFilters: () => void;
}

export interface UseUsersListReturn {
  // Data
  data: UserListItem[];
  total: number | undefined;
  pageCount: number;
  totalRows: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;

  // Filters
  filters: UsersFilters;
  activeFilters: ActiveFilter[];
  hasActiveFilters: boolean;
  updateFilter: <K extends keyof UsersFilters>(key: K, value: UsersFilters[K]) => void;
  clearAllFilters: () => void;

  // Table state
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;

  // Mobile filter sheet (like claims pattern)
  mobileSheetOpen: boolean;
  openMobileSheet: () => void;
  closeMobileSheet: () => void;

  // Navigation
  navigateToUser: (user: UserListItem) => void;
}
