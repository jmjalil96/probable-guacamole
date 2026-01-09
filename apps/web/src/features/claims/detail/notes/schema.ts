import { z } from "zod";
import { NOTE_MAX_CONTENT_LENGTH } from "shared";

// =============================================================================
// Note Form Schema
// =============================================================================

/**
 * Validation schema for creating/editing a claim note.
 * Matches the createNoteRequestSchema from shared.
 */
export const noteFormSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Ingrese el contenido de la nota")
    .max(
      NOTE_MAX_CONTENT_LENGTH,
      `Máximo ${NOTE_MAX_CONTENT_LENGTH} caracteres`
    ),
});

export type NoteFormData = z.infer<typeof noteFormSchema>;
