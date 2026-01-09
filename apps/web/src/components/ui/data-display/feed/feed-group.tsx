import type { ReactNode } from "react";

export interface FeedGroupProps {
  label: string;
  children: ReactNode;
}

export function FeedGroup({ label, children }: FeedGroupProps) {
  return (
    <div>
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </div>
      <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-border">
        {children}
      </div>
    </div>
  );
}
