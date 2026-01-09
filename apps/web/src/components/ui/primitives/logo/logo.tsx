import { cn } from "@/lib/utils";

type LogoVariant = "light" | "dark";
type LogoSize = "sm" | "md" | "lg";

const sizeClasses: Record<LogoSize, string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
};

const variantClasses: Record<LogoVariant, { base: string; highlight: string }> =
  {
    light: { base: "text-white", highlight: "text-accent" },
    dark: { base: "text-primary", highlight: "text-alert" },
  };

export interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  showTagline?: boolean;
  collapsed?: boolean;
  className?: string;
}

export function Logo({
  variant = "dark",
  size = "md",
  showTagline = false,
  collapsed = false,
  className,
}: LogoProps) {
  const colors = variantClasses[variant];

  return (
    <div className={className}>
      <h1
        className={cn(
          "font-semibold tracking-tight",
          sizeClasses[size],
          colors.base
        )}
      >
        {collapsed ? (
          <>
            C<span className={colors.highlight}>A</span>
          </>
        ) : (
          <>
            Cotizate<span className={colors.highlight}>Algo</span>
          </>
        )}
      </h1>
      {showTagline && !collapsed && (
        <p
          className={cn(
            "mt-1 text-[10px] font-normal uppercase tracking-[0.2em]",
            variant === "light" ? "text-sidebar-muted" : "text-text-muted"
          )}
        >
          Claims Manager
        </p>
      )}
    </div>
  );
}
