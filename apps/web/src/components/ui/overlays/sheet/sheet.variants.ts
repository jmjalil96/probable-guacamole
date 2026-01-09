import { cva } from "class-variance-authority";

/** Overlay backdrop styles. */
export const sheetOverlayVariants = cva([
  "fixed inset-0 z-40 bg-black/50",
  "transition-opacity duration-200 ease-out",
  "data-[closed]:opacity-0",
]);

/** Panel container styles with side and size variants. */
export const sheetPanelVariants = cva(
  [
    "fixed z-50 flex flex-col bg-background shadow-xl",
    "transition-transform duration-300 ease-out",
    "focus:outline-none",
  ],
  {
    variants: {
      side: {
        right: "inset-y-0 right-0 data-[closed]:translate-x-full",
        left: "inset-y-0 left-0 data-[closed]:-translate-x-full",
        top: "inset-x-0 top-0 data-[closed]:-translate-y-full",
        bottom: "inset-x-0 bottom-0 data-[closed]:translate-y-full",
      },
      size: {
        sm: "",
        md: "",
        lg: "",
        xl: "",
        full: "",
      },
    },
    compoundVariants: [
      // Right/Left panels: size controls width
      { side: "right", size: "sm", className: "w-80" },
      { side: "right", size: "md", className: "w-[400px]" },
      { side: "right", size: "lg", className: "w-[540px]" },
      { side: "right", size: "xl", className: "w-[720px]" },
      { side: "right", size: "full", className: "w-full" },
      { side: "left", size: "sm", className: "w-80" },
      { side: "left", size: "md", className: "w-[400px]" },
      { side: "left", size: "lg", className: "w-[540px]" },
      { side: "left", size: "xl", className: "w-[720px]" },
      { side: "left", size: "full", className: "w-full" },
      // Top/Bottom panels: size controls height
      { side: "top", size: "sm", className: "h-64" },
      { side: "top", size: "md", className: "h-80" },
      { side: "top", size: "lg", className: "h-96" },
      { side: "top", size: "xl", className: "h-[480px]" },
      { side: "top", size: "full", className: "h-full" },
      { side: "bottom", size: "sm", className: "h-64" },
      { side: "bottom", size: "md", className: "h-80" },
      { side: "bottom", size: "lg", className: "h-96" },
      { side: "bottom", size: "xl", className: "h-[480px]" },
      { side: "bottom", size: "full", className: "h-full" },
    ],
    defaultVariants: {
      side: "right",
      size: "md",
    },
  }
);

/** Header section styles. */
export const sheetHeaderVariants = cva([
  "flex shrink-0 items-center justify-between gap-4",
  "border-b border-border px-4 py-3 sm:px-6",
]);

/** Body/content section styles. */
export const sheetBodyVariants = cva([
  "flex-1 overflow-y-auto px-4 py-4 sm:px-6",
]);

/** Footer section styles. */
export const sheetFooterVariants = cva([
  "flex shrink-0 items-center justify-end gap-3",
  "border-t border-border px-4 py-3 sm:px-6",
]);
