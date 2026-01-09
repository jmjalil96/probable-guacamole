import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

export interface TabOption<T extends string> {
  /** Unique value for this tab. */
  value: T;
  /** Display label for the tab. */
  label: string;
  /** Optional count badge (e.g., number of items). */
  count?: number | undefined;
  /** Optional icon to display before label. */
  icon?: ReactNode | undefined;
}

export interface TabsProps<T extends string> {
  /** Currently active tab value. */
  value: T;
  /** Callback when tab changes. */
  onChange: (value: T) => void;
  /** Tab options to render. */
  options: TabOption<T>[];
  /** Additional class names for the container. */
  className?: string | undefined;
}

// =============================================================================
// Component
// =============================================================================

/**
 * A horizontal tabs component for navigation.
 * Follows controlled component pattern with type-safe values.
 *
 * @example
 * ```tsx
 * type Tab = "overview" | "details" | "history";
 *
 * const [activeTab, setActiveTab] = useState<Tab>("overview");
 *
 * <Tabs<Tab>
 *   value={activeTab}
 *   onChange={setActiveTab}
 *   options={[
 *     { value: "overview", label: "Overview" },
 *     { value: "details", label: "Details", count: 5 },
 *     { value: "history", label: "History", count: 12 },
 *   ]}
 * />
 * ```
 */
export function Tabs<T extends string>({
  value,
  onChange,
  options,
  className,
}: TabsProps<T>) {
  return (
    <nav
      role="tablist"
      className={cn(
        "flex overflow-x-auto border-b border-border bg-background",
        "px-4 sm:px-6 lg:px-8",
        className
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={option.label}
            onClick={() => onChange(option.value)}
            className={cn(
              // Base styles
              "relative flex items-center gap-2",
              "px-5 py-4",
              "text-sm font-medium whitespace-nowrap",
              "transition-colors",
              "border-none bg-transparent cursor-pointer",
              // State styles
              isActive ? "text-primary" : "text-text-muted hover:text-text"
            )}
          >
            {/* Icon */}
            {option.icon}

            {/* Label */}
            <span>{option.label}</span>

            {/* Count badge */}
            {option.count !== undefined && (
              <span
                className={cn(
                  "min-w-[20px] h-5 px-1.5",
                  "rounded-[10px]",
                  "text-xs font-semibold",
                  "flex items-center justify-center",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "bg-border text-text-muted"
                )}
              >
                {option.count}
              </span>
            )}

            {/* Active indicator */}
            {isActive && (
              <span
                className={cn(
                  "absolute bottom-[-1px] left-5 right-5",
                  "h-0.5 bg-primary rounded-t-sm"
                )}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
