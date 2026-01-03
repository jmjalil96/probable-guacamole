import { Router } from "express";
import type {
  LookupClientsResponse,
  LookupAffiliatesResponse,
  LookupPatientsResponse,
  LookupPoliciesResponse,
} from "shared";
import { requireAuth } from "../../../middleware/require-auth.js";
import { requirePermission } from "../../../middleware/require-permission.js";
import { requireScope } from "../../../middleware/require-scope.js";
import * as service from "./service.js";
import {
  lookupAffiliatesQuerySchema,
  lookupPatientsQuerySchema,
  lookupPoliciesQuerySchema,
} from "./schemas.js";

const router = Router();

// =============================================================================
// GET /clients - Lookup clients for create process
// =============================================================================

router.get(
  "/clients",
  requireAuth,
  requirePermission("claims:create"),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;

      const result = await service.lookupClients({
        user: req.user!,
        ...(requestId && { requestId }),
      });

      const response: LookupClientsResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /affiliates - Lookup affiliates for create process
// =============================================================================

router.get(
  "/affiliates",
  requireAuth,
  requirePermission("claims:create"),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const { clientId } = lookupAffiliatesQuerySchema.parse(req.query);

      const result = await service.lookupAffiliates({
        clientId,
        user: req.user!,
        ...(requestId && { requestId }),
      });

      const response: LookupAffiliatesResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /patients - Lookup patients for create process
// =============================================================================

router.get(
  "/patients",
  requireAuth,
  requirePermission("claims:create"),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const { affiliateId } = lookupPatientsQuerySchema.parse(req.query);

      const result = await service.lookupPatients({
        affiliateId,
        user: req.user!,
        ...(requestId && { requestId }),
      });

      const response: LookupPatientsResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /policies - Lookup policies for edit process (UNLIMITED only)
// =============================================================================

router.get(
  "/policies",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("claims:edit"),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const { clientId } = lookupPoliciesQuerySchema.parse(req.query);

      const result = await service.lookupPolicies({
        clientId,
        user: req.user!,
        ...(requestId && { requestId }),
      });

      const response: LookupPoliciesResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
