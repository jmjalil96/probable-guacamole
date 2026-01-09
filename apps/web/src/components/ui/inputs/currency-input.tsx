import { forwardRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps {
  /** Raw decimal string value (e.g., "1234.56"). */
  value: string | null;
  /** Callback with raw decimal string or null. */
  onChange: (value: string | null) => void;
  /** Callback when input loses focus. */
  onBlur?: () => void;
  /** Placeholder text. @default "$0.00" */
  placeholder?: string;
  /** Shows error styling. @default false */
  error?: boolean;
  /** Disables the input. @default false */
  disabled?: boolean;
  /** Currency code for formatting. @default "USD" */
  currency?: string;
  /** Locale for formatting. @default "en-US" */
  locale?: string;
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Formats a decimal string as currency.
 */
function formatCurrency(
  value: string | null,
  locale: string,
  currency: string
): string {
  if (!value) return "";

  const num = parseFloat(value);
  if (isNaN(num)) return "";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Parses a user input string to a clean decimal string.
 * Removes currency symbols, thousand separators, etc.
 */
function parseToDecimal(input: string): string | null {
  if (!input.trim()) return null;

  // Remove everything except digits, dots, and minus
  const cleaned = input.replace(/[^0-9.-]/g, "");

  // Handle empty result
  if (!cleaned || cleaned === "-" || cleaned === ".") return null;

  // Parse and validate
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;

  // Return as fixed 2 decimal string
  return num.toFixed(2);
}

/**
 * Currency input with formatting.
 * Shows formatted value on blur, raw value on focus.
 *
 * @example
 * ```tsx
 * const [amount, setAmount] = useState<string | null>(null);
 * <CurrencyInput value={amount} onChange={setAmount} />
 * ```
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      value,
      onChange,
      onBlur,
      placeholder = "$0.00",
      error = false,
      disabled = false,
      currency = "USD",
      locale = "en-US",
      className,
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [editValue, setEditValue] = useState("");

    // Compute display value based on focus state
    const displayValue = isFocused
      ? editValue
      : formatCurrency(value, locale, currency);

    const handleFocus = useCallback(() => {
      setIsFocused(true);
      // Show raw value for editing
      setEditValue(value ?? "");
    }, [value]);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
      // Parse and emit
      const parsed = parseToDecimal(editValue);
      onChange(parsed);
      onBlur?.();
    }, [editValue, onChange, onBlur]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditValue(e.target.value);
      },
      []
    );

    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          // Base
          "w-full h-11 px-4",
          "text-sm text-text bg-white",
          "border rounded-xl outline-none",
          "transition-colors",
          "placeholder:text-text-light",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          // Error vs normal states
          error
            ? "border-alert focus:border-alert focus:ring-4 focus:ring-alert/10"
            : "border-border hover:border-text-light focus:border-primary focus:ring-4 focus:ring-primary/10",
          className
        )}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
