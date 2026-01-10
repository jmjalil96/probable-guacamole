import type { Client } from "shared";
import type { findClients } from "./repository.js";

type ClientData = Awaited<ReturnType<typeof findClients>>[number];

export function mapClientToResponse(client: ClientData): Client {
  return {
    id: client.id,
    name: client.name,
    isActive: client.isActive,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };
}
