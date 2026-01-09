import type { ReactNode } from "react";

export interface SectionHeaderProps {
  title: string;
  count?: number;
  countLabel?: string | ((count: number) => string);
  action?: ReactNode;
  variant?: "default" | "uppercase";
  className?: string;
}

export function SectionHeader({
  title,
  count,
  countLabel,
  action,
  variant = "uppercase",
  className,
}: SectionHeaderProps) {
  const formatCount = (n: number): string => {
    if (typeof countLabel === "function") {
      return countLabel(n);
    }
    if (countLabel) {
      return `${n} ${countLabel}`;
    }
    return String(n);
  };

  const titleClasses =
    variant === "uppercase"
      ? "text-[11px] font-semibold uppercase tracking-wider text-text-muted"
      : "text-base font-semibold text-text";

  const countClasses =
    variant === "uppercase"
      ? "text-[11px] text-text-muted"
      : "text-sm text-text-muted";

  return (
    <div
      className={`mb-5 flex items-center justify-between ${className ?? ""}`}
    >
      <div className="flex items-baseline gap-2">
        <h3 className={titleClasses}>{title}</h3>
        {count !== undefined && (
          <span className={countClasses}>
            {variant === "uppercase" ? formatCount(count) : `(${count})`}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}
