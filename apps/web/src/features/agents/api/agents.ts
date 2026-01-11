import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  ListAgentsQuery,
  ListAgentsResponse,
  Agent,
  UpdateAgentRequest,
} from "shared";
import { agentKeys } from "./keys";

// =============================================================================
// Agents - List & Detail
// =============================================================================

export function useListAgents(query: ListAgentsQuery) {
  return useQuery<ListAgentsResponse, Error>({
    queryKey: agentKeys.list(query),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (query.page) params.set("page", String(query.page));
      if (query.limit) params.set("limit", String(query.limit));
      if (query.sortBy) params.set("sortBy", query.sortBy);
      if (query.sortOrder) params.set("sortOrder", query.sortOrder);
      if (query.search) params.set("search", query.search);
      if (query.isActive !== undefined)
        params.set("isActive", String(query.isActive));
      if (query.hasAccount !== undefined)
        params.set("hasAccount", String(query.hasAccount));

      const { data } = await api.get<ListAgentsResponse>(
        `/agents?${params.toString()}`
      );
      return data;
    },
  });
}

export function useAgent(id: string) {
  return useQuery<Agent, Error>({
    queryKey: agentKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Agent>(`/agents/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// =============================================================================
// Agents - Mutations
// =============================================================================

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAgentRequest;
    }) => {
      const { data: response } = await api.patch<Agent>(`/agents/${id}`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: agentKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
    },
  });
}
