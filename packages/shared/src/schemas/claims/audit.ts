import { z } from "zod";
import {
  coercedInt,
  optionalDateString,
  emptyToUndefined,
  createCommaSeparatedArraySchema,
} from "../../lib/schema-helpers.js";
import { paginationSchema, userRefSchema } from "../../lib/common.js";
import { claimStatusSchema } from "./core.js";

// =============================================================================
// Enums
// =============================================================================

export const auditSeveritySchema = z.enum(["INFO", "WARNING", "CRITICAL"]);

export type AuditSeverity = z.infer<typeof auditSeveritySchema>;

// =============================================================================
// Request Schemas
// =============================================================================

export const claimAuditTrailParamsSchema = z.object({
  id: z.string().min(1),
});

export const claimAuditTrailQuerySchema = z.object({
  // Pagination
  page: coercedInt(1, { min: 1 }),
  limit: coercedInt(20, { min: 1, max: 100 }),

  // Filters
  action: createCommaSeparatedArraySchema(z.string().min(1)),
  severity: createCommaSeparatedArraySchema(auditSeveritySchema),
  userId: z.preprocess(emptyToUndefined, z.string().min(1).optional()),

  // Date range
  from: optionalDateString,
  to: optionalDateString,
});

export type ClaimAuditTrailParams = z.infer<typeof claimAuditTrailParamsSchema>;
export type ClaimAuditTrailQuery = z.infer<typeof claimAuditTrailQuerySchema>;

// =============================================================================
// Response Schema
// =============================================================================

const auditLogUserSchema = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .nullable();

export const auditLogItemSchema = z.object({
  id: z.string(),
  action: z.string(),
  severity: auditSeveritySchema,
  oldValue: z.unknown().nullable(),
  newValue: z.unknown().nullable(),
  metadata: z.unknown().nullable(),
  user: auditLogUserSchema,
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.string(),
});

export const claimAuditTrailResponseSchema = z.object({
  data: z.array(auditLogItemSchema),
  pagination: paginationSchema,
});

export type AuditLogItem = z.infer<typeof auditLogItemSchema>;
export type ClaimAuditTrailResponse = z.infer<typeof claimAuditTrailResponseSchema>;

// =============================================================================
// ClaimHistory Schemas
// =============================================================================

export const claimHistoryQuerySchema = z.object({
  page: coercedInt(1, { min: 1 }),
  limit: coercedInt(20, { min: 1, max: 100 }),
});

export type ClaimHistoryQuery = z.infer<typeof claimHistoryQuerySchema>;

export const claimHistoryItemSchema = z.object({
  id: z.string(),
  fromStatus: claimStatusSchema.nullable(),
  toStatus: claimStatusSchema,
  reason: z.string().nullable(),
  notes: z.string().nullable(),
  createdBy: userRefSchema,
  createdAt: z.string(),
});

export const claimHistoryResponseSchema = z.object({
  data: z.array(claimHistoryItemSchema),
  pagination: paginationSchema,
});

export type ClaimHistoryItem = z.infer<typeof claimHistoryItemSchema>;
export type ClaimHistoryResponse = z.infer<typeof claimHistoryResponseSchema>;
