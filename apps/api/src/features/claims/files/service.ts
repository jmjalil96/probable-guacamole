import type { Logger } from "pino";
import type {
  CreateClaimFileUploadRequest,
  UploadClaimFileRequest,
  ListClaimFilesResponse,
  ClaimFile,
  UploadClaimFileResponse,
  DownloadClaimFileResponse,
} from "shared";
import { CLAIM_TERMINAL_STATUSES } from "shared";
import { logger } from "../../../lib/logger.js";
import { AppError } from "../../../lib/errors.js";
import * as audit from "../../../services/audit/audit.js";
import * as storage from "../../../services/storage/service.js";
import * as repo from "./repository.js";

// =============================================================================
// Types
// =============================================================================

export interface CreateClaimFileUploadParams {
  request: CreateClaimFileUploadRequest;
  userId: string;
  requestId?: string;
}

export interface CreateClaimFileUploadResult {
  pendingUploadId: string;
  uploadUrl: string;
  expiresAt: Date;
}

// =============================================================================
// Service Functions
// =============================================================================

export async function createClaimFileUpload(
  params: CreateClaimFileUploadParams,
  context: audit.AuditContext
): Promise<CreateClaimFileUploadResult> {
  const { request, userId, requestId } = params;
  const log = logger.child({ module: "claims/files", requestId });

  log.debug(
    { fileName: request.fileName, userId },
    "claim file upload started"
  );

  const result = await storage.createPendingUpload({
    userId,
    sessionKey: request.sessionKey,
    fileName: request.fileName,
    contentType: request.contentType,
    fileSize: request.fileSize,
    entityType: "Claim",
    ...(request.category && { category: request.category }),
  });

  audit.log(
    {
      action: audit.AuditActions.FILE_UPLOAD_INITIATED,
      resource: "PendingUpload",
      resourceId: result.pendingUpload.id,
      metadata: {
        fileName: request.fileName,
        fileSize: request.fileSize,
        contentType: request.contentType,
        category: request.category,
      },
    },
    context
  );

  log.debug(
    { pendingUploadId: result.pendingUpload.id },
    "claim file upload initiated"
  );

  return {
    pendingUploadId: result.pendingUpload.id,
    uploadUrl: result.uploadUrl,
    expiresAt: result.expiresAt,
  };
}

// =============================================================================
// Types (existing claim file operations)
// =============================================================================

export interface ListClaimFilesParams {
  claimId: string;
  user: { id: string };
  requestId?: string;
}

export interface UploadClaimFileParams {
  claimId: string;
  request: UploadClaimFileRequest;
  user: { id: string };
  requestId?: string;
}

export interface ConfirmClaimFileParams {
  claimId: string;
  fileId: string;
  user: { id: string };
  requestId?: string;
}

export interface DownloadClaimFileParams {
  claimId: string;
  fileId: string;
  user: { id: string };
  requestId?: string;
}

export interface DeleteClaimFileParams {
  claimId: string;
  fileId: string;
  user: { id: string };
  requestId?: string;
}

// =============================================================================
// Mappers
// =============================================================================

type FileData = NonNullable<Awaited<ReturnType<typeof repo.findFileById>>>;

function resolveUserName(user: FileData["createdBy"]): string {
  const profile =
    user.employee ?? user.agent ?? user.clientAdmin ?? user.affiliate;
  return profile ? `${profile.firstName} ${profile.lastName}` : "Unknown";
}

function mapFileToResponse(file: FileData, claimId: string): ClaimFile {
  return {
    id: file.id,
    claimId,
    fileName: file.fileName,
    fileSize: file.fileSize,
    contentType: file.contentType,
    category: file.category,
    status: file.status,
    createdBy: {
      id: file.createdBy.id,
      name: resolveUserName(file.createdBy),
    },
    createdAt: file.createdAt.toISOString(),
  };
}

// =============================================================================
// Validation Helpers
// =============================================================================

async function validateClaimForFile(
  claimId: string,
  operation: "read" | "write",
  log: Logger
): Promise<void> {
  // 1. Verify claim exists
  const claim = await repo.findClaimById(claimId);
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
      `Cannot modify files for claim in ${claim.status} status`
    );
  }
}

// =============================================================================
// List Files
// =============================================================================

export async function listClaimFiles(
  params: ListClaimFilesParams
): Promise<ListClaimFilesResponse> {
  const { claimId, user, requestId } = params;
  const log = logger.child({ module: "claims/files", requestId });

  log.debug({ claimId, userId: user.id }, "list files started");

  // 1. Validate claim exists
  await validateClaimForFile(claimId, "read", log);

  // 2. Fetch files
  const files = await repo.findFilesByClaimId(claimId);

  log.debug({ claimId, count: files.length }, "list files completed");

  return {
    data: files.map((f) => mapFileToResponse(f, claimId)),
  };
}

// =============================================================================
// Upload File
// =============================================================================

