import type { Logger } from "pino";
import type {
  ListClaimInvoicesResponse,
  ClaimInvoice,
  CreateClaimInvoiceRequest,
  UpdateClaimInvoiceRequest,
} from "shared";
import { CLAIM_TERMINAL_STATUSES } from "shared";
import { logger } from "../../../lib/logger.js";
import { AppError } from "../../../lib/errors.js";
import * as audit from "../../../services/audit/audit.js";
import * as repo from "./repository.js";

// =============================================================================
// Types
// =============================================================================

export interface ListClaimInvoicesParams {
  claimId: string;
  user: { id: string };
  requestId?: string;
}

export interface GetClaimInvoiceParams {
  claimId: string;
  invoiceId: string;
  user: { id: string };
  requestId?: string;
}

export interface CreateClaimInvoiceParams {
  claimId: string;
  request: CreateClaimInvoiceRequest;
  user: { id: string };
  requestId?: string;
}

export interface UpdateClaimInvoiceParams {
  claimId: string;
  invoiceId: string;
  updates: UpdateClaimInvoiceRequest;
  user: { id: string };
  requestId?: string;
}

export interface DeleteClaimInvoiceParams {
  claimId: string;
  invoiceId: string;
  user: { id: string };
  requestId?: string;
}

// =============================================================================
// Mappers
// =============================================================================

type InvoiceData = NonNullable<Awaited<ReturnType<typeof repo.findInvoiceById>>>;

function resolveUserName(user: InvoiceData["createdBy"]): string {
  const profile =
    user.employee ?? user.agent ?? user.clientAdmin ?? user.affiliate;
  return profile ? `${profile.firstName} ${profile.lastName}` : "Unknown";
}

function mapInvoiceToResponse(invoice: InvoiceData): ClaimInvoice {
  return {
    id: invoice.id,
    claimId: invoice.claimId,
    invoiceNumber: invoice.invoiceNumber,
    providerName: invoice.providerName,
    amountSubmitted: invoice.amountSubmitted.toString(),
    createdBy: {
      id: invoice.createdBy.id,
      name: resolveUserName(invoice.createdBy),
    },
    createdAt: invoice.createdAt.toISOString(),
  };
}

// =============================================================================
// Validation Helpers
// =============================================================================

async function validateClaimForInvoice(
  claimId: string,
  operation: "read" | "write",
  log: Logger
): Promise<void> {
  // 1. Verify claim exists
  const claim = await repo.findClaimById(claimId);
  if (!claim) {
    log.debug({ claimId }, "claim not found");
    throw AppError.notFound("Claim");
  }

  // 2. For write operations, verify claim is not in terminal status
  if (
    operation === "write" &&
    CLAIM_TERMINAL_STATUSES.includes(claim.status)
  ) {
    log.debug({ claimId, status: claim.status }, "claim in terminal status");
    throw AppError.badRequest(
      `Cannot modify invoices for claim in ${claim.status} status`
    );
  }
}

// =============================================================================
// List Invoices
// =============================================================================

export async function listClaimInvoices(
  params: ListClaimInvoicesParams
): Promise<ListClaimInvoicesResponse> {
  const { claimId, user, requestId } = params;
  const log = logger.child({ module: "claims/invoices", requestId });

  log.debug({ claimId, userId: user.id }, "list invoices started");

  // 1. Validate claim exists
  await validateClaimForInvoice(claimId, "read", log);

  // 2. Fetch invoices
  const invoices = await repo.findInvoicesByClaimId(claimId);

  log.debug({ claimId, count: invoices.length }, "list invoices completed");

  return {
    data: invoices.map(mapInvoiceToResponse),
  };
}

// =============================================================================
// Get Invoice
// =============================================================================

export async function getClaimInvoice(
  params: GetClaimInvoiceParams,
  context: audit.AuditContext
): Promise<ClaimInvoice> {
  const { claimId, invoiceId, user, requestId } = params;
  const log = logger.child({ module: "claims/invoices", requestId });

  log.debug({ claimId, invoiceId, userId: user.id }, "get invoice started");

  // 1. Validate claim exists
  await validateClaimForInvoice(claimId, "read", log);

  // 2. Find invoice
  const invoice = await repo.findInvoiceById(invoiceId, claimId);
  if (!invoice) {
    log.debug({ invoiceId, claimId }, "invoice not found");
    throw AppError.notFound("Invoice");
  }

  // 3. Audit log (fire-and-forget)
  audit.log(
    {
      action: audit.AuditActions.READ,
      resource: "ClaimInvoice",
      resourceId: invoice.id,
      metadata: { claimId },
    },
    context
  );

  log.debug({ invoiceId }, "get invoice completed");

  return mapInvoiceToResponse(invoice);
}

// =============================================================================
// Create Invoice
// =============================================================================

