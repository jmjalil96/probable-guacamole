import { cn } from "@/lib/utils";
import { Spinner } from "../spinner";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "link";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "bg-white border border-border text-text hover:bg-gray-50",
  ghost: "text-text hover:bg-gray-100",
  destructive: "bg-alert text-white hover:bg-red-600",
  link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-11 w-11 p-0",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        // Base styles
        "inline-flex items-center justify-center gap-2",
        "font-medium rounded-lg transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        // Variant and size
        variantClasses[variant],
        sizeClasses[size],
        // User overrides
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : null}
      {children}
    </button>
  );
}
