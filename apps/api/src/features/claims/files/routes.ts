import { Router } from "express";
import {
  createClaimFileUploadRequestSchema,
  type CreateClaimFileUploadResponse,
} from "shared";
import { requireAuth } from "../../../middleware/require-auth.js";
import { requirePermission } from "../../../middleware/require-permission.js";
import { validate } from "../../../middleware/validate.js";
import { getAuditContext } from "../../../services/audit/audit.js";
import * as service from "./service.js";

const router = Router();

// =============================================================================
// POST /upload - Create Pending Upload for Claim File
// =============================================================================

router.post(
  "/upload",
  requireAuth,
  requirePermission("claims:create"),
  validate({ body: createClaimFileUploadRequestSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.createClaimFileUpload(
        {
          request: req.body,
          userId: req.user!.id,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: CreateClaimFileUploadResponse = {
        pendingUploadId: result.pendingUploadId,
        uploadUrl: result.uploadUrl,
        expiresAt: result.expiresAt.toISOString(),
      };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
