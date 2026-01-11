import { z } from "zod";

// =============================================================================
// Client Admin Form Schema
// =============================================================================

export const clientAdminFormSchema = z.object({
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
  jobTitle: z.string().max(100, "Maximo 100 caracteres").nullable(),
  isActive: z.boolean(),
});

export type ClientAdminFormData = z.infer<typeof clientAdminFormSchema>;
