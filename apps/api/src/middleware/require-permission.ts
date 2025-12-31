import type { RequestHandler } from "express";
import type { Logger } from "pino";
import { db } from "../config/db.js";
import { logger } from "../lib/logger.js";
import { AppError } from "../lib/errors.js";

export const requirePermission = (permission: string): RequestHandler => {
  const [resource, action] = permission.split(":");

  if (!resource || !action) {
    throw new Error(
      `Invalid permission format: "${permission}". Expected "resource:action"`
    );
  }

  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }

      const hasPermission = await db.rolePermission.findFirst({
        where: {
          roleId: req.user.role.id,
          permission: { resource, action },
        },
      });

      if (!hasPermission) {
        const log: Logger = (res.locals.logger as Logger | undefined) ?? logger;
        log.debug(
          { userId: req.user.id, roleId: req.user.role.id, permission },
          "permission denied"
        );
        throw AppError.forbidden();
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
