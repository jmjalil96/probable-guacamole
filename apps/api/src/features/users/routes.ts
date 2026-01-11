import { Router } from "express";
import { listUsersQuerySchema, type ListUsersResponse } from "shared";
import { requireAuth } from "../../middleware/require-auth.js";
import { requirePermission } from "../../middleware/require-permission.js";
import { requireScope } from "../../middleware/require-scope.js";
import * as service from "./service.js";

const router = Router();

// =============================================================================
// GET / - List Users (unified view)
// =============================================================================

router.get(
  "/",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("users:read"),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const query = listUsersQuerySchema.parse(req.query);

      const result = await service.listUsers({
        query,
        user: req.user!,
        ...(requestId && { requestId }),
      });

      const response: ListUsersResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
