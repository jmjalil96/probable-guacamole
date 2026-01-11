import { z } from "zod";

// =============================================================================
// Agent Form Schema
// =============================================================================

export const agentFormSchema = z.object({
  firstName: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "Maximo 100 caracteres"),
  lastName: z
    .string()
    .min(1, "El apellido es requerido")
    .max(100, "Maximo 100 caracteres"),
  email: z
    .string()
    .email("Correo electronico invalido")
    .max(255, "Maximo 255 caracteres"),
  phone: z.string().max(50, "Maximo 50 caracteres").nullable(),
  licenseNumber: z.string().max(100, "Maximo 100 caracteres").nullable(),
  agencyName: z.string().max(255, "Maximo 255 caracteres").nullable(),
  isActive: z.boolean(),
});

export type AgentFormData = z.infer<typeof agentFormSchema>;