export async function uploadClaimFile(
  params: UploadClaimFileParams,
  context: audit.AuditContext
): Promise<UploadClaimFileResponse> {
  const { claimId, request, user, requestId } = params;
  const log = logger.child({ module: "claims/files", requestId });

  log.debug({ claimId, userId: user.id }, "upload file started");

  // 1. Validate claim exists and not terminal
  await validateClaimForFile(claimId, "write", log);

  // 2. Create file upload via storage service
  const result = await storage.uploadToEntity({
    entityType: "Claim",
    entityId: claimId,
    fileName: request.fileName,
    contentType: request.contentType,
    fileSize: request.fileSize,
    userId: user.id,
    ...(request.category && { category: request.category }),
  });

  log.info({ fileId: result.file.id, claimId }, "file upload created");

  // 3. Audit log
  audit.log(
    {
      action: audit.AuditActions.FILE_UPLOAD_INITIATED,
      resource: "ClaimFile",
      resourceId: result.file.id,
      newValue: {
        fileName: request.fileName,
        fileSize: request.fileSize,
        contentType: request.contentType,
        category: request.category,
      },
      metadata: { claimId },
    },
    context
  );

  log.debug({ fileId: result.file.id }, "upload file completed");

  return {
    fileId: result.file.id,
    uploadUrl: result.uploadUrl,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min expiry
  };
}

// =============================================================================
// Confirm File Upload
// =============================================================================

export async function confirmClaimFile(
  params: ConfirmClaimFileParams,
  context: audit.AuditContext
): Promise<ClaimFile> {
  const { claimId, fileId, user, requestId } = params;
  const log = logger.child({ module: "claims/files", requestId });

  log.debug({ claimId, fileId, userId: user.id }, "confirm file started");

  // 1. Validate claim exists and not terminal
  await validateClaimForFile(claimId, "write", log);

  // 2. Verify file belongs to this claim
  const existingFile = await repo.findFileById(fileId, claimId);
  if (!existingFile) {
    log.debug({ fileId, claimId }, "file not found");
    throw AppError.notFound("File");
  }

  // 3. Confirm upload via storage service
  const confirmedFile = await storage.confirmEntityUpload(fileId);

  log.info({ fileId, claimId }, "file confirmed");

  // 4. Audit log
  audit.log(
    {
      action: audit.AuditActions.UPDATE,
      resource: "ClaimFile",
      resourceId: fileId,
      oldValue: { status: existingFile.status },
      newValue: { status: confirmedFile.status },
      metadata: { claimId },
    },
    context
  );

  log.debug({ fileId }, "confirm file completed");

  // Re-fetch with includes for response
  const file = await repo.findFileById(fileId, claimId);
  if (!file) {
    throw AppError.notFound("File");
  }

  return mapFileToResponse(file, claimId);
}

// =============================================================================
// Download File
// =============================================================================

export async function downloadClaimFile(
  params: DownloadClaimFileParams,
  context: audit.AuditContext
): Promise<DownloadClaimFileResponse> {
  const { claimId, fileId, user, requestId } = params;
  const log = logger.child({ module: "claims/files", requestId });

  log.debug({ claimId, fileId, userId: user.id }, "download file started");

  // 1. Validate claim exists
  await validateClaimForFile(claimId, "read", log);

  // 2. Verify file belongs to this claim
  const file = await repo.findFileById(fileId, claimId);
  if (!file) {
    log.debug({ fileId, claimId }, "file not found");
    throw AppError.notFound("File");
  }

  // 3. Get download URL via storage service
  const expiresInSeconds = 60 * 60; // 1 hour
  const downloadUrl = await storage.getDownloadUrl(fileId, expiresInSeconds);

  // 4. Audit log (fire-and-forget)
  audit.log(
    {
      action: audit.AuditActions.READ,
      resource: "ClaimFile",
      resourceId: fileId,
      metadata: { claimId },
    },
    context
  );

  log.debug({ fileId }, "download file completed");

  return {
    downloadUrl,
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
  };
}

// =============================================================================
// Delete File
// =============================================================================

export async function deleteClaimFile(
  params: DeleteClaimFileParams,
  context: audit.AuditContext
): Promise<void> {
  const { claimId, fileId, user, requestId } = params;
  const log = logger.child({ module: "claims/files", requestId });

  log.debug({ claimId, fileId, userId: user.id }, "delete file started");

  // 1. Validate claim exists and not terminal
  await validateClaimForFile(claimId, "write", log);

  // 2. Verify file belongs to this claim
  const file = await repo.findFileById(fileId, claimId);
  if (!file) {
    log.debug({ fileId, claimId }, "file not found");
    throw AppError.notFound("File");
  }

  // 3. Delete file via storage service (soft delete)
  await storage.deleteFile(fileId);

  log.info({ fileId, claimId }, "file deleted");

  // 4. Audit log
  audit.log(
    {
      action: audit.AuditActions.DELETE,
      resource: "ClaimFile",
      resourceId: fileId,
      oldValue: {
        fileName: file.fileName,
        fileSize: file.fileSize,
        contentType: file.contentType,
        category: file.category,
      },
      metadata: { claimId },
    },
    context
  );

  log.debug({ fileId }, "delete file completed");
}
