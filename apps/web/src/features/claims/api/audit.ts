import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  ClaimAuditTrailQuery,
  ClaimAuditTrailResponse,
  ClaimHistoryQuery,
  ClaimHistoryResponse,
} from "shared";
import { claimKeys } from "./keys";

// =============================================================================
// Audit Trail
// =============================================================================

export function useClaimAuditTrail(
  claimId: string,
  query?: ClaimAuditTrailQuery
) {
  return useQuery<ClaimAuditTrailResponse, Error>({
    queryKey: claimKeys.auditTrail(claimId, query),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (query?.page) params.set("page", String(query.page));
      if (query?.limit) params.set("limit", String(query.limit));
      if (query?.action?.length) params.set("action", query.action.join(","));
      if (query?.severity?.length)
        params.set("severity", query.severity.join(","));
      if (query?.userId) params.set("userId", query.userId);
      if (query?.from) params.set("from", query.from);
      if (query?.to) params.set("to", query.to);

      const queryString = params.toString();
      const url = `/claims/${claimId}/audit-trail${queryString ? `?${queryString}` : ""}`;

      const { data } = await api.get<ClaimAuditTrailResponse>(url);
      return data;
    },
    enabled: !!claimId,
  });
}

export function useClaimHistory(claimId: string, query?: ClaimHistoryQuery) {
  return useQuery<ClaimHistoryResponse, Error>({
    queryKey: claimKeys.history(claimId, query),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (query?.page) params.set("page", String(query.page));
      if (query?.limit) params.set("limit", String(query.limit));

      const queryString = params.toString();
      const url = `/claims/${claimId}/audit-trail/history${queryString ? `?${queryString}` : ""}`;

      const { data } = await api.get<ClaimHistoryResponse>(url);
      return data;
    },
    enabled: !!claimId,
  });
}
