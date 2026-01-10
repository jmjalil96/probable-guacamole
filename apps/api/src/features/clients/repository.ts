import type { Prisma } from "@prisma/client";
import { db } from "../../config/db.js";

// =============================================================================
// Types
// =============================================================================

export interface FindClientsParams {
  where: Prisma.ClientWhereInput;
  skip: number;
  take: number;
  orderBy: Prisma.ClientOrderByWithRelationInput | Prisma.ClientOrderByWithRelationInput[];
}

export interface CreateClientData {
  name: string;
}

// =============================================================================
// Queries
// =============================================================================

export async function findClients(params: FindClientsParams) {
  return db.client.findMany({
    where: params.where,
    skip: params.skip,
    take: params.take,
    orderBy: params.orderBy,
  });
}

export async function countClients(where: Prisma.ClientWhereInput): Promise<number> {
  return db.client.count({ where });
}

export async function findClientById(id: string) {
  return db.client.findUnique({
    where: { id },
  });
}

export async function findClientByName(name: string) {
  return db.client.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
}

// =============================================================================
// Mutations
// =============================================================================

export async function createClient(data: CreateClientData) {
  return db.client.create({
    data: {
      name: data.name,
    },
  });
}

export async function updateClient(id: string, data: Prisma.ClientUpdateInput) {
  return db.client.update({
    where: { id },
    data,
  });
}

export async function deleteClient(id: string) {
  return db.client.delete({
    where: { id },
  });
}

// =============================================================================
// Relation Checks
// =============================================================================

export async function countClientAffiliates(clientId: string): Promise<number> {
  return db.affiliate.count({
    where: { clientId },
  });
}

export async function countClientClaims(clientId: string): Promise<number> {
  return db.claim.count({
    where: { clientId },
  });
}

export async function countClientPolicies(clientId: string): Promise<number> {
  return db.policy.count({
    where: { clientId },
  });
}
