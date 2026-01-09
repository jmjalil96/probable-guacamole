import type { Logger } from "pino";
import type {
  ListNotesQuery,
  ListNotesResponse,
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
} from "shared";
import { CLAIM_TERMINAL_STATUSES } from "shared";
import { db } from "../../../config/db.js";
import { logger } from "../../../lib/logger.js";
import { AppError } from "../../../lib/errors.js";
import * as audit from "../../../services/audit/audit.js";
import * as notesService from "../../../services/notes/notes.js";

// =============================================================================
// Types
// =============================================================================

export interface ListClaimNotesParams {
  claimId: string;
  query: ListNotesQuery;
  user: { id: string };
  requestId?: string;
}

export interface GetClaimNoteParams {
  claimId: string;
  noteId: string;
  user: { id: string };
  requestId?: string;
}

export interface CreateClaimNoteParams {
  claimId: string;
  request: CreateNoteRequest;
  user: { id: string };
  requestId?: string;
}

export interface UpdateClaimNoteParams {
  claimId: string;
  noteId: string;
  updates: UpdateNoteRequest;
  user: { id: string };
  requestId?: string;
}

export interface DeleteClaimNoteParams {
  claimId: string;
  noteId: string;
  user: { id: string };
  requestId?: string;
}

// =============================================================================
// Validation Helpers
// =============================================================================

async function findClaimById(id: string) {
  return db.claim.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
}

async function validateClaimForNote(
  claimId: string,
  operation: "read" | "write",
  log: Logger
): Promise<void> {
  // 1. Verify claim exists
  const claim = await findClaimById(claimId);
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
      `Cannot modify notes for claim in ${claim.status} status`
    );
  }
}

// =============================================================================
// List Notes
// =============================================================================

export async function listClaimNotes(
  params: ListClaimNotesParams
): Promise<ListNotesResponse> {
  const { claimId, query, user, requestId } = params;
  const log = logger.child({ module: "claims/notes", requestId });

  log.debug({ claimId, userId: user.id }, "list notes started");

  // 1. Validate claim exists
  await validateClaimForNote(claimId, "read", log);

  // 2. Fetch notes via shared service
  const result = await notesService.listNotes({
    entityType: "Claim",
    entityId: claimId,
    query,
    ...(requestId && { requestId }),
  });

  log.debug({ claimId, count: result.data.length }, "list notes completed");

  return result;
}

// =============================================================================
// Get Note
// =============================================================================

export async function getClaimNote(
  params: GetClaimNoteParams,
  context: audit.AuditContext
): Promise<Note> {
  const { claimId, noteId, user, requestId } = params;
  const log = logger.child({ module: "claims/notes", requestId });

  log.debug({ claimId, noteId, userId: user.id }, "get note started");

  // 1. Validate claim exists
  await validateClaimForNote(claimId, "read", log);

  // 2. Get note via shared service
  const note = await notesService.getNote(
    {
      noteId,
      entityType: "Claim",
      entityId: claimId,
      ...(requestId && { requestId }),
    },
    context
  );

  log.debug({ noteId }, "get note completed");

  return note;
}

// =============================================================================
// Create Note
// =============================================================================

export async function createClaimNote(
  params: CreateClaimNoteParams,
  context: audit.AuditContext
): Promise<Note> {
  const { claimId, request, user, requestId } = params;
  const log = logger.child({ module: "claims/notes", requestId });

  log.debug({ claimId, userId: user.id }, "create note started");

  // 1. Validate claim exists and not terminal
  await validateClaimForNote(claimId, "write", log);

  // 2. Create note via shared service
  const note = await notesService.createNote(
    {
      entityType: "Claim",
      entityId: claimId,
      content: request.content,
      isInternal: request.isInternal ?? false,
      userId: user.id,
      ...(requestId && { requestId }),
    },
    context
  );

  log.debug({ noteId: note.id }, "create note completed");

  return note;
}

// =============================================================================
// Update Note
// =============================================================================

export async function updateClaimNote(
  params: UpdateClaimNoteParams,
  context: audit.AuditContext
): Promise<Note> {
  const { claimId, noteId, updates, user, requestId } = params;
  const log = logger.child({ module: "claims/notes", requestId });

  log.debug({ claimId, noteId, userId: user.id }, "update note started");

  // 1. Validate claim exists and not terminal
  await validateClaimForNote(claimId, "write", log);

  // 2. Verify note belongs to this claim (getNote validates entityType/entityId)
  await notesService.getNote(
    {
      noteId,
      entityType: "Claim",
      entityId: claimId,
      ...(requestId && { requestId }),
    },
    context
  );

  // 3. Check if there are actual updates
  if (updates.content === undefined) {
    log.debug({ noteId }, "no fields to update");
    // Fetch and return existing note
    return notesService.getNote(
      {
        noteId,
        entityType: "Claim",
        entityId: claimId,
        ...(requestId && { requestId }),
      },
      context
    );
  }

  // 4. Update note via shared service
  const note = await notesService.updateNote(
    {
      noteId,
      content: updates.content,
      userId: user.id,
      ...(requestId && { requestId }),
    },
    context
  );

  log.debug({ noteId }, "update note completed");

  return note;
}

// =============================================================================
// Delete Note
// =============================================================================

export async function deleteClaimNote(
  params: DeleteClaimNoteParams,
  context: audit.AuditContext
): Promise<void> {
  const { claimId, noteId, user, requestId } = params;
  const log = logger.child({ module: "claims/notes", requestId });

  log.debug({ claimId, noteId, userId: user.id }, "delete note started");

  // 1. Validate claim exists and not terminal
  await validateClaimForNote(claimId, "write", log);

  // 2. Verify note belongs to this claim (getNote validates entityType/entityId)
  await notesService.getNote(
    {
      noteId,
      entityType: "Claim",
      entityId: claimId,
      ...(requestId && { requestId }),
    },
    context
  );

  // 3. Delete note via shared service
  await notesService.deleteNote(
    {
      noteId,
      userId: user.id,
      ...(requestId && { requestId }),
    },
    context
  );

  log.debug({ noteId }, "delete note completed");
}
