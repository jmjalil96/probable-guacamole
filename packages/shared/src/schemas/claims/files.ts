import { z } from "zod";
import { userRefSchema } from "../../lib/common.js";

// =============================================================================
// Enums
// =============================================================================

export const claimFileCategorySchema = z.enum([
  "invoice",
  "receipt",
  "medical_report",
  "prescription",
  "id_document",
  "other",
]);

export type ClaimFileCategory = z.infer<typeof claimFileCategorySchema>;

// =============================================================================
// Request Schemas
// =============================================================================

export const createClaimFileUploadRequestSchema = z.object({
  sessionKey: z.string().min(1),
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
  fileSize: z.number().int().positive(),
  category: claimFileCategorySchema.optional(),
});

export type CreateClaimFileUploadRequest = z.infer<
  typeof createClaimFileUploadRequestSchema
>;

// =============================================================================
// Response Schemas
// =============================================================================

export const createClaimFileUploadResponseSchema = z.object({
  pendingUploadId: z.string(),
  uploadUrl: z.string(),
  expiresAt: z.string(),
});

export type CreateClaimFileUploadResponse = z.infer<
  typeof createClaimFileUploadResponseSchema
>;

// =============================================================================
// Params Schemas (for existing claim file operations)
// =============================================================================

export const claimFileListParamsSchema = z.object({
  id: z.string().min(1), // claimId from parent router
});

export type ClaimFileListParams = z.infer<typeof claimFileListParamsSchema>;

export const claimFileParamsSchema = z.object({
  id: z.string().min(1), // claimId from parent router
  fileId: z.string().min(1),
});

export type ClaimFileParams = z.infer<typeof claimFileParamsSchema>;

// =============================================================================
// Request Schemas (for existing claim file operations)
// =============================================================================

export const uploadClaimFileRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
  fileSize: z.number().int().positive(),
  category: claimFileCategorySchema.optional(),
});

export type UploadClaimFileRequest = z.infer<
  typeof uploadClaimFileRequestSchema
>;

// =============================================================================
// Response Schemas (for existing claim file operations)
// =============================================================================

export const claimFileSchema = z.object({
  id: z.string(),
  claimId: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  contentType: z.string(),
  category: z.string().nullable(),
  status: z.string(),
  createdBy: userRefSchema,
  createdAt: z.string(),
});

export type ClaimFile = z.infer<typeof claimFileSchema>;

export const listClaimFilesResponseSchema = z.object({
  data: z.array(claimFileSchema),
});

export type ListClaimFilesResponse = z.infer<
  typeof listClaimFilesResponseSchema
>;

export const uploadClaimFileResponseSchema = z.object({
  fileId: z.string(),
  uploadUrl: z.string(),
  expiresAt: z.string(),
});

export type UploadClaimFileResponse = z.infer<
  typeof uploadClaimFileResponseSchema
>;

export const downloadClaimFileResponseSchema = z.object({
  downloadUrl: z.string(),
  expiresAt: z.string(),
});

export type DownloadClaimFileResponse = z.infer<
  typeof downloadClaimFileResponseSchema
>;
