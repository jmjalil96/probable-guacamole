import { Prisma } from "@prisma/client";
import { db } from "../../../config/db.js";

// =============================================================================
// Types
// =============================================================================

export interface FindAvailableClientsParams {
  where: Prisma.ClientWhereInput;
  skip: number;
  take: number;
  orderBy: Prisma.ClientOrderByWithRelationInput;
}

// =============================================================================
// Queries
// =============================================================================

export async function findAgentClients(agentId: string) {
  return db.agentClient.findMany({
    where: { agentId },
    include: {
      client: { select: { id: true, name: true } },
    },
    orderBy: { assignedAt: "desc" },
  });
}

export async function findAgentClient(agentId: string, clientId: string) {
  return db.agentClient.findUnique({
    where: { agentId_clientId: { agentId, clientId } },
  });
}

export async function findAvailableClients(params: FindAvailableClientsParams) {
  return db.client.findMany({
    where: params.where,
    select: { id: true, name: true },
    skip: params.skip,
    take: params.take,
    orderBy: params.orderBy,
  });
}

export async function countAvailableClients(
  where: Prisma.ClientWhereInput
): Promise<number> {
  return db.client.count({ where });
}

// =============================================================================
// Mutations
// =============================================================================

export async function assignAgentClient(agentId: string, clientId: string) {
  return db.agentClient.create({
    data: { agentId, clientId },
    include: {
      client: { select: { id: true, name: true } },
    },
  });
}

export async function removeAgentClient(agentId: string, clientId: string) {
  return db.agentClient.delete({
    where: { agentId_clientId: { agentId, clientId } },
  });
}

// =============================================================================
// Validation Helpers
// =============================================================================

export async function findAgentById(id: string) {
  return db.agent.findUnique({
    where: { id },
    select: { id: true, isActive: true },
  });
}

export async function findClientById(id: string) {
  return db.client.findUnique({
    where: { id },
    select: { id: true, name: true, isActive: true },
  });
}
