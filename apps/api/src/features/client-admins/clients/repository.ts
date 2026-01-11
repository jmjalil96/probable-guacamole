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

export async function findClientAdminClients(clientAdminId: string) {
  return db.clientAdminClient.findMany({
    where: { clientAdminId },
    include: {
      client: { select: { id: true, name: true } },
    },
    orderBy: { assignedAt: "desc" },
  });
}

export async function findClientAdminClient(clientAdminId: string, clientId: string) {
  return db.clientAdminClient.findUnique({
    where: { clientAdminId_clientId: { clientAdminId, clientId } },
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

export async function assignClientAdminClient(clientAdminId: string, clientId: string) {
  return db.clientAdminClient.create({
    data: { clientAdminId, clientId },
    include: {
      client: { select: { id: true, name: true } },
    },
  });
}

export async function removeClientAdminClient(clientAdminId: string, clientId: string) {
  return db.clientAdminClient.delete({
    where: { clientAdminId_clientId: { clientAdminId, clientId } },
  });
}

// =============================================================================
// Validation Helpers
// =============================================================================

export async function findClientAdminById(id: string) {
  return db.clientAdmin.findUnique({
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
