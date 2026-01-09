import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "@/components/ui";

// =============================================================================
// Date Formatters
// =============================================================================

/**
 * Formats an ISO date string to a localized display format.
 * @param value - ISO date string or null
 * @param fallback - Value to return if date is null/invalid (default: "-")
 * @returns Formatted date string (e.g., "5 ene 2024")
 */
export function formatDate(value: string | null, fallback = "-"): string {
  if (!value) return fallback;
  try {
    return format(parseISO(value), "d MMM yyyy", { locale: es });
  } catch {
    return value;
  }
}

/**
 * Converts a Date to YYYY-MM-DD string format.
 * @param date - Date object or undefined
 * @returns ISO date string (YYYY-MM-DD) or null if no date provided
 */
export function formatDateToString(date: Date | undefined): string | null {
  if (!date) return null;
  return format(date, "yyyy-MM-dd");
}

// =============================================================================
// Date Parsers
// =============================================================================

/**
 * Converts a YYYY-MM-DD string to Date object.
 * @param value - ISO date string or null
 * @returns Date object or undefined if invalid/null
 */
export function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  try {
    const date = parseISO(value);
    return isNaN(date.getTime()) ? undefined : date;
  } catch {
    return undefined;
  }
}

/**
 * Parses optional date strings into a DateRange object.
 * @param from - Start date string (YYYY-MM-DD)
 * @param to - End date string (YYYY-MM-DD)
 * @returns DateRange with parsed Date objects or undefined
 */
export function parseDateRange(from?: string, to?: string): DateRange {
  let fromDate: Date | undefined;
  let toDate: Date | undefined;

  if (from) {
    const parsed = parseISO(from);
    if (!isNaN(parsed.getTime())) fromDate = parsed;
  }
  if (to) {
    const parsed = parseISO(to);
    if (!isNaN(parsed.getTime())) toDate = parsed;
  }

  return { from: fromDate, to: toDate };
}
