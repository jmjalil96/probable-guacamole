import { Router, type Request } from "express";
import {
  createInvitationRequestSchema,
  validateInvitationParamsSchema,
  acceptInvitationRequestSchema,
  resendInvitationParamsSchema,
  type CreateInvitationResponse,
  type ValidateInvitationResponse,
  type AcceptInvitationResponse,
  type ResendInvitationResponse,
} from "shared";
import { validate } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { requirePermission } from "../../middleware/require-permission.js";
import { getAuditContext } from "../../services/audit/audit.js";
import { setSessionCookie } from "../auth/utils.js";
import * as service from "./service.js";

const router = Router();

// =============================================================================
// POST / - Create Invitation
// =============================================================================

router.post(
  "/",
  requireAuth,
  requirePermission("users:invite"),
  validate({ body: createInvitationRequestSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.createInvitation(
        {
          request: req.body,
          createdById: req.user!.id,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: CreateInvitationResponse = {
        invitationId: result.invitationId,
        expiresAt: result.expiresAt.toISOString(),
      };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /:token - Validate Invitation Token
// =============================================================================

router.get(
  "/:token",
  validate({ params: validateInvitationParamsSchema }),
  async (req, res, next) => {
    try {
      const result = await service.validateInvitation(req.params.token);

      const response: ValidateInvitationResponse = {
        expiresAt: result.expiresAt.toISOString(),
        role: result.role,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /accept - Accept Invitation
// =============================================================================

router.post(
  "/accept",
  validate({ body: acceptInvitationRequestSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req as Request, res);

      const result = await service.acceptInvitation(
        {
          token: req.body.token,
          password: req.body.password,
          ip: req.ip ?? null,
          userAgent: req.get("user-agent") ?? null,
          ...(requestId && { requestId }),
        },
        context
      );

      setSessionCookie(res, result.sessionToken, result.expiresAt);

      const response: AcceptInvitationResponse = { success: true };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /:id/resend - Resend Invitation
// =============================================================================

router.post(
  "/:id/resend",
  requireAuth,
  requirePermission("users:invite"),
  validate({ params: resendInvitationParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.resendInvitation(
        {
          invitationId: req.params.id,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: ResendInvitationResponse = {
        invitationId: result.invitationId,
        expiresAt: result.expiresAt.toISOString(),
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
