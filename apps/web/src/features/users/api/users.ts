import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ListUsersQuery, ListUsersResponse } from "shared";
import { userKeys } from "./keys";

export function useListUsers(query: ListUsersQuery) {
  return useQuery<ListUsersResponse, Error>({
    queryKey: userKeys.list(query),
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
      if (query.isActive !== undefined) params.set("isActive", String(query.isActive));
      if (query.hasAccount !== undefined) params.set("hasAccount", String(query.hasAccount));
      if (query.clientId) params.set("clientId", query.clientId);

      const { data } = await api.get<ListUsersResponse>(`/users?${params.toString()}`);
      return data;
    },
  });
}
