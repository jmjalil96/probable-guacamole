import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  ListClientAdminClientsResponse,
  AssignClientAdminClientResponse,
  ListAvailableClientsResponse,
} from "shared";
import { clientAdminClientKeys, clientAdminKeys } from "./keys";

// =============================================================================
// Client Admin Clients - List
// =============================================================================

export function useClientAdminClients(clientAdminId: string) {
  return useQuery<ListClientAdminClientsResponse, Error>({
    queryKey: clientAdminClientKeys.list(clientAdminId),
    queryFn: async () => {
      const { data } = await api.get<ListClientAdminClientsResponse>(
        `/client-admins/${clientAdminId}/clients`
      );
      return data;
    },
    enabled: !!clientAdminId,
  });
}

// =============================================================================
// Client Admin Clients - Mutations
// =============================================================================

export function useAssignClientAdminClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      clientAdminId,
      clientId,
    }: {
      clientAdminId: string;
      clientId: string;
    }) => {
      const { data } = await api.post<AssignClientAdminClientResponse>(
        `/client-admins/${clientAdminId}/clients/${clientId}`
      );
      return data;
    },
    onSuccess: (_, { clientAdminId }) => {
      void queryClient.invalidateQueries({
        queryKey: clientAdminClientKeys.list(clientAdminId),
      });
      // Also invalidate client admin detail to update clientCount
      void queryClient.invalidateQueries({
        queryKey: clientAdminKeys.detail(clientAdminId),
      });
    },
  });
}

export function useRemoveClientAdminClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      clientAdminId,
      clientId,
    }: {
      clientAdminId: string;
      clientId: string;
    }) => {
      await api.delete(`/client-admins/${clientAdminId}/clients/${clientId}`);
    },
    onSuccess: (_, { clientAdminId }) => {
      void queryClient.invalidateQueries({
        queryKey: clientAdminClientKeys.list(clientAdminId),
      });
      // Also invalidate client admin detail to update clientCount
      void queryClient.invalidateQueries({
        queryKey: clientAdminKeys.detail(clientAdminId),
      });
    },
  });
}

// =============================================================================
// Available Clients - Search
// =============================================================================

export async function searchAvailableClientsForClientAdmin(
  clientAdminId: string,
  search: string
): Promise<ListAvailableClientsResponse> {
  const params = new URLSearchParams({
    page: "1",
    limit: "20",
    sortBy: "name",
    sortOrder: "asc",
  });
  if (search) {
    params.set("search", search);
  }
  const { data } = await api.get<ListAvailableClientsResponse>(
    `/client-admins/${clientAdminId}/clients/available?${params}`
  );
  return data;
}
