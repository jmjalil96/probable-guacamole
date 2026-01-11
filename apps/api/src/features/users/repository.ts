import type { Prisma } from "@prisma/client";
import { db } from "../../config/db.js";

// =============================================================================
// Types
// =============================================================================

export interface FindProfilesParams {
  where?: {
    search?: string;
    isActive?: boolean;
    hasAccount?: boolean;
    clientId?: string;
  };
}

// =============================================================================
// Employee Queries
// =============================================================================

export async function findEmployees(params: FindProfilesParams) {
  const where: Prisma.EmployeeWhereInput = {};

  if (params.where?.isActive !== undefined) {
    where.isActive = params.where.isActive;
  }
  if (params.where?.search) {
    where.OR = [
      { firstName: { contains: params.where.search, mode: "insensitive" } },
      { lastName: { contains: params.where.search, mode: "insensitive" } },
      { email: { contains: params.where.search, mode: "insensitive" } },
    ];
  }
  if (params.where?.hasAccount !== undefined) {
    where.userId = params.where.hasAccount ? { not: null } : null;
  }

  return db.employee.findMany({
    where,
    include: {
      user: { select: { id: true, isActive: true } },
      invitation: { select: { id: true, acceptedAt: true } },
    },
  });
}

export async function countEmployees(params: FindProfilesParams): Promise<number> {
  const where: Prisma.EmployeeWhereInput = {};

  if (params.where?.isActive !== undefined) {
    where.isActive = params.where.isActive;
  }
  if (params.where?.search) {
    where.OR = [
      { firstName: { contains: params.where.search, mode: "insensitive" } },
      { lastName: { contains: params.where.search, mode: "insensitive" } },
      { email: { contains: params.where.search, mode: "insensitive" } },
    ];
  }
  if (params.where?.hasAccount !== undefined) {
    where.userId = params.where.hasAccount ? { not: null } : null;
  }

  return db.employee.count({ where });
}

// =============================================================================
// Agent Queries
// =============================================================================

export async function findAgents(params: FindProfilesParams) {
  const where: Prisma.AgentWhereInput = {};

  if (params.where?.isActive !== undefined) {
    where.isActive = params.where.isActive;
  }
  if (params.where?.search) {
    where.OR = [
      { firstName: { contains: params.where.search, mode: "insensitive" } },
      { lastName: { contains: params.where.search, mode: "insensitive" } },
      { email: { contains: params.where.search, mode: "insensitive" } },
    ];
  }
  if (params.where?.hasAccount !== undefined) {
    where.userId = params.where.hasAccount ? { not: null } : null;
  }
  if (params.where?.clientId) {
    where.clients = { some: { clientId: params.where.clientId } };
  }

  return db.agent.findMany({
    where,
    include: {
      user: { select: { id: true, isActive: true } },
      invitation: { select: { id: true, acceptedAt: true } },
      clients: { include: { client: { select: { id: true, name: true } } } },
    },
  });
}

export async function countAgents(params: FindProfilesParams): Promise<number> {
  const where: Prisma.AgentWhereInput = {};

  if (params.where?.isActive !== undefined) {
    where.isActive = params.where.isActive;
  }
  if (params.where?.search) {
    where.OR = [
      { firstName: { contains: params.where.search, mode: "insensitive" } },
      { lastName: { contains: params.where.search, mode: "insensitive" } },
      { email: { contains: params.where.search, mode: "insensitive" } },
    ];
  }
  if (params.where?.hasAccount !== undefined) {
    where.userId = params.where.hasAccount ? { not: null } : null;
  }
  if (params.where?.clientId) {
    where.clients = { some: { clientId: params.where.clientId } };
  }

  return db.agent.count({ where });
}

// =============================================================================
// ClientAdmin Queries
// =============================================================================

export async function findClientAdmins(params: FindProfilesParams) {
  const where: Prisma.ClientAdminWhereInput = {};

  if (params.where?.isActive !== undefined) {
    where.isActive = params.where.isActive;
  }
  if (params.where?.search) {
    where.OR = [
      { firstName: { contains: params.where.search, mode: "insensitive" } },
      { lastName: { contains: params.where.search, mode: "insensitive" } },
      { email: { contains: params.where.search, mode: "insensitive" } },
    ];
  }
  if (params.where?.hasAccount !== undefined) {
    where.userId = params.where.hasAccount ? { not: null } : null;
  }
  if (params.where?.clientId) {
    where.clients = { some: { clientId: params.where.clientId } };
  }

  return db.clientAdmin.findMany({
    where,
    include: {
      user: { select: { id: true, isActive: true } },
      invitation: { select: { id: true, acceptedAt: true } },
      clients: { include: { client: { select: { id: true, name: true } } } },
    },
  });
}

export async function countClientAdmins(params: FindProfilesParams): Promise<number> {
  const where: Prisma.ClientAdminWhereInput = {};

  if (params.where?.isActive !== undefined) {
    where.isActive = params.where.isActive;
  }
  if (params.where?.search) {
    where.OR = [
      { firstName: { contains: params.where.search, mode: "insensitive" } },
      { lastName: { contains: params.where.search, mode: "insensitive" } },
      { email: { contains: params.where.search, mode: "insensitive" } },
    ];
  }
  if (params.where?.hasAccount !== undefined) {
    where.userId = params.where.hasAccount ? { not: null } : null;
  }
  if (params.where?.clientId) {
    where.clients = { some: { clientId: params.where.clientId } };
  }

  return db.clientAdmin.count({ where });
}

// =============================================================================
// Affiliate Queries
// =============================================================================

export async function findAffiliates(params: FindProfilesParams) {
  const where: Prisma.AffiliateWhereInput = {};

  if (params.where?.isActive !== undefined) {
    where.isActive = params.where.isActive;
  }
  if (params.where?.search) {
    where.OR = [
      { firstName: { contains: params.where.search, mode: "insensitive" } },
      { lastName: { contains: params.where.search, mode: "insensitive" } },
      { email: { contains: params.where.search, mode: "insensitive" } },
    ];
  }
  if (params.where?.hasAccount !== undefined) {
    where.userId = params.where.hasAccount ? { not: null } : null;
  }
  if (params.where?.clientId) {
    where.clientId = params.where.clientId;
  }

  return db.affiliate.findMany({
    where,
    include: {
      user: { select: { id: true, isActive: true } },
      invitation: { select: { id: true, acceptedAt: true } },
      client: { select: { id: true, name: true } },
    },
  });
}

export async function countAffiliates(params: FindProfilesParams): Promise<number> {
  const where: Prisma.AffiliateWhereInput = {};

  if (params.where?.isActive !== undefined) {
    where.isActive = params.where.isActive;
  }
  if (params.where?.search) {
    where.OR = [
      { firstName: { contains: params.where.search, mode: "insensitive" } },
      { lastName: { contains: params.where.search, mode: "insensitive" } },
      { email: { contains: params.where.search, mode: "insensitive" } },
    ];
  }
  if (params.where?.hasAccount !== undefined) {
    where.userId = params.where.hasAccount ? { not: null } : null;
  }
  if (params.where?.clientId) {
    where.clientId = params.where.clientId;
  }

  return db.affiliate.count({ where });
}
