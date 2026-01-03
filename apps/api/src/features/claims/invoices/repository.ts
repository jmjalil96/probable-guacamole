import { db } from "../../../config/db.js";

// =============================================================================
// Include Constants
// =============================================================================

const userProfileSelect = {
  id: true,
  employee: { select: { firstName: true, lastName: true } },
  agent: { select: { firstName: true, lastName: true } },
  clientAdmin: { select: { firstName: true, lastName: true } },
  affiliate: { select: { firstName: true, lastName: true } },
} as const;

const invoiceInclude = {
  createdBy: { select: userProfileSelect },
} as const;

// =============================================================================
// Types
// =============================================================================

export interface CreateInvoiceData {
  claimId: string;
  invoiceNumber: string;
  providerName: string;
  amountSubmitted: string;
  createdById: string;
}

// =============================================================================
// Claim Queries (for validation)
// =============================================================================

export async function findClaimById(id: string) {
  return db.claim.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
}

// =============================================================================
// Invoice Queries
// =============================================================================

export async function findInvoicesByClaimId(claimId: string) {
  return db.claimInvoice.findMany({
    where: { claimId },
    orderBy: { createdAt: "desc" },
    include: invoiceInclude,
  });
}

export async function findInvoiceById(id: string, claimId?: string) {
  return db.claimInvoice.findFirst({
    where: { id, ...(claimId && { claimId }) },
    include: invoiceInclude,
  });
}

// =============================================================================
// Invoice Mutations
// =============================================================================

export async function createInvoice(data: CreateInvoiceData) {
  return db.claimInvoice.create({
    data: {
      claimId: data.claimId,
      invoiceNumber: data.invoiceNumber,
      providerName: data.providerName,
      amountSubmitted: data.amountSubmitted,
      createdById: data.createdById,
    },
    include: invoiceInclude,
  });
}

export async function updateInvoice(
  id: string,
  data: Partial<{
    invoiceNumber: string;
    providerName: string;
    amountSubmitted: string;
  }>
) {
  return db.claimInvoice.update({
    where: { id },
    data,
    include: invoiceInclude,
  });
}

export async function deleteInvoice(id: string) {
  return db.claimInvoice.delete({
    where: { id },
  });
}
