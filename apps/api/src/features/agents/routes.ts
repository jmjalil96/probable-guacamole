import { Router } from "express";
import {
  listAgentsQuerySchema,
  agentParamsSchema,
  createAgentRequestSchema,
  updateAgentRequestSchema,
  type ListAgentsResponse,
  type Agent,
  type CreateAgentResponse,
} from "shared";
import { requireAuth } from "../../middleware/require-auth.js";
import { requirePermission } from "../../middleware/require-permission.js";
import { requireScope } from "../../middleware/require-scope.js";
import { validate } from "../../middleware/validate.js";
import { getAuditContext } from "../../services/audit/audit.js";
import * as service from "./service.js";
import { agentClientsRouter } from "./clients/index.js";

const router = Router();

// =============================================================================
// Mount Nested Resources (claims pattern: nested routes FIRST)
// =============================================================================

router.use("/:agentId/clients", agentClientsRouter);

// =============================================================================
// GET / - List Agents
// =============================================================================

router.get(
  "/",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("agents:read"),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const query = listAgentsQuerySchema.parse(req.query);

      const result = await service.listAgents({
        query,
        user: req.user!,
        ...(requestId && { requestId }),
      });

      const response: ListAgentsResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /:id - Get Agent
// =============================================================================

router.get(
  "/:id",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("agents:read"),
  validate({ params: agentParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.getAgent(
        {
          agentId: req.params.id,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: Agent = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST / - Create Agent
// =============================================================================

router.post(
  "/",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("agents:create"),
  validate({ body: createAgentRequestSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.createAgent(
        {
          request: req.body,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: CreateAgentResponse = { id: result.id };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// PATCH /:id - Update Agent
// =============================================================================

router.patch(
  "/:id",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("agents:edit"),
  validate({ params: agentParamsSchema, body: updateAgentRequestSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.updateAgent(
        {
          agentId: req.params.id,
          updates: req.body,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: Agent = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// DELETE /:id - Delete Agent
// =============================================================================

router.delete(
  "/:id",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("agents:delete"),
  validate({ params: agentParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      await service.deleteAgent(
        {
          agentId: req.params.id,
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
