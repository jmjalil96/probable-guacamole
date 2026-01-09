import { cva } from "class-variance-authority";

/**
 * Button trigger styles for dropdown components.
 * Used by: Select, MultiSelect, DatePicker
 *
 * @example
 * ```tsx
 * <button className={triggerVariants({ size: "md" })}>Select...</button>
 * ```
 */
export const triggerVariants = cva(
  [
    "flex w-full items-center gap-2",
    "border",
    "text-sm",
    "transition-colors",
    "hover:border-text-light",
    "focus:border-primary focus:outline-none",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ],
  {
    variants: {
      size: {
        sm: "h-10 min-w-[160px] px-3 rounded-lg bg-background focus:ring-2 focus:ring-primary/40",
        md: "h-11 px-4 rounded-xl bg-white focus:ring-4 focus:ring-primary/10",
      },
      error: {
        true: "border-alert focus:border-alert focus:ring-alert/10",
        false: "border-border",
      },
      justify: {
        between: "justify-between",
        start: "justify-start",
      },
    },
    defaultVariants: {
      size: "sm",
      error: false,
      justify: "between",
    },
  }
);

/**
 * Input trigger styles for searchable dropdown components.
 * Used by: SearchableSelect, Combobox (async)
 *
 * @example
 * ```tsx
 * <input className={inputTriggerVariants({ size: "md", error: false })} />
 * ```
 */
export const inputTriggerVariants = cva(
  [
    "w-full",
    "border",
    "text-sm text-text",
    "outline-none transition-colors",
    "placeholder:text-text-light",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ],
  {
    variants: {
      size: {
        sm: "h-10 pl-3 pr-10 rounded-lg bg-background focus:ring-2 focus:ring-primary/40",
        md: "h-11 pl-4 pr-10 rounded-xl bg-white focus:ring-4 focus:ring-primary/10",
      },
      error: {
        true: "border-alert focus:border-alert focus:ring-alert/10",
        false: "border-border hover:border-text-light focus:border-primary",
      },
    },
    defaultVariants: {
      size: "md",
      error: false,
    },
  }
);

/**
 * Dropdown content styles for popover/select components.
 * Used by: Select, MultiSelect, DatePicker, SearchableSelect, Combobox
 */
export const popoverContentVariants = cva(
  [
    "z-50",
    "overflow-auto",
    "rounded-xl border border-border bg-white shadow-lg",
    "focus:outline-none",
    "animate-in fade-in-0 zoom-in-95",
  ],
  {
    variants: {
      size: {
        default: "min-w-[var(--radix-select-trigger-width)] max-h-60 py-1",
        calendar: "w-auto max-h-none",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

/**
 * Option item styles for dropdown menus.
 * Used by: Select, MultiSelect, SearchableSelect, Combobox
 */
export const optionVariants = cva([
  "relative cursor-pointer select-none",
  "px-4 py-2.5",
  "text-sm text-text",
  "transition-colors",
  // Radix uses data-highlighted, Headless UI uses data-focus
  "data-[focus]:bg-primary/10 data-[focus]:text-primary",
  "data-[highlighted]:bg-primary/5",
  "data-[selected]:bg-primary/5",
]);
