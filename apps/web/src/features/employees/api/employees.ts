import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  ListEmployeesQuery,
  ListEmployeesResponse,
  Employee,
  UpdateEmployeeRequest,
} from "shared";
import { employeeKeys } from "./keys";

// =============================================================================
// Employees - List & Detail
// =============================================================================

export function useListEmployees(query: ListEmployeesQuery) {
  return useQuery<ListEmployeesResponse, Error>({
    queryKey: employeeKeys.list(query),
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
      if (query.hasAccount !== undefined)
        params.set("hasAccount", String(query.hasAccount));

      const { data } = await api.get<ListEmployeesResponse>(
        `/employees?${params.toString()}`
      );
      return data;
    },
  });
}

export function useEmployee(id: string) {
  return useQuery<Employee, Error>({
    queryKey: employeeKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Employee>(`/employees/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// =============================================================================
// Employees - Mutations
// =============================================================================

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateEmployeeRequest;
    }) => {
      const { data: response } = await api.patch<Employee>(
        `/employees/${id}`,
        data
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: employeeKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
}
