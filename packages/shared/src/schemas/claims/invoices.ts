import { z } from "zod";
import { userRefSchema } from "../../lib/common.js";

// =============================================================================
// Params Schemas
// =============================================================================

export const claimInvoiceListParamsSchema = z.object({
  id: z.string().min(1), // claimId from parent router
});

export const claimInvoiceParamsSchema = z.object({
  id: z.string().min(1), // claimId from parent router
  invoiceId: z.string().min(1),
});

export type ClaimInvoiceListParams = z.infer<typeof claimInvoiceListParamsSchema>;
export type ClaimInvoiceParams = z.infer<typeof claimInvoiceParamsSchema>;

// =============================================================================
// Request Schemas
// =============================================================================

const decimalStringSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Invalid decimal format (max 2 decimal places)");

export const createClaimInvoiceRequestSchema = z.object({
  invoiceNumber: z.string().trim().min(1).max(100),
  providerName: z.string().trim().min(1).max(255),
  amountSubmitted: decimalStringSchema,
});

export const updateClaimInvoiceRequestSchema = z.object({
  invoiceNumber: z.string().trim().min(1).max(100).optional(),
  providerName: z.string().trim().min(1).max(255).optional(),
  amountSubmitted: decimalStringSchema.optional(),
});

export type CreateClaimInvoiceRequest = z.infer<typeof createClaimInvoiceRequestSchema>;
export type UpdateClaimInvoiceRequest = z.infer<typeof updateClaimInvoiceRequestSchema>;

// =============================================================================
// Response Schemas
// =============================================================================

export const claimInvoiceSchema = z.object({
  id: z.string(),
  claimId: z.string(),
  invoiceNumber: z.string(),
  providerName: z.string(),
  amountSubmitted: z.string(),
  createdBy: userRefSchema,
  createdAt: z.string(),
});

export const listClaimInvoicesResponseSchema = z.object({
  data: z.array(claimInvoiceSchema),
});

export type ClaimInvoice = z.infer<typeof claimInvoiceSchema>;
export type ListClaimInvoicesResponse = z.infer<typeof listClaimInvoicesResponseSchema>;
