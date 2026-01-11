import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  ListClientAdminsQuery,
  ListClientAdminsResponse,
  ClientAdmin,
  UpdateClientAdminRequest,
} from "shared";
import { clientAdminKeys } from "./keys";

// =============================================================================
// Client Admins - List & Detail
// =============================================================================

export function useListClientAdmins(query: ListClientAdminsQuery) {
  return useQuery<ListClientAdminsResponse, Error>({
    queryKey: clientAdminKeys.list(query),
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

      const { data } = await api.get<ListClientAdminsResponse>(
        `/client-admins?${params.toString()}`
      );
      return data;
    },
  });
}

export function useClientAdmin(id: string) {
  return useQuery<ClientAdmin, Error>({
    queryKey: clientAdminKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<ClientAdmin>(`/client-admins/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// =============================================================================
// Client Admins - Mutations
// =============================================================================

export function useUpdateClientAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateClientAdminRequest;
    }) => {
      const { data: response } = await api.patch<ClientAdmin>(`/client-admins/${id}`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: clientAdminKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: clientAdminKeys.lists() });
    },
  });
}
