import { Router } from "express";
import {
  listClientAdminsQuerySchema,
  clientAdminParamsSchema,
  createClientAdminRequestSchema,
  updateClientAdminRequestSchema,
  type ListClientAdminsResponse,
  type ClientAdmin,
  type CreateClientAdminResponse,
} from "shared";
import { requireAuth } from "../../middleware/require-auth.js";
import { requirePermission } from "../../middleware/require-permission.js";
import { requireScope } from "../../middleware/require-scope.js";
import { validate } from "../../middleware/validate.js";
import { getAuditContext } from "../../services/audit/audit.js";
import * as service from "./service.js";
import { clientAdminClientsRouter } from "./clients/index.js";

const router = Router();

// =============================================================================
// Mount Nested Resources (claims pattern: nested routes FIRST)
// =============================================================================

router.use("/:clientAdminId/clients", clientAdminClientsRouter);

// =============================================================================
// GET / - List ClientAdmins
// =============================================================================

router.get(
  "/",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("clientAdmins:read"),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const query = listClientAdminsQuerySchema.parse(req.query);

      const result = await service.listClientAdmins({
        query,
        user: req.user!,
        ...(requestId && { requestId }),
      });

      const response: ListClientAdminsResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /:id - Get ClientAdmin
// =============================================================================

router.get(
  "/:id",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("clientAdmins:read"),
  validate({ params: clientAdminParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.getClientAdmin(
        {
          clientAdminId: req.params.id,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: ClientAdmin = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST / - Create ClientAdmin
// =============================================================================

router.post(
  "/",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("clientAdmins:create"),
  validate({ body: createClientAdminRequestSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.createClientAdmin(
        {
          request: req.body,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: CreateClientAdminResponse = { id: result.id };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// PATCH /:id - Update ClientAdmin
// =============================================================================

router.patch(
  "/:id",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("clientAdmins:edit"),
  validate({ params: clientAdminParamsSchema, body: updateClientAdminRequestSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.updateClientAdmin(
        {
          clientAdminId: req.params.id,
          updates: req.body,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: ClientAdmin = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// DELETE /:id - Delete ClientAdmin
// =============================================================================

router.delete(
  "/:id",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("clientAdmins:delete"),
  validate({ params: clientAdminParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      await service.deleteClientAdmin(
        {
          clientAdminId: req.params.id,
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
