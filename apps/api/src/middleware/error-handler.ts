import { randomUUID } from "node:crypto";
import type { ErrorRequestHandler } from "express";
import type { Logger } from "pino";
import { logger } from "../lib/logger.js";
import { normalizeError } from "../lib/normalize-error.js";

const REQUEST_ID_HEADER = "x-request-id";
const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development";

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const appError = normalizeError(error);
  const requestId: string =
    (res.locals.requestId as string | undefined) ??
    req.header(REQUEST_ID_HEADER) ??
    randomUUID();

  if (!res.getHeader(REQUEST_ID_HEADER)) {
    res.setHeader(REQUEST_ID_HEADER, requestId);
  }

  const statusCode = appError.statusCode;
  const message =
    isProduction && statusCode >= 500
      ? "Internal server error"
      : appError.message;
  const details = appError.details ?? {};
  const responseBody = {
    error: {
      message,
      code: appError.code ?? "UNKNOWN_ERROR",
      requestId,
      details,
      ...(isDevelopment ? { stack: appError.stack } : {}),
    },
  };

  if (statusCode >= 500) {
    const log: Logger = (res.locals.logger as Logger | undefined) ?? logger;
    log.error(
      {
        err: appError,
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode,
        userAgent: req.get("user-agent"),
        ip: req.ip,
      },
      "request failed"
    );
  }

  res.status(statusCode).json(responseBody);
};
