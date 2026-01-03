import { Router } from "express";
import {
  claimFileListParamsSchema,
  claimFileParamsSchema,
  uploadClaimFileRequestSchema,
  type ListClaimFilesResponse,
  type ClaimFile,
  type UploadClaimFileResponse,
  type DownloadClaimFileResponse,
} from "shared";
import { requireAuth } from "../../../middleware/require-auth.js";
import { requirePermission } from "../../../middleware/require-permission.js";
import { requireScope } from "../../../middleware/require-scope.js";
import { validate } from "../../../middleware/validate.js";
import { getAuditContext } from "../../../services/audit/audit.js";
import * as service from "./service.js";

const router = Router({ mergeParams: true });

// =============================================================================
// GET / - List Files for a Claim
// =============================================================================

router.get(
  "/",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:read"),
  validate({ params: claimFileListParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;

      const result = await service.listClaimFiles({
        claimId: req.params.id,
        user: req.user!,
        ...(requestId && { requestId }),
      });

      const response: ListClaimFilesResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /upload - Upload File to Existing Claim
// =============================================================================

router.post(
  "/upload",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:edit"),
  validate({ params: claimFileListParamsSchema, body: uploadClaimFileRequestSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.uploadClaimFile(
        {
          claimId: req.params.id,
          request: req.body,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: UploadClaimFileResponse = result;
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /:fileId/confirm - Confirm File Upload
// =============================================================================

router.post(
  "/:fileId/confirm",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:edit"),
  validate({ params: claimFileParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.confirmClaimFile(
        {
          claimId: req.params.id,
          fileId: req.params.fileId,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: ClaimFile = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /:fileId/download - Get Download URL
// =============================================================================

router.get(
  "/:fileId/download",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:read"),
  validate({ params: claimFileParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.downloadClaimFile(
        {
          claimId: req.params.id,
          fileId: req.params.fileId,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: DownloadClaimFileResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// DELETE /:fileId - Delete File
// =============================================================================

router.delete(
  "/:fileId",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:edit"),
  validate({ params: claimFileParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      await service.deleteClaimFile(
        {
          claimId: req.params.id,
          fileId: req.params.fileId,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
