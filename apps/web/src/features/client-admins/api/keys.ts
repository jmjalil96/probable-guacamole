import type { ListClientAdminsQuery } from "shared";

export const clientAdminKeys = {
  all: ["client-admins"] as const,
  lists: () => [...clientAdminKeys.all, "list"] as const,
  list: (query: ListClientAdminsQuery) => [...clientAdminKeys.lists(), query] as const,
  detail: (id: string) => [...clientAdminKeys.all, "detail", id] as const,
};

export const clientAdminClientKeys = {
  all: (clientAdminId: string) => ["client-admins", clientAdminId, "clients"] as const,
  list: (clientAdminId: string) => [...clientAdminClientKeys.all(clientAdminId), "list"] as const,
};
