import { Router } from "express";
import {
  claimNoteListParamsSchema,
  claimNoteParamsSchema,
  listNotesQuerySchema,
  createNoteRequestSchema,
  updateNoteRequestSchema,
  type ListNotesResponse,
  type Note,
} from "shared";
import { requireAuth } from "../../../middleware/require-auth.js";
import { requirePermission } from "../../../middleware/require-permission.js";
import { requireScope } from "../../../middleware/require-scope.js";
import { validate } from "../../../middleware/validate.js";
import { getAuditContext } from "../../../services/audit/audit.js";
import * as service from "./service.js";

const router = Router({ mergeParams: true });

// =============================================================================
// GET / - List Notes for a Claim
// =============================================================================

router.get(
  "/",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:read"),
  validate({ params: claimNoteListParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const query = listNotesQuerySchema.parse(req.query);

      const result = await service.listClaimNotes({
        claimId: req.params.id,
        query,
        user: req.user!,
        ...(requestId && { requestId }),
      });

      const response: ListNotesResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /:noteId - Get Single Note
// =============================================================================

router.get(
  "/:noteId",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:read"),
  validate({ params: claimNoteParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.getClaimNote(
        {
          claimId: req.params.id,
          noteId: req.params.noteId,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: Note = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST / - Create Note
// =============================================================================

router.post(
  "/",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:edit"),
  validate({ params: claimNoteListParamsSchema, body: createNoteRequestSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.createClaimNote(
        {
          claimId: req.params.id,
          request: req.body,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: Note = result;
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// PATCH /:noteId - Update Note
// =============================================================================

router.patch(
  "/:noteId",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:edit"),
  validate({ params: claimNoteParamsSchema, body: updateNoteRequestSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.updateClaimNote(
        {
          claimId: req.params.id,
          noteId: req.params.noteId,
          updates: req.body,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: Note = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// DELETE /:noteId - Delete Note
// =============================================================================

router.delete(
  "/:noteId",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:edit"),
  validate({ params: claimNoteParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      await service.deleteClaimNote(
        {
          claimId: req.params.id,
          noteId: req.params.noteId,
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
