import { z } from "zod";
import { parseISO, isValid } from "date-fns";
import { claimStatusSchema } from "./claims.js";

// =============================================================================
// Enums
// =============================================================================

export const auditSeveritySchema = z.enum(["INFO", "WARNING", "CRITICAL"]);

export type AuditSeverity = z.infer<typeof auditSeveritySchema>;

// =============================================================================
// Query Schema Helpers
// =============================================================================

// Helper to transform empty strings to undefined
const emptyToUndefined = (val: unknown) =>
  typeof val === "string" && val.trim() === "" ? undefined : val;

/**
 * Validates that a YYYY-MM-DD string is a real calendar date.
 */
const isValidCalendarDate = (val: string): boolean => isValid(parseISO(val));

/**
 * Coerced integer with empty string → default handling.
 */
const coercedInt = (
  defaultVal: number,
  { min, max }: { min?: number; max?: number } = {}
) =>
  z.preprocess(
    emptyToUndefined,
    z.union([
      z.undefined().transform(() => defaultVal),
      z.coerce
        .number()
        .int()
        .min(min ?? Number.MIN_SAFE_INTEGER)
        .max(max ?? Number.MAX_SAFE_INTEGER),
    ])
  );

// Helper for string array (can be single value or comma-separated)
const stringArraySchema = z.preprocess((val) => {
  if (val === undefined || val === null || val === "") return undefined;
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    return val.split(",").map((s) => s.trim());
  }
  return [val];
}, z.array(z.string().min(1)).optional());

// Helper for severity array
const severityArraySchema = z.preprocess((val) => {
  if (val === undefined || val === null || val === "") return undefined;
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    return val.split(",").map((s) => s.trim());
  }
  return [val];
}, z.array(auditSeveritySchema).optional());

// Helper for date string with calendar validation
const optionalDateString = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .refine(isValidCalendarDate, "Invalid calendar date")
    .optional()
);

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
  action: stringArraySchema,
  severity: severityArraySchema,
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

export const auditTrailPaginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const claimAuditTrailResponseSchema = z.object({
  data: z.array(auditLogItemSchema),
  pagination: auditTrailPaginationSchema,
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

const historyUserSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const claimHistoryItemSchema = z.object({
  id: z.string(),
  fromStatus: claimStatusSchema.nullable(),
  toStatus: claimStatusSchema,
  reason: z.string().nullable(),
  notes: z.string().nullable(),
  createdBy: historyUserSchema,
  createdAt: z.string(),
});

export const claimHistoryResponseSchema = z.object({
  data: z.array(claimHistoryItemSchema),
  pagination: auditTrailPaginationSchema,
});

export type ClaimHistoryItem = z.infer<typeof claimHistoryItemSchema>;
export type ClaimHistoryResponse = z.infer<typeof claimHistoryResponseSchema>;
