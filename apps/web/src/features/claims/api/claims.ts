import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  ListClaimsQuery,
  ListClaimsResponse,
  ClaimDetail,
  CreateClaimRequest,
  CreateClaimResponse,
  UpdateClaimRequest,
} from "shared";
import { claimKeys } from "./keys";

// =============================================================================
// Claims - List & Detail
// =============================================================================

export function useListClaims(query: ListClaimsQuery) {
  return useQuery<ListClaimsResponse, Error>({
    queryKey: claimKeys.list(query),
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
      if (query.status?.length) params.set("status", query.status.join(","));
      if (query.clientName) params.set("clientName", query.clientName);
      if (query.affiliateName) params.set("affiliateName", query.affiliateName);
      if (query.patientName) params.set("patientName", query.patientName);
      if (query.careType) params.set("careType", query.careType);

      // Date ranges
      if (query.submittedDateFrom)
        params.set("submittedDateFrom", query.submittedDateFrom);
      if (query.submittedDateTo)
        params.set("submittedDateTo", query.submittedDateTo);
      if (query.incidentDateFrom)
        params.set("incidentDateFrom", query.incidentDateFrom);
      if (query.incidentDateTo)
        params.set("incidentDateTo", query.incidentDateTo);

      const { data } = await api.get<ListClaimsResponse>(
        `/claims?${params.toString()}`
      );
      return data;
    },
  });
}

export function useClaim(id: string) {
  return useQuery<ClaimDetail, Error>({
    queryKey: claimKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<ClaimDetail>(`/claims/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdateClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateClaimRequest;
    }) => {
      const { data: response } = await api.patch<ClaimDetail>(
        `/claims/${id}`,
        data
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: claimKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: claimKeys.lists() });
    },
  });
}

// =============================================================================
// Claims - Creation
// =============================================================================

export function useCreateClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateClaimRequest) => {
      const { data: response } = await api.post<CreateClaimResponse>(
        "/claims",
        data
      );
      return response;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: claimKeys.all });
    },
  });
}
