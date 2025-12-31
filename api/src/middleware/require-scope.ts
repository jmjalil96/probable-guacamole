import type { RequestHandler } from "express";
import type { ScopeType } from "@prisma/client";
import type { Logger } from "pino";
import { logger } from "../lib/logger.js";
import { AppError } from "../lib/errors.js";

export const requireScope = (
  scope: ScopeType | ScopeType[]
): RequestHandler => {
  const allowedScopes = Array.isArray(scope) ? scope : [scope];

  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }

    if (!allowedScopes.includes(req.user.role.scopeType)) {
      const log: Logger = (res.locals.logger as Logger | undefined) ?? logger;
      log.debug(
        {
          userId: req.user.id,
          roleId: req.user.role.id,
          userScope: req.user.role.scopeType,
          requiredScopes: allowedScopes,
        },
        "scope denied"
      );
      return next(AppError.forbidden());
    }

    next();
  };
};
