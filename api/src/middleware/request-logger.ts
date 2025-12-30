import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { createRequestLogger } from "../lib/logger.js";

const REQUEST_ID_HEADER = "x-request-id";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const existingRequestId = req.header(REQUEST_ID_HEADER);
  const requestId =
    existingRequestId && existingRequestId.trim() !== ""
      ? existingRequestId
      : randomUUID();

  const log = createRequestLogger(requestId);

  res.locals.requestId = requestId;
  res.locals.logger = log;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const statusCode = res.statusCode;
    const payload = {
      method: req.method,
      path: req.originalUrl,
      statusCode,
      durationMs: Math.round(durationMs),
      userAgent: req.get("user-agent"),
      ip: req.ip,
    };

    if (statusCode >= 500) {
      log.error(payload, "request completed");
    } else if (statusCode >= 400) {
      log.warn(payload, "request completed");
    } else {
      log.info(payload, "request completed");
    }
  });

  next();
};
