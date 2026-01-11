import type { ListUsersQuery } from "shared";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (query: ListUsersQuery) => [...userKeys.lists(), query] as const,
};
