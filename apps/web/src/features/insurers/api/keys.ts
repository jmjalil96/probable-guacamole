import type { ListInsurersQuery } from "shared";

// =============================================================================
// Query Keys
// =============================================================================

export const insurerKeys = {
  all: ["insurers"] as const,

  // List
  lists: () => [...insurerKeys.all, "list"] as const,
  list: (query: ListInsurersQuery) => [...insurerKeys.lists(), query] as const,

  // Detail
  details: () => [...insurerKeys.all, "detail"] as const,
  detail: (id: string) => [...insurerKeys.details(), id] as const,
};
