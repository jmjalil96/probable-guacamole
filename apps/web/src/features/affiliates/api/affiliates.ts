import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  ListAffiliatesQuery,
  ListAffiliatesResponse,
  AffiliateDetail,
} from "shared";
import { affiliateKeys } from "./keys";

// =============================================================================
// Affiliates - List & Detail
// =============================================================================

export function useListAffiliates(query: ListAffiliatesQuery) {
  return useQuery<ListAffiliatesResponse, Error>({
    queryKey: affiliateKeys.list(query),
    queryFn: async () => {
      const params = new URLSearchParams();

      // Pagination
      if (query.page) params.set("page", String(query.page));
      if (query.limit) params.set("limit", String(query.limit));

      // Sorting
      if (query.sortBy) params.set("sortBy", query.sortBy);
      if (query.sortOrder) params.set("sortOrder", query.sortOrder);

      // Search & Filters
      if (query.search) params.set("search", query.search);
      if (query.clientId) params.set("clientId", query.clientId);
      if (query.isActive !== undefined)
        params.set("isActive", String(query.isActive));
      if (query.hasPortalAccess)
        params.set("hasPortalAccess", query.hasPortalAccess);

      const { data } = await api.get<ListAffiliatesResponse>(
        `/affiliates?${params.toString()}`
      );
      return data;
    },
  });
}

export function useAffiliate(id: string) {
  return useQuery<AffiliateDetail, Error>({
    queryKey: affiliateKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<AffiliateDetail>(`/affiliates/${id}`);
      return data;
    },
    enabled: !!id,
  });
}
