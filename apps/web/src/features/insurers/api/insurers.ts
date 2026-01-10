import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  ListInsurersQuery,
  ListInsurersResponse,
  Insurer,
  CreateInsurerRequest,
  CreateInsurerResponse,
  UpdateInsurerRequest,
} from "shared";
import { insurerKeys } from "./keys";

// =============================================================================
// Insurers - List & Detail
// =============================================================================

export function useListInsurers(query: ListInsurersQuery) {
  return useQuery<ListInsurersResponse, Error>({
    queryKey: insurerKeys.list(query),
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
      if (query.type) params.set("type", query.type);
      if (query.isActive !== undefined)
        params.set("isActive", String(query.isActive));

      const { data } = await api.get<ListInsurersResponse>(
        `/insurers?${params.toString()}`
      );
      return data;
    },
  });
}

export function useInsurer(id: string) {
  return useQuery<Insurer, Error>({
    queryKey: insurerKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Insurer>(`/insurers/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// =============================================================================
// Insurers - Mutations
// =============================================================================

export function useCreateInsurer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateInsurerRequest) => {
      const { data: response } = await api.post<CreateInsurerResponse>(
        "/insurers",
        data
      );
      return response;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: insurerKeys.all });
    },
  });
}

export function useUpdateInsurer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateInsurerRequest;
    }) => {
      const { data: response } = await api.patch<Insurer>(
        `/insurers/${id}`,
        data
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: insurerKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: insurerKeys.lists() });
    },
  });
}

export function useDeleteInsurer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/insurers/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: insurerKeys.all });
    },
  });
}
