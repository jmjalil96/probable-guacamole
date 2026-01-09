import { z } from "zod";
import { parseISO, isValid } from "date-fns";

// =============================================================================
// Transform Helpers
// =============================================================================

/**
 * Transforms empty strings to undefined.
 * Useful for query params where empty string should use default.
 */
export const emptyToUndefined = (val: unknown) =>
  typeof val === "string" && val.trim() === "" ? undefined : val;

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validates that a YYYY-MM-DD string is a real calendar date.
 * Uses date-fns for robust parsing - rejects invalid dates like 2024-02-30.
 */
export const isValidCalendarDate = (val: string): boolean =>
  isValid(parseISO(val));

// =============================================================================
// Coercion Helpers
// =============================================================================

/**
 * Coerced integer with empty string → default handling.
 * Fixes: ?page= returning 400 instead of using default.
 */
export const coercedInt = (
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

/**
 * Enum with empty string → default handling.
 * Fixes: ?sortBy= returning 400 instead of using default.
 */
export const coercedEnum = <T extends z.ZodTypeAny>(
  schema: T,
  defaultVal: z.infer<T>
) =>
  z.preprocess(
    emptyToUndefined,
    z.union([z.undefined().transform(() => defaultVal), schema])
  );

/**
 * Boolean with string conversion for query params.
 * Handles: "true", "false", empty string, undefined
 */
export const coercedBoolean = (defaultVal: boolean) =>
  z.preprocess(
    emptyToUndefined,
    z.union([
      z.undefined().transform(() => defaultVal),
      z.literal("true").transform(() => true),
      z.literal("false").transform(() => false),
    ])
  );

// =============================================================================
// Common Schema Factories
// =============================================================================

/**
 * Helper for trimmed optional string
 */
export const optionalTrimmedString = z.preprocess(
  emptyToUndefined,
  z.string().trim().optional()
);

/**
 * Helper for date string with calendar validation
 */
export const optionalDateString = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .refine(isValidCalendarDate, "Invalid calendar date")
    .optional()
);

/**
 * Creates a schema for comma-separated array values in query params.
 * Handles: single value, comma-separated string, array, empty/undefined
 */
export const createCommaSeparatedArraySchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) =>
  z.preprocess((val) => {
    if (val === undefined || val === null || val === "") return undefined;
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      return val.split(",").map((s) => s.trim());
    }
    return [val];
  }, z.array(itemSchema).optional());
