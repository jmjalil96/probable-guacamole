import {
  forwardRef,
  createContext,
  useContext,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogDescription,
  DialogBackdrop,
} from "@headlessui/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  sheetOverlayVariants,
  sheetPanelVariants,
  sheetHeaderVariants,
  sheetBodyVariants,
  sheetFooterVariants,
} from "./sheet.variants";

// =============================================================================
// Types
// =============================================================================

export type SheetSide = "right" | "left" | "top" | "bottom";
export type SheetSize = "sm" | "md" | "lg" | "xl" | "full";

export interface SheetProps {
  /** Whether the sheet is open. */
  open: boolean;
  /** Callback when sheet should close. */
  onClose: (open: boolean) => void;
  /** Sheet content (typically Sheet.Panel). */
  children: ReactNode;
}

export interface SheetPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Which side the panel slides in from. @default "right" */
  side?: SheetSide;
  /** Panel size. @default "md" */
  size?: SheetSize;
  /** Panel content. */
  children: ReactNode;
}

export interface SheetHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Header content (typically contains Sheet.Title). */
  children: ReactNode;
}

export interface SheetTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Title text. */
  children: ReactNode;
}

export interface SheetDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  /** Description text. */
  children: ReactNode;
}

export interface SheetBodyProps extends HTMLAttributes<HTMLDivElement> {
  /** Body content. */
  children: ReactNode;
}

export interface SheetFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Footer content (typically action buttons). */
  children: ReactNode;
}

export interface SheetCloseProps extends HTMLAttributes<HTMLButtonElement> {
  /** Optional custom content, otherwise renders X icon. */
  children?: ReactNode;
}

// =============================================================================
// Context
// =============================================================================

interface SheetContextValue {
  onClose: () => void;
}

const SheetContext = createContext<SheetContextValue | null>(null);

function useSheetContext() {
  const context = useContext(SheetContext);
  if (!context) {
    throw new Error("Sheet compound components must be used within a Sheet");
  }
  return context;
}

// =============================================================================
// Root Component
// =============================================================================

/**
 * A slide-out panel component for quick edits, forms, and filters.
 * Built on Headless UI Dialog for accessibility.
 *
 * @example
 * ```tsx
 * <Sheet open={open} onClose={setOpen}>
 *   <Sheet.Panel side="right" size="md">
 *     <Sheet.Header>
 *       <Sheet.Title>Edit User</Sheet.Title>
 *     </Sheet.Header>
 *     <Sheet.Body>
 *       <form>...</form>
 *     </Sheet.Body>
 *     <Sheet.Footer>
 *       <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
 *       <Button>Save</Button>
 *     </Sheet.Footer>
 *   </Sheet.Panel>
 * </Sheet>
 * ```
 */
function SheetRoot({ open, onClose, children }: SheetProps) {
  return (
    <SheetContext.Provider value={{ onClose: () => onClose(false) }}>
      <Dialog open={open} onClose={onClose} className="relative z-50">
        <DialogBackdrop className={sheetOverlayVariants()} />
        {children}
      </Dialog>
    </SheetContext.Provider>
  );
}

// =============================================================================
// Panel Component
// =============================================================================

/**
 * The sliding panel container.
 */
const Panel = forwardRef<HTMLDivElement, SheetPanelProps>(
  ({ side = "right", size = "md", children, className, ...props }, ref) => {
    return (
      <DialogPanel
        ref={ref}
        className={cn(sheetPanelVariants({ side, size }), className)}
        {...props}
      >
        {children}
      </DialogPanel>
    );
  }
);
Panel.displayName = "Sheet.Panel";

// =============================================================================
// Header Component
// =============================================================================

/**
 * Sticky header with close button.
 */
const Header = forwardRef<HTMLDivElement, SheetHeaderProps>(
  ({ children, className, ...props }, ref) => {
    const { onClose } = useSheetContext();

    return (
      <div
        ref={ref}
        className={cn(sheetHeaderVariants(), className)}
        {...props}
      >
        <div className="min-w-0 flex-1">{children}</div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
            "text-text-muted transition-colors",
            "hover:bg-gray-100 hover:text-text",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          )}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
    );
  }
);
Header.displayName = "Sheet.Header";

// =============================================================================
// Title Component
// =============================================================================

/**
 * Accessible dialog title.
 */
const Title = forwardRef<HTMLHeadingElement, SheetTitleProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <DialogTitle
        ref={ref}
        className={cn("text-lg font-semibold text-text", className)}
        {...props}
      >
        {children}
      </DialogTitle>
    );
  }
);
Title.displayName = "Sheet.Title";

// =============================================================================
// Description Component
// =============================================================================

/**
 * Optional subtitle/description.
 */
const Description = forwardRef<HTMLParagraphElement, SheetDescriptionProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <DialogDescription
        ref={ref}
        className={cn("mt-1 text-sm text-text-muted", className)}
        {...props}
      >
        {children}
      </DialogDescription>
    );
  }
);
Description.displayName = "Sheet.Description";

// =============================================================================
// Body Component
// =============================================================================

/**
 * Scrollable content area.
 */
const Body = forwardRef<HTMLDivElement, SheetBodyProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(sheetBodyVariants(), className)} {...props}>
        {children}
      </div>
    );
  }
);
Body.displayName = "Sheet.Body";

// =============================================================================
// Footer Component
// =============================================================================

/**
 * Sticky footer for action buttons.
 */
const Footer = forwardRef<HTMLDivElement, SheetFooterProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(sheetFooterVariants(), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Footer.displayName = "Sheet.Footer";

// =============================================================================
// Close Component
// =============================================================================

/**
 * Programmatic close button for use anywhere in the sheet.
 */
const Close = forwardRef<HTMLButtonElement, SheetCloseProps>(
  ({ children, className, ...props }, ref) => {
    const { onClose } = useSheetContext();

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClose}
        className={className}
        {...props}
      >
        {children ?? <X size={20} aria-hidden="true" />}
      </button>
    );
  }
);
Close.displayName = "Sheet.Close";

// =============================================================================
// Compound Export
// =============================================================================

export const Sheet = Object.assign(SheetRoot, {
  Panel,
  Header,
  Title,
  Description,
  Body,
  Footer,
  Close,
});
