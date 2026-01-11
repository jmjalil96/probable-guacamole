import { Router } from "express";
import {
  agentClientsListParamsSchema,
  agentClientParamsSchema,
  listAvailableClientsQuerySchema,
  type ListAgentClientsResponse,
  type AssignAgentClientResponse,
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
// GET / - List Agent Clients
// =============================================================================

router.get(
  "/",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("agents:read"),
  validate({ params: agentClientsListParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;

      const result = await service.listAgentClients({
        agentId: req.params.agentId,
        user: req.user!,
        ...(requestId && { requestId }),
      });

      const response: ListAgentClientsResponse = result;
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
  requirePermission("agents:read"),
  validate({ params: agentClientsListParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const query = listAvailableClientsQuerySchema.parse(req.query);

      const result = await service.listAvailableClients({
        agentId: req.params.agentId,
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
// POST /:clientId - Assign Client to Agent
// =============================================================================

router.post(
  "/:clientId",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("agents:edit"),
  validate({ params: agentClientParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.assignAgentClient(
        {
          agentId: req.params.agentId,
          clientId: req.params.clientId,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: AssignAgentClientResponse = result;
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// DELETE /:clientId - Remove Client from Agent
// =============================================================================

router.delete(
  "/:clientId",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("agents:edit"),
  validate({ params: agentClientParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      await service.removeAgentClient(
        {
          agentId: req.params.agentId,
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
