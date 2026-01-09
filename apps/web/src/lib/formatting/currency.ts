// =============================================================================
// Currency Formatters
// =============================================================================

export interface FormatCurrencyOptions {
  locale?: string;
  currency?: string;
  fallback?: string;
}

/**
 * Formats a decimal string value as currency.
 * @param value - Decimal string (e.g., "1234.56") or null
 * @param options - Formatting options (locale, currency, fallback)
 * @returns Formatted currency string (e.g., "1.234,56 US$")
 */
export function formatCurrency(
  value: string | null,
  options: FormatCurrencyOptions = {}
): string {
  const { locale = "es-ES", currency = "USD", fallback = "-" } = options;
  if (!value) return fallback;
  const num = parseFloat(value);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(num);
}
