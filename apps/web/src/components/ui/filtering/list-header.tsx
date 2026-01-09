import type { ReactNode } from "react";

export interface ListHeaderProps {
  title: string;
  count?: number;
  children?: ReactNode;
}

export function ListHeader({ title, count, children }: ListHeaderProps) {
  return (
    <header className="flex min-h-[72px] items-center justify-between gap-4 border-b border-border bg-background px-4 py-3 sm:px-6 lg:px-8">
      {/* Left: Title + Count */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <h1 className="truncate text-lg font-semibold tracking-tight text-text sm:text-xl">
          {title}
        </h1>
        {count !== undefined && (
          <span className="shrink-0 rounded bg-border/50 px-2 py-0.5 text-sm font-medium text-text-muted">
            {count.toLocaleString()}
          </span>
        )}
      </div>

      {/* Right: Actions slot */}
      {children && (
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {children}
        </div>
      )}
    </header>
  );
}
