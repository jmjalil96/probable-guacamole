import { forwardRef, type HTMLAttributes } from "react";
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

export type AlertVariant = "error" | "warning" | "success" | "info";

export interface AlertProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> {
  /** Visual variant. @default "error" */
  variant?: AlertVariant | undefined;
  /** Alert title. */
  title?: string | undefined;
  /** Main message/description. */
  description?: string | undefined;
  /** List of items to display (e.g., field errors). */
  items?: string[] | undefined;
  /** Whether the alert can be dismissed. @default true */
  dismissible?: boolean | undefined;
  /** Callback when dismiss button is clicked. */
  onDismiss?: (() => void) | undefined;
}

// =============================================================================
// Configuration
// =============================================================================

const variantStyles: Record<AlertVariant, string> = {
  error: "bg-alert-light border-alert/20 text-alert",
  warning: "bg-warning-light border-warning/20 text-warning-text",
  success: "bg-success-light border-success/20 text-success-text",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const iconMap: Record<AlertVariant, typeof AlertCircle> = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
};

// =============================================================================
// Component
// =============================================================================

/**
 * Inline alert for displaying feedback messages with optional items list.
 * Supports error, warning, success, and info variants.
 *
 * @example
 * ```tsx
 * <Alert
 *   variant="error"
 *   title="Error al actualizar estado"
 *   description="La transicion no pudo completarse"
 *   items={["Campo requerido: motivo", "Monto debe ser positivo"]}
 *   onDismiss={() => setError(null)}
 * />
 * ```
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      variant = "error",
      title,
      description,
      items,
      dismissible = true,
      onDismiss,
      className,
      ...props
    },
    ref
  ) => {
    const Icon = iconMap[variant];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          // Base styles
          "relative rounded-lg border p-4",
          // Animation
          "animate-in fade-in-0 slide-in-from-top-2 duration-200",
          // Variant styles
          variantStyles[variant],
          className
        )}
        {...props}
      >
        <div className="flex gap-3">
          {/* Icon */}
          <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />

          {/* Content */}
          <div className="min-w-0 flex-1">
            {title && <h3 className="text-sm font-semibold">{title}</h3>}
            {description && (
              <p className={cn("text-sm", title && "mt-1")}>{description}</p>
            )}
            {items && items.length > 0 && (
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                {items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Dismiss button */}
          {dismissible && onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Cerrar alerta"
              className={cn(
                "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                "transition-colors hover:bg-black/5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40"
              )}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = "Alert";
