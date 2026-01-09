import type { Prisma } from "@prisma/client";
import type {
  NoteEntityType,
  ListNotesQuery,
  ListNotesResponse,
  Note,
} from "shared";
import { db } from "../../config/db.js";
import { logger } from "../../lib/logger.js";
import { AppError } from "../../lib/errors.js";
import * as audit from "../audit/audit.js";

// =============================================================================
// Include Constants
// =============================================================================

const userProfileSelect = {
  id: true,
  employee: { select: { firstName: true, lastName: true } },
  agent: { select: { firstName: true, lastName: true } },
  clientAdmin: { select: { firstName: true, lastName: true } },
  affiliate: { select: { firstName: true, lastName: true } },
} as const;

const noteInclude = {
  createdBy: { select: userProfileSelect },
  updatedBy: { select: userProfileSelect },
} as const;

// =============================================================================
// Types
// =============================================================================

export interface ListNotesParams {
  entityType: NoteEntityType;
  entityId: string;
  query: ListNotesQuery;
  requestId?: string;
}

export interface GetNoteParams {
  noteId: string;
  entityType: NoteEntityType;
  entityId: string;
  requestId?: string;
}

export interface CreateNoteParams {
  entityType: NoteEntityType;
  entityId: string;
  content: string;
  isInternal: boolean;
  userId: string;
  requestId?: string;
}

export interface UpdateNoteParams {
  noteId: string;
  content: string;
  userId: string;
  requestId?: string;
}

export interface DeleteNoteParams {
  noteId: string;
  userId: string;
  requestId?: string;
}

// =============================================================================
// Mappers
// =============================================================================

type NoteData = NonNullable<Awaited<ReturnType<typeof findNoteById>>>;

function resolveUserName(user: NoteData["createdBy"]): string {
  const profile =
    user.employee ?? user.agent ?? user.clientAdmin ?? user.affiliate;
  return profile ? `${profile.firstName} ${profile.lastName}` : "Unknown";
}

