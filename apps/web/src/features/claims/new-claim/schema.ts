import { z } from "zod";
import { createClaimRequestSchema } from "shared";

export const newClaimSchema = createClaimRequestSchema
  .pick({
    clientId: true,
    affiliateId: true,
    patientId: true,
    description: true,
  })
  .extend({
    clientId: z.string().min(1, "Seleccione un cliente"),
    affiliateId: z.string().min(1, "Seleccione un afiliado"),
    patientId: z.string().min(1, "Seleccione un paciente"),
    description: z
      .string()
      .trim()
      .min(1, "Ingrese una descripción")
      .max(2000, "Máximo 2000 caracteres"),
  });

export type NewClaimForm = z.infer<typeof newClaimSchema>;
