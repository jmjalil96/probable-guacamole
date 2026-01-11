import type { ListEmployeesQuery } from "shared";

export const employeeKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeKeys.all, "list"] as const,
  list: (query: ListEmployeesQuery) => [...employeeKeys.lists(), query] as const,
  detail: (id: string) => [...employeeKeys.all, "detail", id] as const,
};
