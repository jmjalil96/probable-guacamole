import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface KanbanCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function KanbanCard({
  children,
  className,
  onClick,
  ...props
}: KanbanCardProps) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
              }
            }
          : undefined
      }
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border/60 bg-white p-4 transition-all",
        onClick &&
          "cursor-pointer hover:-translate-y-px hover:border-primary/20 hover:shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
