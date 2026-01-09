import { z } from "zod";
import {
  coercedInt,
  coercedEnum,
  coercedBoolean,
} from "../../lib/schema-helpers.js";
import { userRefSchema, paginationSchema } from "../../lib/common.js";

// =============================================================================
// Enums
// =============================================================================

export const noteEntityTypeSchema = z.enum([
  "Claim",
  "Policy",
  "Invoice",
  "Ticket",
  "Document",
]);

export type NoteEntityType = z.infer<typeof noteEntityTypeSchema>;

// =============================================================================
// Constants
// =============================================================================

export const NOTE_MAX_CONTENT_LENGTH = 10000;

// =============================================================================
// Query Schema
// =============================================================================

const sortOrderSchema = z.enum(["asc", "desc"]);

export const listNotesQuerySchema = z.object({
  // Pagination
  page: coercedInt(1, { min: 1 }),
  limit: coercedInt(20, { min: 1, max: 100 }),

  // Sorting
  sortOrder: coercedEnum(sortOrderSchema, "desc"),

  // Filters
  includeInternal: coercedBoolean(false),
});

export type ListNotesQuery = z.infer<typeof listNotesQuerySchema>;

// =============================================================================
// Params Schemas
// =============================================================================

export const noteListParamsSchema = z.object({
  entityType: noteEntityTypeSchema,
  entityId: z.string().min(1),
});

export const noteParamsSchema = z.object({
  entityType: noteEntityTypeSchema,
  entityId: z.string().min(1),
  noteId: z.string().min(1),
});

export type NoteListParams = z.infer<typeof noteListParamsSchema>;
export type NoteParams = z.infer<typeof noteParamsSchema>;

// =============================================================================
// Request Schemas
// =============================================================================

export const createNoteRequestSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Content cannot be empty")
    .max(NOTE_MAX_CONTENT_LENGTH, `Content cannot exceed ${NOTE_MAX_CONTENT_LENGTH} characters`),
  isInternal: z.boolean().optional().default(false),
});

export const updateNoteRequestSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Content cannot be empty")
    .max(NOTE_MAX_CONTENT_LENGTH, `Content cannot exceed ${NOTE_MAX_CONTENT_LENGTH} characters`)
    .optional(),
});

export type CreateNoteRequest = z.infer<typeof createNoteRequestSchema>;
export type UpdateNoteRequest = z.infer<typeof updateNoteRequestSchema>;

// =============================================================================
// Response Schemas
// =============================================================================

export const noteSchema = z.object({
  id: z.string(),
  entityType: noteEntityTypeSchema,
  entityId: z.string(),
  content: z.string(),
  isInternal: z.boolean(),
  isEdited: z.boolean(),
  createdBy: userRefSchema,
  updatedBy: userRefSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listNotesResponseSchema = z.object({
  data: z.array(noteSchema),
  pagination: paginationSchema,
});

export type Note = z.infer<typeof noteSchema>;
export type ListNotesResponse = z.infer<typeof listNotesResponseSchema>;

// =============================================================================
// Claim-specific Params Schemas
// =============================================================================

export const claimNoteListParamsSchema = z.object({
  id: z.string().min(1),
});

export const claimNoteParamsSchema = z.object({
  id: z.string().min(1),
  noteId: z.string().min(1),
});

export type ClaimNoteListParams = z.infer<typeof claimNoteListParamsSchema>;
export type ClaimNoteParams = z.infer<typeof claimNoteParamsSchema>;
