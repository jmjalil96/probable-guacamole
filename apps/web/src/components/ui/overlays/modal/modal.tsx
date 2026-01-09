import { forwardRef, type ReactNode, type HTMLAttributes } from "react";
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
  modalOverlayVariants,
  modalPanelVariants,
  modalHeaderVariants,
  modalBodyVariants,
  modalFooterVariants,
} from "./modal.variants";
import { ModalContext, useModalContext } from "./modal-context";

// =============================================================================
// Types
// =============================================================================

export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

export interface ModalProps {
  /** Whether the modal is open. */
  open: boolean;
  /** Callback when modal should close. */
  onClose: (open: boolean) => void;
  /** Modal content (typically Modal.Panel). */
  children: ReactNode;
}

export interface ModalPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Panel size. @default "md" */
  size?: ModalSize;
  /** Panel content. */
  children: ReactNode;
}

export interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Header content (typically contains Modal.Title). */
  children: ReactNode;
}

export interface ModalTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Title text. */
  children: ReactNode;
}

export interface ModalDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  /** Description text. */
  children: ReactNode;
}

export interface ModalBodyProps extends HTMLAttributes<HTMLDivElement> {
  /** Body content. */
  children: ReactNode;
}

export interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Footer content (typically action buttons). */
  children: ReactNode;
}

export interface ModalCloseProps extends HTMLAttributes<HTMLButtonElement> {
  /** Optional custom content, otherwise renders X icon. */
  children?: ReactNode;
}

// =============================================================================
// Root Component
// =============================================================================

/**
 * A centered modal dialog for forms, edits, and content.
 * Built on Headless UI Dialog for accessibility.
 *
 * @example
 * ```tsx
 * <Modal open={open} onClose={setOpen}>
 *   <Modal.Panel size="md">
 *     <Modal.Header>
 *       <Modal.Title>Editar Reclamo</Modal.Title>
 *     </Modal.Header>
 *     <Modal.Body>
 *       <form>...</form>
 *     </Modal.Body>
 *     <Modal.Footer>
 *       <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
 *       <Button>Guardar</Button>
 *     </Modal.Footer>
 *   </Modal.Panel>
 * </Modal>
 * ```
 */
function ModalRoot({ open, onClose, children }: ModalProps) {
  return (
    <ModalContext.Provider value={{ onClose: () => onClose(false) }}>
      <Dialog open={open} onClose={onClose} className="relative z-50">
        <DialogBackdrop className={modalOverlayVariants()} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {children}
        </div>
      </Dialog>
    </ModalContext.Provider>
  );
}

// =============================================================================
// Panel Component
// =============================================================================

/**
 * The modal panel container.
 */
const Panel = forwardRef<HTMLDivElement, ModalPanelProps>(
  ({ size = "md", children, className, ...props }, ref) => {
    return (
      <DialogPanel
        ref={ref}
        className={cn(modalPanelVariants({ size }), className)}
        {...props}
      >
        {children}
      </DialogPanel>
    );
  }
);
Panel.displayName = "Modal.Panel";

// =============================================================================
// Header Component
// =============================================================================

/**
 * Header with close button.
 */
const Header = forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ children, className, ...props }, ref) => {
    const { onClose } = useModalContext();

    return (
      <div
        ref={ref}
        className={cn(modalHeaderVariants(), className)}
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
Header.displayName = "Modal.Header";

// =============================================================================
// Title Component
// =============================================================================

/**
 * Accessible dialog title.
 */
const Title = forwardRef<HTMLHeadingElement, ModalTitleProps>(
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
Title.displayName = "Modal.Title";

// =============================================================================
// Description Component
// =============================================================================

/**
 * Optional subtitle/description.
 */
const Description = forwardRef<HTMLParagraphElement, ModalDescriptionProps>(
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
Description.displayName = "Modal.Description";

// =============================================================================
// Body Component
// =============================================================================

/**
 * Scrollable content area.
 */
const Body = forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(modalBodyVariants(), className)} {...props}>
        {children}
      </div>
    );
  }
);
Body.displayName = "Modal.Body";

// =============================================================================
// Footer Component
// =============================================================================

/**
 * Sticky footer for action buttons.
 */
const Footer = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(modalFooterVariants(), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Footer.displayName = "Modal.Footer";

// =============================================================================
// Close Component
// =============================================================================

/**
 * Programmatic close button for use anywhere in the modal.
 */
const Close = forwardRef<HTMLButtonElement, ModalCloseProps>(
  ({ children, className, ...props }, ref) => {
    const { onClose } = useModalContext();

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
Close.displayName = "Modal.Close";

// =============================================================================
// Compound Export
// =============================================================================

export const Modal = Object.assign(ModalRoot, {
  Panel,
  Header,
  Title,
  Description,
  Body,
  Footer,
  Close,
});
