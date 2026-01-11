import type { Prisma } from "@prisma/client";
import { db } from "../../config/db.js";

// =============================================================================
// Types
// =============================================================================

export interface FindClientAdminsParams {
  where: Prisma.ClientAdminWhereInput;
  skip: number;
  take: number;
  orderBy:
    | Prisma.ClientAdminOrderByWithRelationInput
    | Prisma.ClientAdminOrderByWithRelationInput[];
}

export interface CreateClientAdminData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  jobTitle?: string | null;
}

// =============================================================================
// Queries
// =============================================================================

export async function findClientAdmins(params: FindClientAdminsParams) {
  return db.clientAdmin.findMany({
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

export async function countClientAdmins(
  where: Prisma.ClientAdminWhereInput
): Promise<number> {
  return db.clientAdmin.count({ where });
}

export async function findClientAdminById(id: string) {
  return db.clientAdmin.findUnique({
    where: { id },
    include: {
      _count: {
        select: { clients: true },
      },
    },
  });
}

export async function findClientAdminByEmail(email: string) {
  return db.clientAdmin.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
}

// =============================================================================
// Mutations
// =============================================================================

export async function createClientAdmin(data: CreateClientAdminData) {
  return db.clientAdmin.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.jobTitle !== undefined && { jobTitle: data.jobTitle }),
    },
    include: {
      _count: {
        select: { clients: true },
      },
    },
  });
}

export async function updateClientAdmin(id: string, data: Prisma.ClientAdminUpdateInput) {
  return db.clientAdmin.update({
    where: { id },
    data,
    include: {
      _count: {
        select: { clients: true },
      },
    },
  });
}

export async function deleteClientAdmin(id: string) {
  return db.clientAdmin.delete({
    where: { id },
  });
}

// =============================================================================
// Relation Checks
// =============================================================================

export async function countClientAdminInvitations(clientAdminId: string): Promise<number> {
  return db.invitation.count({
    where: { clientAdminId },
  });
}

export async function countClientAdminClients(clientAdminId: string): Promise<number> {
  return db.clientAdminClient.count({
    where: { clientAdminId },
  });
}
