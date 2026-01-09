import { describe, it, expect } from "vitest";
import { formatCurrency } from "../currency";

describe("formatCurrency", () => {
  describe("with valid values", () => {
    it("formats a simple decimal string", () => {
      const result = formatCurrency("1234.56");
      // es-ES locale uses comma for decimal separator
      expect(result).toContain("1234,56");
      expect(result).toContain("US$");
    });

    it("formats zero", () => {
      const result = formatCurrency("0");
      expect(result).toContain("0,00");
    });

    it("formats large numbers", () => {
      const result = formatCurrency("1000000.00");
      expect(result).toContain("1.000.000");
    });

    it("handles integers without decimals", () => {
      const result = formatCurrency("500");
      expect(result).toContain("500,00");
    });
  });

  describe("with null/empty values", () => {
    it("returns fallback for null", () => {
      expect(formatCurrency(null)).toBe("-");
    });

    it("returns fallback for empty string", () => {
      expect(formatCurrency("")).toBe("-");
    });

    it("uses custom fallback when provided", () => {
      expect(formatCurrency(null, { fallback: "N/A" })).toBe("N/A");
    });
  });

  describe("with custom options", () => {
    it("uses custom currency", () => {
      const result = formatCurrency("100.00", { currency: "EUR" });
      expect(result).toContain("€");
    });

    it("uses custom locale", () => {
      const result = formatCurrency("1234.56", { locale: "en-US" });
      // US locale uses comma for thousands and period for decimals
      expect(result).toContain("1,234.56");
    });
  });
});
