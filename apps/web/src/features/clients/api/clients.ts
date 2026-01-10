import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  ListClientsQuery,
  ListClientsResponse,
  Client,
  CreateClientRequest,
  CreateClientResponse,
  UpdateClientRequest,
} from "shared";
import { clientKeys } from "./keys";

// =============================================================================
// Clients - List & Detail
// =============================================================================

export function useListClients(query: ListClientsQuery) {
  return useQuery<ListClientsResponse, Error>({
    queryKey: clientKeys.list(query),
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
      if (query.isActive !== undefined)
        params.set("isActive", String(query.isActive));

      const { data } = await api.get<ListClientsResponse>(
        `/clients?${params.toString()}`
      );
      return data;
    },
  });
}

export function useClient(id: string) {
  return useQuery<Client, Error>({
    queryKey: clientKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Client>(`/clients/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// =============================================================================
// Clients - Mutations
// =============================================================================

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateClientRequest) => {
      const { data: response } = await api.post<CreateClientResponse>(
        "/clients",
        data
      );
      return response;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateClientRequest;
    }) => {
      const { data: response } = await api.patch<Client>(
        `/clients/${id}`,
        data
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/clients/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}
