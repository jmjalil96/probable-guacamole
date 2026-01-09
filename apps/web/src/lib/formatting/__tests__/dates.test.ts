import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatDateToString,
  parseDate,
  parseDateRange,
} from "../dates";

describe("formatDate", () => {
  it("formats an ISO date string", () => {
    const result = formatDate("2024-01-15");
    expect(result).toBe("15 ene 2024");
  });

  it("formats a full ISO datetime string", () => {
    const result = formatDate("2024-12-25T10:30:00Z");
    expect(result).toBe("25 dic 2024");
  });

  it("returns fallback for null", () => {
    expect(formatDate(null)).toBe("-");
  });

  it("returns custom fallback when provided", () => {
    expect(formatDate(null, "N/A")).toBe("N/A");
  });

  it("returns original value for invalid date", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });

  it("formats various months correctly", () => {
    expect(formatDate("2024-03-01")).toBe("1 mar 2024");
    expect(formatDate("2024-06-15")).toBe("15 jun 2024");
    expect(formatDate("2024-09-30")).toBe("30 sep 2024");
  });
});

describe("formatDateToString", () => {
  it("converts Date to YYYY-MM-DD string", () => {
    const date = new Date(2024, 0, 15); // January 15, 2024
    expect(formatDateToString(date)).toBe("2024-01-15");
  });

  it("returns null for undefined", () => {
    expect(formatDateToString(undefined)).toBeNull();
  });

  it("pads single digit months and days", () => {
    const date = new Date(2024, 4, 5); // May 5, 2024
    expect(formatDateToString(date)).toBe("2024-05-05");
  });
});

describe("parseDate", () => {
  it("parses a valid YYYY-MM-DD string", () => {
    const result = parseDate("2024-01-15");
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2024);
    expect(result?.getMonth()).toBe(0); // January
    expect(result?.getDate()).toBe(15);
  });

  it("parses a full ISO datetime string", () => {
    const result = parseDate("2024-06-20T15:30:00Z");
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2024);
  });

  it("returns undefined for null", () => {
    expect(parseDate(null)).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(parseDate("")).toBeUndefined();
  });

  it("returns undefined for invalid date string", () => {
    expect(parseDate("invalid")).toBeUndefined();
  });
});

describe("parseDateRange", () => {
  it("parses both from and to dates", () => {
    const result = parseDateRange("2024-01-01", "2024-01-31");
    expect(result.from).toBeInstanceOf(Date);
    expect(result.to).toBeInstanceOf(Date);
    expect(result.from?.getDate()).toBe(1);
    expect(result.to?.getDate()).toBe(31);
  });

  it("parses only from date", () => {
    const result = parseDateRange("2024-01-15");
    expect(result.from).toBeInstanceOf(Date);
    expect(result.to).toBeUndefined();
  });

  it("parses only to date", () => {
    const result = parseDateRange(undefined, "2024-01-31");
    expect(result.from).toBeUndefined();
    expect(result.to).toBeInstanceOf(Date);
  });

  it("returns empty range for no dates", () => {
    const result = parseDateRange();
    expect(result.from).toBeUndefined();
    expect(result.to).toBeUndefined();
  });

  it("handles invalid from date", () => {
    const result = parseDateRange("invalid", "2024-01-31");
    expect(result.from).toBeUndefined();
    expect(result.to).toBeInstanceOf(Date);
  });

  it("handles invalid to date", () => {
    const result = parseDateRange("2024-01-01", "invalid");
    expect(result.from).toBeInstanceOf(Date);
    expect(result.to).toBeUndefined();
  });
});