export async function createClaimInvoice(
  params: CreateClaimInvoiceParams,
  context: audit.AuditContext
): Promise<ClaimInvoice> {
  const { claimId, request, user, requestId } = params;
  const log = logger.child({ module: "claims/invoices", requestId });

  log.debug({ claimId, userId: user.id }, "create invoice started");

  // 1. Validate claim exists and not terminal
  await validateClaimForInvoice(claimId, "write", log);

  // 2. Create invoice
  const invoice = await repo.createInvoice({
    claimId,
    invoiceNumber: request.invoiceNumber,
    providerName: request.providerName,
    amountSubmitted: request.amountSubmitted,
    createdById: user.id,
  });

  log.info({ invoiceId: invoice.id, claimId }, "invoice created");

  // 3. Audit log
  audit.log(
    {
      action: audit.AuditActions.CREATE,
      resource: "ClaimInvoice",
      resourceId: invoice.id,
      newValue: {
        invoiceNumber: request.invoiceNumber,
        providerName: request.providerName,
        amountSubmitted: request.amountSubmitted,
      },
      metadata: { claimId },
    },
    context
  );

  log.debug({ invoiceId: invoice.id }, "create invoice completed");

  return mapInvoiceToResponse(invoice);
}

// =============================================================================
// Update Invoice
// =============================================================================

export async function updateClaimInvoice(
  params: UpdateClaimInvoiceParams,
  context: audit.AuditContext
): Promise<ClaimInvoice> {
  const { claimId, invoiceId, updates, user, requestId } = params;
  const log = logger.child({ module: "claims/invoices", requestId });

  log.debug({ claimId, invoiceId, userId: user.id }, "update invoice started");

  // 1. Validate claim exists and not terminal
  await validateClaimForInvoice(claimId, "write", log);

  // 2. Find existing invoice
  const existing = await repo.findInvoiceById(invoiceId, claimId);
  if (!existing) {
    log.debug({ invoiceId, claimId }, "invoice not found");
    throw AppError.notFound("Invoice");
  }

  // 3. Check if there are actual updates
  const updateFields = Object.keys(updates).filter(
    (key) => updates[key as keyof typeof updates] !== undefined
  );
  if (updateFields.length === 0) {
    log.debug({ invoiceId }, "no fields to update");
    return mapInvoiceToResponse(existing);
  }

  // 4. Build old values for audit
  const oldValue: Record<string, unknown> = {};
  for (const field of updateFields) {
    if (field === "amountSubmitted") {
      oldValue[field] = existing.amountSubmitted.toString();
    } else {
      oldValue[field] = existing[field as keyof typeof existing];
    }
  }

  // 5. Build update data (filter out undefined)
  const updateData: Partial<{
    invoiceNumber: string;
    providerName: string;
    amountSubmitted: string;
  }> = {};
  if (updates.invoiceNumber !== undefined) {
    updateData.invoiceNumber = updates.invoiceNumber;
  }
  if (updates.providerName !== undefined) {
    updateData.providerName = updates.providerName;
  }
  if (updates.amountSubmitted !== undefined) {
    updateData.amountSubmitted = updates.amountSubmitted;
  }

  // 6. Update invoice
  const updated = await repo.updateInvoice(invoiceId, updateData);

  log.info({ invoiceId, fields: updateFields }, "invoice updated");

  // 7. Build new values for audit
  const newValue: Record<string, unknown> = {};
  for (const field of updateFields) {
    newValue[field] = updates[field as keyof typeof updates];
  }

  // 8. Audit log
  audit.log(
    {
      action: audit.AuditActions.UPDATE,
      resource: "ClaimInvoice",
      resourceId: invoiceId,
      oldValue,
      newValue,
      metadata: { claimId, updatedFields: updateFields },
    },
    context
  );

  log.debug({ invoiceId }, "update invoice completed");

  return mapInvoiceToResponse(updated);
}

// =============================================================================
// Delete Invoice
// =============================================================================

export async function deleteClaimInvoice(
  params: DeleteClaimInvoiceParams,
  context: audit.AuditContext
): Promise<void> {
  const { claimId, invoiceId, user, requestId } = params;
  const log = logger.child({ module: "claims/invoices", requestId });

  log.debug({ claimId, invoiceId, userId: user.id }, "delete invoice started");

  // 1. Validate claim exists and not terminal
  await validateClaimForInvoice(claimId, "write", log);

  // 2. Find existing invoice
  const existing = await repo.findInvoiceById(invoiceId, claimId);
  if (!existing) {
    log.debug({ invoiceId, claimId }, "invoice not found");
    throw AppError.notFound("Invoice");
  }

  // 3. Delete invoice (hard delete)
  await repo.deleteInvoice(invoiceId);

  log.info({ invoiceId, claimId }, "invoice deleted");

  // 4. Audit log
  audit.log(
    {
      action: audit.AuditActions.DELETE,
      resource: "ClaimInvoice",
      resourceId: invoiceId,
      oldValue: {
        invoiceNumber: existing.invoiceNumber,
        providerName: existing.providerName,
        amountSubmitted: existing.amountSubmitted.toString(),
      },
      metadata: { claimId },
    },
    context
  );

  log.debug({ invoiceId }, "delete invoice completed");
}
