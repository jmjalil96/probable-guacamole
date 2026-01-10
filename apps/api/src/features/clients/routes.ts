import { Router } from "express";
import {
  listClientsQuerySchema,
  clientParamsSchema,
  createClientRequestSchema,
  updateClientRequestSchema,
  type ListClientsResponse,
  type Client,
  type CreateClientResponse,
} from "shared";
import { requireAuth } from "../../middleware/require-auth.js";
import { requirePermission } from "../../middleware/require-permission.js";
import { requireScope } from "../../middleware/require-scope.js";
import { validate } from "../../middleware/validate.js";
import { getAuditContext } from "../../services/audit/audit.js";
import * as service from "./service.js";

const router = Router();

// =============================================================================
// GET / - List Clients
// =============================================================================

router.get(
  "/",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("clients:read"),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const query = listClientsQuerySchema.parse(req.query);

      const result = await service.listClients({
        query,
        user: req.user!,
        ...(requestId && { requestId }),
      });

      const response: ListClientsResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /:id - Get Client
// =============================================================================

router.get(
  "/:id",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("clients:read"),
  validate({ params: clientParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.getClient(
        {
          clientId: req.params.id,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: Client = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST / - Create Client
// =============================================================================

router.post(
  "/",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("clients:create"),
  validate({ body: createClientRequestSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.createClient(
        {
          request: req.body,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: CreateClientResponse = { id: result.id };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// PATCH /:id - Update Client
// =============================================================================

router.patch(
  "/:id",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("clients:edit"),
  validate({ params: clientParamsSchema, body: updateClientRequestSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.updateClient(
        {
          clientId: req.params.id,
          updates: req.body,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: Client = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// DELETE /:id - Delete Client
// =============================================================================

router.delete(
  "/:id",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("clients:delete"),
  validate({ params: clientParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      await service.deleteClient(
        {
          clientId: req.params.id,
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
