import { db } from "../../../config/db.js";

// =============================================================================
// Client Lookups
// =============================================================================

export async function findAllClients() {
  return db.client.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function findClientsByIds(clientIds: string[]) {
  return db.client.findMany({
    where: { id: { in: clientIds } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function findClientById(clientId: string) {
  return db.client.findUnique({
    where: { id: clientId },
    select: { id: true, name: true },
  });
}

// =============================================================================
// Affiliate Lookups
// =============================================================================

export async function findAffiliatesByClientId(clientId: string) {
  return db.affiliate.findMany({
    where: {
      clientId,
      primaryAffiliateId: null, // Only primary affiliates, not dependents
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function findAffiliateById(affiliateId: string) {
  return db.affiliate.findUnique({
    where: { id: affiliateId },
    select: {
      id: true,
      clientId: true,
      firstName: true,
      lastName: true,
      primaryAffiliateId: true,
    },
  });
}

// =============================================================================
// Patient Lookups (affiliate + their dependents)
// =============================================================================

export async function findPatientsByAffiliateId(affiliateId: string) {
  return db.affiliate.findMany({
    where: {
      OR: [{ id: affiliateId }, { primaryAffiliateId: affiliateId }],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      relationship: true,
      primaryAffiliateId: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

// =============================================================================
// Policy Lookups
// =============================================================================

export async function findPoliciesByClientId(clientId: string) {
  return db.policy.findMany({
    where: { clientId },
    select: {
      id: true,
      policyNumber: true,
      status: true,
      insurer: {
        select: { name: true },
      },
    },
    orderBy: { policyNumber: "asc" },
  });
}
