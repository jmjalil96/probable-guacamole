import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  ListAgentClientsResponse,
  AssignAgentClientResponse,
  ListAvailableClientsResponse,
} from "shared";
import { agentClientKeys, agentKeys } from "./keys";

// =============================================================================
// Agent Clients - List
// =============================================================================

export function useAgentClients(agentId: string) {
  return useQuery<ListAgentClientsResponse, Error>({
    queryKey: agentClientKeys.list(agentId),
    queryFn: async () => {
      const { data } = await api.get<ListAgentClientsResponse>(
        `/agents/${agentId}/clients`
      );
      return data;
    },
    enabled: !!agentId,
  });
}

// =============================================================================
// Agent Clients - Mutations
// =============================================================================

export function useAssignAgentClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      agentId,
      clientId,
    }: {
      agentId: string;
      clientId: string;
    }) => {
      const { data } = await api.post<AssignAgentClientResponse>(
        `/agents/${agentId}/clients/${clientId}`
      );
      return data;
    },
    onSuccess: (_, { agentId }) => {
      void queryClient.invalidateQueries({
        queryKey: agentClientKeys.list(agentId),
      });
      // Also invalidate agent detail to update clientCount
      void queryClient.invalidateQueries({
        queryKey: agentKeys.detail(agentId),
      });
    },
  });
}

export function useRemoveAgentClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      agentId,
      clientId,
    }: {
      agentId: string;
      clientId: string;
    }) => {
      await api.delete(`/agents/${agentId}/clients/${clientId}`);
    },
    onSuccess: (_, { agentId }) => {
      void queryClient.invalidateQueries({
        queryKey: agentClientKeys.list(agentId),
      });
      // Also invalidate agent detail to update clientCount
      void queryClient.invalidateQueries({
        queryKey: agentKeys.detail(agentId),
      });
    },
  });
}

// =============================================================================
// Available Clients - Search
// =============================================================================

export async function searchAvailableClientsForAgent(
  agentId: string,
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
    `/agents/${agentId}/clients/available?${params}`
  );
  return data;
}
