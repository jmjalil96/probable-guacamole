import type { ListAgentsQuery } from "shared";

export const agentKeys = {
  all: ["agents"] as const,
  lists: () => [...agentKeys.all, "list"] as const,
  list: (query: ListAgentsQuery) => [...agentKeys.lists(), query] as const,
  detail: (id: string) => [...agentKeys.all, "detail", id] as const,
};

export const agentClientKeys = {
  all: (agentId: string) => ["agents", agentId, "clients"] as const,
  list: (agentId: string) => [...agentClientKeys.all(agentId), "list"] as const,
};
