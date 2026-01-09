import {
  forwardRef,
  Children,
  Fragment,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

export interface DetailHeaderProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export interface DetailHeaderTopBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Label for the back button. @default "Volver" */
  backLabel?: string;
  /** Click handler for back button (use this OR backHref). */
  onBack?: () => void;
  /** Link destination for back button (use this OR onBack). */
  backHref?: string;
  /** Actions slot (buttons, menus, etc.). */
  children?: ReactNode;
}

export interface DetailHeaderMainProps extends HTMLAttributes<HTMLDivElement> {
  /** The main title (e.g., claim number, record ID). */
  title: string;
  /** Optional badge to display next to title (e.g., status badge). */
  badge?: ReactNode;
  /** Info items - separators are auto-inserted between children. */
  children?: ReactNode;
}

export interface DetailHeaderInfoItemProps extends HTMLAttributes<HTMLSpanElement> {
  /** Optional label preceding the value (e.g., "Filed", "Adjuster"). */
  label?: string;
  /** The value to display. */
  value: ReactNode;
}

// =============================================================================
// Root Component
// =============================================================================

/**
 * A compound component for detail page headers.
 *
 * @example
 * ```tsx
 * <DetailHeader>
 *   <DetailHeader.TopBar onBack={handleBack} backLabel="Volver a Reclamos">
 *     <Button variant="secondary">Editar</Button>
 *     <Button variant="primary">Cambiar Estado</Button>
 *   </DetailHeader.TopBar>
 *   <DetailHeader.Main title="#CLM-2024-001" badge={<StatusBadge status="OPEN" />}>
 *     <DetailHeader.InfoItem value="Sarah Mitchell" />
 *     <DetailHeader.InfoItem label="Enviado" value="Dec 18, 2024" />
 *     <DetailHeader.InfoItem value="$12,500" />
 *   </DetailHeader.Main>
 * </DetailHeader>
 * ```
 */
function DetailHeaderRoot({
  children,
  className,
  ...props
}: DetailHeaderProps) {
  return (
    <header
      className={cn("border-b border-border bg-background", className)}
      {...props}
    >
      {children}
    </header>
  );
}

// =============================================================================
// TopBar Component
// =============================================================================

/**
 * Top bar with back button and actions slot.
 */
const TopBar = forwardRef<HTMLDivElement, DetailHeaderTopBarProps>(
  (
    { backLabel = "Volver", onBack, backHref, children, className, ...props },
    ref
  ) => {
    const backContent = (
      <>
        <ArrowLeft className="h-[18px] w-[18px]" />
        {backLabel}
      </>
    );

    const backClassName = cn(
      "inline-flex items-center gap-2 px-3 py-2 -ml-3",
      "text-sm font-medium text-text-muted",
      "rounded-lg transition-colors",
      "hover:bg-primary/5 hover:text-primary"
    );

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between",
          "border-b border-border",
          "px-4 py-4 sm:px-6 lg:px-8",
          className
        )}
        {...props}
      >
        {backHref ? (
          <Link to={backHref} className={backClassName}>
            {backContent}
          </Link>
        ) : (
          <button type="button" onClick={onBack} className={backClassName}>
            {backContent}
          </button>
        )}

        {children && <div className="flex items-center gap-3">{children}</div>}
      </div>
    );
  }
);
TopBar.displayName = "DetailHeader.TopBar";

// =============================================================================
// Main Component
// =============================================================================

/**
 * Main section with title, badge, and info items.
 * Separators (dots) are automatically inserted between InfoItem children.
 */
const Main = forwardRef<HTMLDivElement, DetailHeaderMainProps>(
  ({ title, badge, children, className, ...props }, ref) => {
    // Filter out falsy children and auto-insert separators
    const childArray = Children.toArray(children).filter(Boolean);

    return (
      <div
        ref={ref}
        className={cn("px-4 py-6 sm:px-6 lg:px-8", className)}
        {...props}
      >
        {/* Title row */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <h1 className="text-xl font-bold tracking-tight text-text sm:text-2xl lg:text-[28px]">
            {title}
          </h1>
          {badge}
        </div>

        {/* Info items row */}
        {childArray.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-muted sm:text-[15px]">
            {childArray.map((child, index) => (
              <Fragment key={index}>
                {index > 0 && <Separator />}
                {child}
              </Fragment>
            ))}
          </div>
        )}
      </div>
    );
  }
);
Main.displayName = "DetailHeader.Main";

// =============================================================================
// InfoItem Component
// =============================================================================

/**
 * A single info item for the subtitle row.
 */
const InfoItem = forwardRef<HTMLSpanElement, DetailHeaderInfoItemProps>(
  ({ label, value, className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn("inline-flex items-center gap-1.5", className)}
        {...props}
      >
        {label && <span>{label}</span>}
        <span className="font-medium text-text">{value}</span>
      </span>
    );
  }
);
InfoItem.displayName = "DetailHeader.InfoItem";

// =============================================================================
// Separator Component
// =============================================================================

/**
 * Dot separator between info items. Automatically inserted by Main component.
 * Can also be used manually if needed.
 */
const Separator = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "h-1 w-1 flex-shrink-0 rounded-full bg-border",
          className
        )}
        aria-hidden="true"
        {...props}
      />
    );
  }
);
Separator.displayName = "DetailHeader.Separator";

// =============================================================================
// Compound Export
// =============================================================================

export const DetailHeader = Object.assign(DetailHeaderRoot, {
  TopBar,
  Main,
  InfoItem,
  Separator,
});
