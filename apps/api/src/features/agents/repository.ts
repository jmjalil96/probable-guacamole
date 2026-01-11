import type { Prisma } from "@prisma/client";
import { db } from "../../config/db.js";

// =============================================================================
// Types
// =============================================================================

export interface FindAgentsParams {
  where: Prisma.AgentWhereInput;
  skip: number;
  take: number;
  orderBy:
    | Prisma.AgentOrderByWithRelationInput
    | Prisma.AgentOrderByWithRelationInput[];
}

export interface CreateAgentData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  licenseNumber?: string | null;
  agencyName?: string | null;
}

// =============================================================================
// Queries
// =============================================================================

export async function findAgents(params: FindAgentsParams) {
  return db.agent.findMany({
    where: params.where,
    skip: params.skip,
    take: params.take,
    orderBy: params.orderBy,
    include: {
      _count: {
        select: { clients: true },
      },
    },
  });
}

export async function countAgents(
  where: Prisma.AgentWhereInput
): Promise<number> {
  return db.agent.count({ where });
}

export async function findAgentById(id: string) {
  return db.agent.findUnique({
    where: { id },
    include: {
      _count: {
        select: { clients: true },
      },
    },
  });
}

export async function findAgentByEmail(email: string) {
  return db.agent.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
}

// =============================================================================
// Mutations
// =============================================================================

export async function createAgent(data: CreateAgentData) {
  return db.agent.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.licenseNumber !== undefined && { licenseNumber: data.licenseNumber }),
      ...(data.agencyName !== undefined && { agencyName: data.agencyName }),
    },
    include: {
      _count: {
        select: { clients: true },
      },
    },
  });
}

export async function updateAgent(id: string, data: Prisma.AgentUpdateInput) {
  return db.agent.update({
    where: { id },
    data,
    include: {
      _count: {
        select: { clients: true },
      },
    },
  });
}

export async function deleteAgent(id: string) {
  return db.agent.delete({
    where: { id },
  });
}

// =============================================================================
// Relation Checks
// =============================================================================

export async function countAgentInvitations(agentId: string): Promise<number> {
  return db.invitation.count({
    where: { agentId },
  });
}

export async function countAgentClients(agentId: string): Promise<number> {
  return db.agentClient.count({
    where: { agentId },
  });
}
