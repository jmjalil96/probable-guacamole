import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface KanbanBoardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function KanbanBoard({
  children,
  className,
  ...props
}: KanbanBoardProps) {
  return (
    <div
      className={cn(
        "h-full min-h-0 flex-1 overflow-hidden p-6 lg:px-8",
        className
      )}
      {...props}
    >
      <div className="flex h-full min-h-0 gap-5 overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-track-border/30 scrollbar-thumb-border hover:scrollbar-thumb-text-light">
        {children}
      </div>
    </div>
  );
}
