// =============================================================================
// Shared Types for Claims Feature
// =============================================================================

/**
 * Represents the state of an async lookup query.
 * Used for cascading selects and any data-fetching UI components.
 */
export interface LookupState {
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;
}
