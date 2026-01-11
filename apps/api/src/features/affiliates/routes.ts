import { Router } from "express";
import {
  listAffiliatesQuerySchema,
  getAffiliateParamsSchema,
  type ListAffiliatesResponse,
  type AffiliateDetail,
} from "shared";
import { requireAuth } from "../../middleware/require-auth.js";
import { requirePermission } from "../../middleware/require-permission.js";
import { validate } from "../../middleware/validate.js";
import { getAuditContext } from "../../services/audit/audit.js";
import * as service from "./service.js";

const router = Router();

// =============================================================================
// GET / - List Affiliates
// =============================================================================

router.get(
  "/",
  requireAuth,
  requirePermission("affiliates:read"),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const query = listAffiliatesQuerySchema.parse(req.query);

      const result = await service.listAffiliates({
        query,
        user: req.user!,
        ...(requestId && { requestId }),
      });

      const response: ListAffiliatesResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /:id - Get Affiliate Detail
// =============================================================================

router.get(
  "/:id",
  requireAuth,
  requirePermission("affiliates:read"),
  validate({ params: getAffiliateParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.getAffiliate(
        {
          affiliateId: req.params.id,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: AffiliateDetail = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
