import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import type { AuditSeverity, PrismaClient } from "@prisma/client";
import { db } from "../../config/db.js";
import { logger } from "../../lib/logger.js";
import { AuditActions } from "./constants.js";

// JSON-compatible value type
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export { AuditActions, type AuditAction } from "./constants.js";

// Context from HTTP request
export interface AuditContext {
  userId?: string | null;
  sessionId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
}

// Audit log entry
export interface AuditEntry {
  action: string;
  resource: string;
  resourceId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  severity?: AuditSeverity;
  metadata?: unknown;
}

// Prisma transaction client type
type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// Max size for JSON fields (64KB)
const MAX_JSON_SIZE = 64 * 1024;

/**
 * Recursively sanitize values for JSON storage.
 * Converts Date -> ISO string, BigInt -> string, Decimal -> string, Buffer -> base64.
 */
function sanitizeValue(value: unknown, seen: WeakSet<object>): JsonValue {
  if (value === undefined || value === null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return value.toString("base64");
  if (Prisma.Decimal.isDecimal(value)) return value.toString();

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, seen));
  }

  if (typeof value === "object") {
    if (seen.has(value)) return "[Circular]";
    seen.add(value);

    const result: Record<string, JsonValue> = {};
    for (const [key, nested] of Object.entries(value)) {
      result[key] = sanitizeValue(nested, seen);
    }
    return result;
  }

  // Unknown type - return type indicator
  return `[${typeof value}]`;
}

/**
 * Sanitize value for JSON storage with size limit.
 * Returns truncation marker if result exceeds MAX_JSON_SIZE.
 */
function sanitizeForJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;

  const sanitized = sanitizeValue(value, new WeakSet());

  const size = JSON.stringify(sanitized).length;
  if (size > MAX_JSON_SIZE) {
    return { _truncated: true, _originalSize: size };
  }

  return sanitized as Prisma.InputJsonValue;
}

/**
 * Extract audit context from Express request/response.
 * Works with auth middleware that sets req.user.
 */
export function getAuditContext(req: Request, res: Response): AuditContext {
  const user = (req as Request & { user?: { id: string; sessionId?: string } })
    .user;

  return {
    userId: user?.id ?? null,
    sessionId: user?.sessionId ?? null,
    ipAddress: req.ip ?? null,
    userAgent: req.get("user-agent") ?? null,
    requestId: (res.locals.requestId as string) ?? null,
  };
}

/**
 * Build Prisma create input from entry and context.
 */
function buildAuditData(
  entry: AuditEntry,
  context: AuditContext
): Prisma.AuditLogCreateInput {
  const data: Prisma.AuditLogCreateInput = {
    action: entry.action,
    resource: entry.resource,
    severity: entry.severity ?? "INFO",
    resourceId: entry.resourceId ?? null,
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
    requestId: context.requestId ?? null,
  };

  const oldValue = sanitizeForJson(entry.oldValue);
  const newValue = sanitizeForJson(entry.newValue);
  const metadata = sanitizeForJson(entry.metadata);

  if (oldValue !== undefined) data.oldValue = oldValue;
  if (newValue !== undefined) data.newValue = newValue;
  if (metadata !== undefined) data.metadata = metadata;

  if (context.userId) {
    data.user = { connect: { id: context.userId } };
  }
  if (context.sessionId) {
    data.session = { connect: { id: context.sessionId } };
  }

  return data;
}

/**
 * Log an audit event. Fire-and-forget - never throws.
 */
export function log(entry: AuditEntry, context: AuditContext = {}): void {
  const data = buildAuditData(entry, context);

  db.auditLog.create({ data }).catch((err) => {
    logger.error(
      {
        err,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
      },
      "audit log write failed"
    );
  });
}

/**
 * Log an audit event within a Prisma transaction.
 * Use when audit must be atomic with business operation.
 */
export async function logInTransaction(
  tx: TransactionClient,
  entry: AuditEntry,
  context: AuditContext = {}
): Promise<void> {
  const data = buildAuditData(entry, context);
  await tx.auditLog.create({ data });
}

/**
 * Log an update with old/new values. Convenience wrapper.
 */
export function logUpdate(
  params: {
    resource: string;
    resourceId: string;
    oldValue: unknown;
    newValue: unknown;
    severity?: AuditSeverity;
    metadata?: unknown;
  },
  context: AuditContext = {}
): void {
  const entry: AuditEntry = {
    action: AuditActions.UPDATE,
    resource: params.resource,
    resourceId: params.resourceId,
    oldValue: params.oldValue,
    newValue: params.newValue,
    severity: params.severity ?? "INFO",
  };

  if (params.metadata !== undefined) {
    entry.metadata = params.metadata;
  }

  log(entry, context);
}
