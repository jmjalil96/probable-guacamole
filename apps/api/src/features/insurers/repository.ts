import type { Prisma } from "@prisma/client";
import { db } from "../../config/db.js";

// =============================================================================
// Types
// =============================================================================

export interface FindInsurersParams {
  where: Prisma.InsurerWhereInput;
  skip: number;
  take: number;
  orderBy: Prisma.InsurerOrderByWithRelationInput | Prisma.InsurerOrderByWithRelationInput[];
}

export interface CreateInsurerData {
  name: string;
  code?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  type: "MEDICINA_PREPAGADA" | "COMPANIA_DE_SEGUROS";
}

// =============================================================================
// Queries
// =============================================================================

export async function findInsurers(params: FindInsurersParams) {
  return db.insurer.findMany({
    where: params.where,
    skip: params.skip,
    take: params.take,
    orderBy: params.orderBy,
  });
}

export async function countInsurers(where: Prisma.InsurerWhereInput): Promise<number> {
  return db.insurer.count({ where });
}

export async function findInsurerById(id: string) {
  return db.insurer.findUnique({
    where: { id },
  });
}

export async function findInsurerByName(name: string) {
  return db.insurer.findUnique({
    where: { name },
    select: { id: true },
  });
}

export async function findInsurerByCode(code: string) {
  return db.insurer.findUnique({
    where: { code },
    select: { id: true },
  });
}

// =============================================================================
// Mutations
// =============================================================================

export async function createInsurer(data: CreateInsurerData) {
  return db.insurer.create({
    data: {
      name: data.name,
      type: data.type,
      ...(data.code !== undefined && { code: data.code }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.website !== undefined && { website: data.website }),
    },
  });
}

export async function updateInsurer(id: string, data: Prisma.InsurerUpdateInput) {
  return db.insurer.update({
    where: { id },
    data,
  });
}

export async function deleteInsurer(id: string) {
  return db.insurer.delete({
    where: { id },
  });
}

// =============================================================================
// Relation Checks
// =============================================================================

export async function countInsurerPolicies(insurerId: string): Promise<number> {
  return db.policy.count({
    where: { insurerId },
  });
}
