import type { ListAffiliatesQuery } from "shared";

// =============================================================================
// Query Keys
// =============================================================================

export const affiliateKeys = {
  all: ["affiliates"] as const,

  // List
  lists: () => [...affiliateKeys.all, "list"] as const,
  list: (query: ListAffiliatesQuery) => [...affiliateKeys.lists(), query] as const,

  // Detail
  details: () => [...affiliateKeys.all, "detail"] as const,
  detail: (id: string) => [...affiliateKeys.details(), id] as const,
};
