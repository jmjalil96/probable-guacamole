import { z } from "zod";

// =============================================================================
// Client Form Schema
// =============================================================================

/**
 * Validation schema for creating/editing a client.
 * Matches the shared schemas but with frontend-specific handling.
 */
export const clientFormSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(255, "Maximo 255 caracteres"),
  isActive: z.boolean(),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;
