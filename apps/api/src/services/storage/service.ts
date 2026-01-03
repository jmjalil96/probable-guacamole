import { createId } from "@paralleldrive/cuid2";
import { db } from "../../config/db.js";
import { AppError } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import * as r2 from "./r2.js";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const PENDING_UPLOAD_TTL_HOURS = 24;

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/json",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function validateContentType(contentType: string): void {
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw AppError.badRequest(`Content type not allowed: ${contentType}`, {
      code: "INVALID_CONTENT_TYPE",
    });
  }
}

function validateFileSize(size: number): void {
  if (size > MAX_FILE_SIZE_BYTES) {
    throw AppError.badRequest(
      `File size exceeds maximum of ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`,
      { code: "FILE_TOO_LARGE" }
    );
  }
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 255);
}

function normalizeContentType(contentType?: string | null): string | null {
  if (!contentType) return null;
  return contentType.split(";")[0]?.trim().toLowerCase() ?? null;
}

function validateStoredObject(
  metadata: { contentLength?: number; contentType?: string },
  expected: { contentType: string; fileSize: number }
): void {
  const expectedType = normalizeContentType(expected.contentType);
  const actualType = normalizeContentType(metadata.contentType);

  if (actualType && expectedType && actualType !== expectedType) {
    throw AppError.badRequest("Uploaded file content type mismatch", {
      code: "FILE_CONTENT_TYPE_MISMATCH",
    });
  }

  if (
    metadata.contentLength != null &&
    metadata.contentLength !== expected.fileSize
  ) {
    throw AppError.badRequest("Uploaded file size mismatch", {
      code: "FILE_SIZE_MISMATCH",
    });
  }
}

// =============================================================================
// Pre-record upload flow
// =============================================================================

export type CreatePendingUploadInput = {
  userId: string;
  sessionKey: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  entityType?: string;
  category?: string;
};

export async function createPendingUpload(input: CreatePendingUploadInput) {
  validateContentType(input.contentType);
  validateFileSize(input.fileSize);

  const id = createId();
  const sanitizedName = sanitizeFileName(input.fileName);
  const fileKey = `uploads/${id}`;
  const expiresAt = new Date(Date.now() + PENDING_UPLOAD_TTL_HOURS * 60 * 60 * 1000);

  const uploadUrl = await r2.presignPutUrl(
    fileKey,
    input.contentType,
    input.fileSize
  );

  const pendingUpload = await db.pendingUpload.create({
    data: {
      id,
      userId: input.userId,
      sessionKey: input.sessionKey,
      fileKey,
      fileName: sanitizedName,
      fileSize: input.fileSize,
      contentType: input.contentType,
      entityType: input.entityType ?? null,
      category: input.category ?? null,
      expiresAt,
    },
  });

  return { pendingUpload, uploadUrl, expiresAt };
}

export async function confirmUpload(pendingUploadId: string) {
  const pendingUpload = await db.pendingUpload.findUnique({
    where: { id: pendingUploadId },
  });

  if (!pendingUpload) {
    throw AppError.notFound("Pending upload");
  }

  if (pendingUpload.expiresAt <= new Date()) {
    throw AppError.badRequest("Pending upload expired", {
      code: "PENDING_UPLOAD_EXPIRED",
    });
  }

  const metadata = await r2.headObject(pendingUpload.fileKey);
  if (!metadata) {
    throw AppError.badRequest("File not uploaded yet", {
      code: "FILE_NOT_UPLOADED",
    });
  }

  validateStoredObject(metadata, {
    contentType: pendingUpload.contentType,
    fileSize: pendingUpload.fileSize,
  });

  return pendingUpload;
}

export type MigrateToEntityInput = {
  entityType: string;
  entityId: string;
  category?: string;
  path?: string;
};

