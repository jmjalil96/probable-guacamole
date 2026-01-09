import { z } from "zod";

// =============================================================================
// Invoice Form Schema
// =============================================================================

/**
 * Validation schema for creating/editing a claim invoice.
 * Matches the createClaimInvoiceRequestSchema from shared.
 */
export const invoiceFormSchema = z.object({
  invoiceNumber: z
    .string()
    .trim()
    .min(1, "Ingrese el número de factura")
    .max(100, "Máximo 100 caracteres"),
  providerName: z
    .string()
    .trim()
    .min(1, "Ingrese el nombre del proveedor")
    .max(255, "Máximo 255 caracteres"),
  amountSubmitted: z.string().min(1, "Ingrese el monto"),
});

export type InvoiceFormData = z.infer<typeof invoiceFormSchema>;
