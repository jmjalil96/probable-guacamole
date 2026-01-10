import type { ListClientsQuery } from "shared";

// =============================================================================
// Query Keys
// =============================================================================

export const clientKeys = {
  all: ["clients"] as const,

  // List
  lists: () => [...clientKeys.all, "list"] as const,
  list: (query: ListClientsQuery) => [...clientKeys.lists(), query] as const,

  // Detail
  details: () => [...clientKeys.all, "detail"] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
};