export async function migrateToEntity(
  pendingUploadId: string,
  input: MigrateToEntityInput,
  userId: string
) {
  // 1. Fetch pending upload
  const pendingUpload = await db.pendingUpload.findUnique({
    where: { id: pendingUploadId },
  });

  if (!pendingUpload) {
    throw AppError.notFound("Pending upload");
  }

  // 2. Validate ownership
  if (pendingUpload.userId !== userId) {
    throw AppError.forbidden("Not authorized to access this upload");
  }

  // 3. Validate entityType if pre-declared
  if (
    pendingUpload.entityType &&
    pendingUpload.entityType !== input.entityType
  ) {
    throw AppError.badRequest("Entity type mismatch", {
      code: "ENTITY_TYPE_MISMATCH",
    });
  }

  if (pendingUpload.expiresAt <= new Date()) {
    throw AppError.badRequest("Pending upload expired", {
      code: "PENDING_UPLOAD_EXPIRED",
    });
  }

  // 4. Verify file exists in R2
  const metadata = await r2.headObject(pendingUpload.fileKey);
  if (!metadata) {
    throw AppError.badRequest("File not found in storage", {
      code: "FILE_NOT_IN_STORAGE",
    });
  }

  validateStoredObject(metadata, {
    contentType: pendingUpload.contentType,
    fileSize: pendingUpload.fileSize,
  });

  // 5. Generate permanent key and copy
  const fileId = createId();
  const permanentKey = `files/${fileId}`;

  await r2.copyObject(pendingUpload.fileKey, permanentKey);

  // 6. DB transaction: create File + delete PendingUpload
  let file: Awaited<ReturnType<typeof db.file.create>>;
  try {
    file = await db.$transaction(async (tx) => {
      const file = await tx.file.create({
        data: {
          id: fileId,
          entityType: input.entityType,
          entityId: input.entityId,
          fileKey: permanentKey,
          fileName: pendingUpload.fileName,
          fileSize: pendingUpload.fileSize,
          contentType: pendingUpload.contentType,
          category: input.category ?? pendingUpload.category ?? null,
          path: input.path ?? null,
          status: "READY",
          createdById: pendingUpload.userId,
        },
      });

      await tx.pendingUpload.delete({
        where: { id: pendingUploadId },
      });

      return file;
    });
  } catch (err) {
    r2.deleteObject(permanentKey).catch((cleanupErr) => {
      logger.warn(
        { err: cleanupErr, fileKey: permanentKey },
        "Failed to cleanup permanent file after transaction failure"
      );
    });
    throw err;
  }

  // 5. Delete temp file (best effort)
  r2.deleteObject(pendingUpload.fileKey).catch((err) => {
    logger.warn({ err, fileKey: pendingUpload.fileKey }, "Failed to delete temp file");
  });

  return file;
}

// =============================================================================
// Existing record upload flow
// =============================================================================

export type UploadToEntityInput = {
  entityType: string;
  entityId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  userId: string;
  category?: string;
  path?: string;
};

export async function uploadToEntity(input: UploadToEntityInput) {
  validateContentType(input.contentType);
  validateFileSize(input.fileSize);

  const id = createId();
  const sanitizedName = sanitizeFileName(input.fileName);
  const fileKey = `files/${id}`;

  const uploadUrl = await r2.presignPutUrl(
    fileKey,
    input.contentType,
    input.fileSize
  );

  const file = await db.file.create({
    data: {
      id,
      entityType: input.entityType,
      entityId: input.entityId,
      fileKey,
      fileName: sanitizedName,
      fileSize: input.fileSize,
      contentType: input.contentType,
      category: input.category ?? null,
      path: input.path ?? null,
      status: "PENDING",
      createdById: input.userId,
    },
  });

  return { file, uploadUrl };
}

export async function confirmEntityUpload(fileId: string) {
  const file = await db.file.findUnique({
    where: { id: fileId },
  });

  if (!file) {
    throw AppError.notFound("File");
  }

  if (file.deletedAt) {
    throw AppError.notFound("File");
  }

  if (file.status === "READY") {
    return file;
  }

  const metadata = await r2.headObject(file.fileKey);
  if (!metadata) {
    throw AppError.badRequest("File not uploaded yet", {
      code: "FILE_NOT_UPLOADED",
    });
  }

  validateStoredObject(metadata, {
    contentType: file.contentType,
    fileSize: file.fileSize,
  });

  return db.file.update({
    where: { id: fileId },
    data: {
      status: "READY",
      processedAt: new Date(),
    },
  });
}

// =============================================================================
// Shared operations
// =============================================================================

export async function getDownloadUrl(fileId: string, expiresIn?: number) {
  const file = await db.file.findUnique({
    where: { id: fileId },
  });

  if (!file || file.deletedAt) {
    throw AppError.notFound("File");
  }

  if (file.status !== "READY") {
    throw AppError.badRequest("File not ready", {
      code: "FILE_NOT_READY",
    });
  }

  return r2.presignGetUrl(file.fileKey, expiresIn);
}

export async function deleteFile(fileId: string) {
  const file = await db.file.findUnique({
    where: { id: fileId },
  });

  if (!file) {
    throw AppError.notFound("File");
  }

  if (file.deletedAt) {
    return; // Already deleted
  }

  // Soft delete in DB
  await db.file.update({
    where: { id: fileId },
    data: { deletedAt: new Date() },
  });

  // Delete from R2 (best effort)
  r2.deleteObject(file.fileKey).catch((err) => {
    logger.warn({ err, fileKey: file.fileKey }, "Failed to delete file from R2");
  });
}

export async function getFilesByEntity(entityType: string, entityId: string) {
  return db.file.findMany({
    where: {
      entityType,
      entityId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPendingUploadsBySession(
  userId: string,
  sessionKey: string
) {
  return db.pendingUpload.findMany({
    where: {
      userId,
      sessionKey,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
}
