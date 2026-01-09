import { cva } from "class-variance-authority";

// =============================================================================
// Overlay
// =============================================================================

/** Overlay backdrop styles. */
export const modalOverlayVariants = cva([
  "fixed inset-0 z-40 bg-black/25",
  "transition-opacity duration-200 ease-out",
  "data-[closed]:opacity-0",
]);

// =============================================================================
// Panel
// =============================================================================

/** Panel container styles with size variants. */
export const modalPanelVariants = cva(
  [
    "relative flex max-h-[90vh] flex-col rounded-xl bg-background shadow-xl",
    "transition-all duration-200 ease-out",
    "data-[closed]:scale-95 data-[closed]:opacity-0",
    "focus:outline-none",
  ],
  {
    variants: {
      size: {
        sm: "w-full max-w-sm",
        md: "w-full max-w-md",
        lg: "w-full max-w-lg",
        xl: "w-full max-w-xl",
        "2xl": "w-full max-w-2xl",
        "3xl": "w-full max-w-3xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

// =============================================================================
// Sections
// =============================================================================

/** Header section styles. */
export const modalHeaderVariants = cva([
  "flex shrink-0 items-start justify-between gap-4",
  "border-b border-border px-6 py-4",
]);

/** Body/content section styles. */
export const modalBodyVariants = cva(["flex-1 overflow-y-auto px-6 py-4"]);

/** Footer section styles. */
export const modalFooterVariants = cva([
  "flex shrink-0 items-center justify-end gap-3",
  "border-t border-border px-6 py-4",
]);
