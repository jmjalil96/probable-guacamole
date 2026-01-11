import { Router } from "express";
import {
  clientAdminClientsListParamsSchema,
  clientAdminClientParamsSchema,
  listAvailableClientsQuerySchema,
  type ListClientAdminClientsResponse,
  type AssignClientAdminClientResponse,
  type ListAvailableClientsResponse,
} from "shared";
import { requireAuth } from "../../../middleware/require-auth.js";
import { requirePermission } from "../../../middleware/require-permission.js";
import { requireScope } from "../../../middleware/require-scope.js";
import { validate } from "../../../middleware/validate.js";
import { getAuditContext } from "../../../services/audit/audit.js";
import * as service from "./service.js";

const router = Router({ mergeParams: true });

// =============================================================================
// GET / - List ClientAdmin Clients
// =============================================================================

router.get(
  "/",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("clientAdmins:read"),
  validate({ params: clientAdminClientsListParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;

      const result = await service.listClientAdminClients({
        clientAdminId: req.params.clientAdminId,
        user: req.user!,
        ...(requestId && { requestId }),
      });

      const response: ListClientAdminClientsResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /available - List Available Clients for Assignment
// =============================================================================

router.get(
  "/available",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("clientAdmins:read"),
  validate({ params: clientAdminClientsListParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const query = listAvailableClientsQuerySchema.parse(req.query);

      const result = await service.listAvailableClients({
        clientAdminId: req.params.clientAdminId,
        query,
        user: req.user!,
        ...(requestId && { requestId }),
      });

      const response: ListAvailableClientsResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /:clientId - Assign Client to ClientAdmin
// =============================================================================

router.post(
  "/:clientId",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("clientAdmins:edit"),
  validate({ params: clientAdminClientParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.assignClientAdminClient(
        {
          clientAdminId: req.params.clientAdminId,
          clientId: req.params.clientId,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: AssignClientAdminClientResponse = result;
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// DELETE /:clientId - Remove Client from ClientAdmin
// =============================================================================

router.delete(
  "/:clientId",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("clientAdmins:edit"),
  validate({ params: clientAdminClientParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      await service.removeClientAdminClient(
        {
          clientAdminId: req.params.clientAdminId,
          clientId: req.params.clientId,
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