function mapNoteToResponse(note: NoteData): Note {
  return {
    id: note.id,
    entityType: note.entityType as NoteEntityType,
    entityId: note.entityId,
    content: note.content,
    isInternal: note.isInternal,
    isEdited: note.isEdited,
    createdBy: {
      id: note.createdBy.id,
      name: resolveUserName(note.createdBy),
    },
    updatedBy: note.updatedBy
      ? {
          id: note.updatedBy.id,
          name: resolveUserName(note.updatedBy),
        }
      : null,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

// =============================================================================
// Repository Functions (inline)
// =============================================================================

async function findNotes(params: {
  where: Prisma.NoteWhereInput;
  skip: number;
  take: number;
  orderBy: Prisma.NoteOrderByWithRelationInput[];
}) {
  return db.note.findMany({
    where: params.where,
    skip: params.skip,
    take: params.take,
    orderBy: params.orderBy,
    include: noteInclude,
  });
}

async function countNotes(where: Prisma.NoteWhereInput): Promise<number> {
  return db.note.count({ where });
}

async function findNoteById(id: string, entityType?: string, entityId?: string) {
  return db.note.findFirst({
    where: {
      id,
      deletedAt: null,
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
    },
    include: noteInclude,
  });
}

// =============================================================================
// List Notes
// =============================================================================

export async function listNotes(
  params: ListNotesParams
): Promise<ListNotesResponse> {
  const { entityType, entityId, query, requestId } = params;
  const log = logger.child({ module: "notes", requestId });

  log.debug({ entityType, entityId }, "list notes started");

  const where: Prisma.NoteWhereInput = {
    entityType,
    entityId,
    deletedAt: null,
    // Filter internal notes unless caller explicitly requests them
    ...(!query.includeInternal && { isInternal: false }),
  };

  const orderBy: Prisma.NoteOrderByWithRelationInput[] = [
    { createdAt: query.sortOrder },
    { id: "asc" },
  ];

  const [notes, total] = await Promise.all([
    findNotes({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy,
    }),
    countNotes(where),
  ]);

  log.debug({ count: notes.length, total }, "list notes completed");

  return {
    data: notes.map(mapNoteToResponse),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

// =============================================================================
// Get Note
// =============================================================================

export async function getNote(
  params: GetNoteParams,
  context: audit.AuditContext
): Promise<Note> {
  const { noteId, entityType, entityId, requestId } = params;
  const log = logger.child({ module: "notes", requestId });

  log.debug({ noteId, entityType, entityId }, "get note started");

  const note = await findNoteById(noteId, entityType, entityId);
  if (!note) {
    log.debug({ noteId, entityType, entityId }, "note not found");
    throw AppError.notFound("Note");
  }

  audit.log(
    {
      action: audit.AuditActions.READ,
      resource: "Note",
      resourceId: note.id,
      metadata: { entityType, entityId },
    },
    context
  );

  log.debug({ noteId }, "get note completed");

  return mapNoteToResponse(note);
}

// =============================================================================
// Create Note
// =============================================================================

export async function createNote(
  params: CreateNoteParams,
  context: audit.AuditContext
): Promise<Note> {
  const { entityType, entityId, content, isInternal, userId, requestId } = params;
  const log = logger.child({ module: "notes", requestId });

  log.debug({ entityType, entityId, userId }, "create note started");

  const note = await db.note.create({
    data: {
      entityType,
      entityId,
      content,
      isInternal,
      createdById: userId,
    },
    include: noteInclude,
  });

  log.info({ noteId: note.id, entityType, entityId }, "note created");

  audit.log(
    {
      action: audit.AuditActions.CREATE,
      resource: "Note",
      resourceId: note.id,
      newValue: { content, isInternal },
      metadata: { entityType, entityId },
    },
    context
  );

  log.debug({ noteId: note.id }, "create note completed");

  return mapNoteToResponse(note);
}

// =============================================================================
// Update Note
// =============================================================================

export async function updateNote(
  params: UpdateNoteParams,
  context: audit.AuditContext
): Promise<Note> {
  const { noteId, content, userId, requestId } = params;
  const log = logger.child({ module: "notes", requestId });

  log.debug({ noteId, userId }, "update note started");

  // Find existing note
  const existing = await findNoteById(noteId);
  if (!existing) {
    log.debug({ noteId }, "note not found");
    throw AppError.notFound("Note");
  }

  // Update note
  const updated = await db.note.update({
    where: { id: noteId },
    data: {
      content,
      isEdited: true,
      updatedById: userId,
    },
    include: noteInclude,
  });

  log.info({ noteId }, "note updated");

  audit.log(
    {
      action: audit.AuditActions.UPDATE,
      resource: "Note",
      resourceId: noteId,
      oldValue: { content: existing.content },
      newValue: { content },
      metadata: { entityType: existing.entityType, entityId: existing.entityId },
    },
    context
  );

  log.debug({ noteId }, "update note completed");

  return mapNoteToResponse(updated);
}

// =============================================================================
// Delete Note (Soft Delete)
// =============================================================================

export async function deleteNote(
  params: DeleteNoteParams,
  context: audit.AuditContext
): Promise<void> {
  const { noteId, userId, requestId } = params;
  const log = logger.child({ module: "notes", requestId });

  log.debug({ noteId, userId }, "delete note started");

  // Find existing note
  const existing = await findNoteById(noteId);
  if (!existing) {
    log.debug({ noteId }, "note not found");
    throw AppError.notFound("Note");
  }

  // Soft delete
  await db.note.update({
    where: { id: noteId },
    data: {
      deletedAt: new Date(),
      deletedById: userId,
    },
  });

  log.info({ noteId, entityType: existing.entityType, entityId: existing.entityId }, "note deleted");

  audit.log(
    {
      action: audit.AuditActions.DELETE,
      resource: "Note",
      resourceId: noteId,
      oldValue: { content: existing.content, isInternal: existing.isInternal },
      metadata: { entityType: existing.entityType, entityId: existing.entityId },
    },
    context
  );

  log.debug({ noteId }, "delete note completed");
}
