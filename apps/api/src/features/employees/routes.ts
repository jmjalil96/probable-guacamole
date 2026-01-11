import { Router } from "express";
import {
  listEmployeesQuerySchema,
  employeeParamsSchema,
  createEmployeeRequestSchema,
  updateEmployeeRequestSchema,
  type ListEmployeesResponse,
  type Employee,
  type CreateEmployeeResponse,
} from "shared";
import { requireAuth } from "../../middleware/require-auth.js";
import { requirePermission } from "../../middleware/require-permission.js";
import { requireScope } from "../../middleware/require-scope.js";
import { validate } from "../../middleware/validate.js";
import { getAuditContext } from "../../services/audit/audit.js";
import * as service from "./service.js";

const router = Router();

// =============================================================================
// GET / - List Employees
// =============================================================================

router.get(
  "/",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("employees:read"),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const query = listEmployeesQuerySchema.parse(req.query);

      const result = await service.listEmployees({
        query,
        user: req.user!,
        ...(requestId && { requestId }),
      });

      const response: ListEmployeesResponse = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /:id - Get Employee
// =============================================================================

router.get(
  "/:id",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("employees:read"),
  validate({ params: employeeParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.getEmployee(
        {
          employeeId: req.params.id,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: Employee = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST / - Create Employee
// =============================================================================

router.post(
  "/",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("employees:create"),
  validate({ body: createEmployeeRequestSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.createEmployee(
        {
          request: req.body,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: CreateEmployeeResponse = { id: result.id };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// PATCH /:id - Update Employee
// =============================================================================

router.patch(
  "/:id",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("employees:edit"),
  validate({ params: employeeParamsSchema, body: updateEmployeeRequestSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      const result = await service.updateEmployee(
        {
          employeeId: req.params.id,
          updates: req.body,
          user: req.user!,
          ...(requestId && { requestId }),
        },
        context
      );

      const response: Employee = result;
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// DELETE /:id - Delete Employee
// =============================================================================

router.delete(
  "/:id",
  requireAuth,
  requireScope("UNLIMITED"),
  requirePermission("employees:delete"),
  validate({ params: employeeParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req, res);

      await service.deleteEmployee(
        {
          employeeId: req.params.id,
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
