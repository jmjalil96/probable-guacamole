import { z } from "zod";
import { insurerTypeSchema } from "shared";

// =============================================================================
// Insurer Form Schema
// =============================================================================

/**
 * Validation schema for creating/editing an insurer.
 * Matches the shared schemas but with frontend-specific handling.
 */
export const insurerFormSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(255, "Maximo 255 caracteres"),
  code: z.string().max(50, "Maximo 50 caracteres").nullable(),
  email: z
    .string()
    .email("Email invalido")
    .nullable()
    .or(z.literal("")),
  phone: z.string().max(50, "Maximo 50 caracteres").nullable(),
  website: z
    .string()
    .url("URL invalida")
    .nullable()
    .or(z.literal("")),
  type: insurerTypeSchema,
  isActive: z.boolean(),
});

export type InsurerFormData = z.infer<typeof insurerFormSchema>;
