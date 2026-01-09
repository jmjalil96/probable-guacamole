import {
  forwardRef,
  createContext,
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
import { AlertTriangle, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

export type AlertDialogVariant = "info" | "warning" | "danger";

export interface AlertDialogProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Callback when dialog should close. */
  onClose: (open: boolean) => void;
  /** Dialog content (typically AlertDialog.Panel). */
  children: ReactNode;
}

export interface AlertDialogPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Panel content. */
  children: ReactNode;
}

export interface AlertDialogIconProps extends HTMLAttributes<HTMLDivElement> {
  /** Icon variant determines color and icon. @default "warning" */
  variant?: AlertDialogVariant;
}

export interface AlertDialogTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Title text. */
  children: ReactNode;
}

export interface AlertDialogDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  /** Description text. */
  children: ReactNode;
}

export interface AlertDialogActionsProps extends HTMLAttributes<HTMLDivElement> {
  /** Action buttons. */
  children: ReactNode;
}

// =============================================================================
// Context
// =============================================================================

interface AlertDialogContextValue {
  onClose: () => void;
}

const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

// =============================================================================
// Variant Config
// =============================================================================

const iconConfig: Record<
  AlertDialogVariant,
  { icon: typeof Info; bgClass: string; iconClass: string }
> = {
  info: {
    icon: Info,
    bgClass: "bg-blue-50",
    iconClass: "text-blue-600",
  },
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-amber-50",
    iconClass: "text-amber-600",
  },
  danger: {
    icon: AlertCircle,
    bgClass: "bg-red-50",
    iconClass: "text-alert",
  },
};

// =============================================================================
// Root Component
// =============================================================================

/**
 * A modal dialog for confirmations, warnings, and alerts.
 * Built on Headless UI Dialog for accessibility.
 *
 * @example
 * ```tsx
 * <AlertDialog open={isOpen} onClose={setIsOpen}>
 *   <AlertDialog.Panel>
 *     <AlertDialog.Icon variant="warning" />
 *     <AlertDialog.Title>Cambios sin guardar</AlertDialog.Title>
 *     <AlertDialog.Description>
 *       ¿Está seguro que desea salir sin guardar?
 *     </AlertDialog.Description>
 *     <AlertDialog.Actions>
 *       <Button variant="secondary" onClick={() => setIsOpen(false)}>
 *         Cancelar
 *       </Button>
 *       <Button variant="destructive" onClick={handleConfirm}>
 *         Salir
 *       </Button>
 *     </AlertDialog.Actions>
 *   </AlertDialog.Panel>
 * </AlertDialog>
 * ```
 */
function AlertDialogRoot({ open, onClose, children }: AlertDialogProps) {
  return (
    <AlertDialogContext.Provider value={{ onClose: () => onClose(false) }}>
      <Dialog open={open} onClose={onClose} className="relative z-50">
        <DialogBackdrop
          className={cn(
            "fixed inset-0 bg-black/50",
            "transition-opacity duration-200 ease-out",
            "data-[closed]:opacity-0"
          )}
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          {children}
        </div>
      </Dialog>
    </AlertDialogContext.Provider>
  );
}

// =============================================================================
// Panel Component
// =============================================================================

/**
 * The dialog panel container.
 */
const Panel = forwardRef<HTMLDivElement, AlertDialogPanelProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <DialogPanel
        ref={ref}
        className={cn(
          "w-full max-w-md rounded-xl bg-background p-6 shadow-xl",
          "transition-all duration-200 ease-out",
          "data-[closed]:scale-95 data-[closed]:opacity-0",
          className
        )}
        {...props}
      >
        {children}
      </DialogPanel>
    );
  }
);
Panel.displayName = "AlertDialog.Panel";

// =============================================================================
// Icon Component
// =============================================================================

/**
 * Optional icon with variant-based styling.
 */
const Icon = forwardRef<HTMLDivElement, AlertDialogIconProps>(
  ({ variant = "warning", className, ...props }, ref) => {
    const config = iconConfig[variant];
    const IconComponent = config.icon;

    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full",
          config.bgClass,
          className
        )}
        {...props}
      >
        <IconComponent className={cn("h-6 w-6", config.iconClass)} />
      </div>
    );
  }
);
Icon.displayName = "AlertDialog.Icon";

// =============================================================================
// Title Component
// =============================================================================

/**
 * Accessible dialog title.
 */
const Title = forwardRef<HTMLHeadingElement, AlertDialogTitleProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <DialogTitle
        ref={ref}
        className={cn("text-center text-lg font-semibold text-text", className)}
        {...props}
      >
        {children}
      </DialogTitle>
    );
  }
);
Title.displayName = "AlertDialog.Title";

// =============================================================================
// Description Component
// =============================================================================

/**
 * Dialog description/message.
 */
const Description = forwardRef<
  HTMLParagraphElement,
  AlertDialogDescriptionProps
>(({ children, className, ...props }, ref) => {
  return (
    <DialogDescription
      ref={ref}
      className={cn("mt-2 text-center text-sm text-text-muted", className)}
      {...props}
    >
      {children}
    </DialogDescription>
  );
});
Description.displayName = "AlertDialog.Description";

// =============================================================================
// Actions Component
// =============================================================================

/**
 * Container for action buttons.
 */
const Actions = forwardRef<HTMLDivElement, AlertDialogActionsProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Actions.displayName = "AlertDialog.Actions";

// =============================================================================
// Compound Export
// =============================================================================

export const AlertDialog = Object.assign(AlertDialogRoot, {
  Panel,
  Icon,
  Title,
  Description,
  Actions,
});
