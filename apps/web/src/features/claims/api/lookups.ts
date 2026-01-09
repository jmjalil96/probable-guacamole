import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  LookupClientsResponse,
  LookupAffiliatesResponse,
  LookupPatientsResponse,
  LookupPoliciesResponse,
} from "shared";
import { claimKeys } from "./keys";

// =============================================================================
// Lookup Queries
// =============================================================================

export function useClaimClients() {
  return useQuery<LookupClientsResponse, Error>({
    queryKey: claimKeys.lookups.clients(),
    queryFn: async () => {
      const { data } = await api.get<LookupClientsResponse>(
        "/claims/lookups/clients"
      );
      return data;
    },
  });
}

export function useClaimAffiliates(clientId: string) {
  return useQuery<LookupAffiliatesResponse, Error>({
    queryKey: claimKeys.lookups.affiliates(clientId),
    queryFn: async () => {
      const { data } = await api.get<LookupAffiliatesResponse>(
        `/claims/lookups/affiliates?${new URLSearchParams({ clientId })}`
      );
      return data;
    },
    enabled: !!clientId,
  });
}

export function useClaimPatients(affiliateId: string) {
  return useQuery<LookupPatientsResponse, Error>({
    queryKey: claimKeys.lookups.patients(affiliateId),
    queryFn: async () => {
      const { data } = await api.get<LookupPatientsResponse>(
        `/claims/lookups/patients?${new URLSearchParams({ affiliateId })}`
      );
      return data;
    },
    enabled: !!affiliateId,
  });
}

export function useClaimPolicies(clientId: string) {
  return useQuery<LookupPoliciesResponse, Error>({
    queryKey: claimKeys.lookups.policies(clientId),
    queryFn: async () => {
      const { data } = await api.get<LookupPoliciesResponse>(
        `/claims/lookups/policies?${new URLSearchParams({ clientId })}`
      );
      return data;
    },
    enabled: !!clientId,
  });
}
