import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FeedItemProps {
  children: ReactNode;
  className?: string;
}

export function FeedItem({ children, className }: FeedItemProps) {
  return (
    <div
      className={cn(
        "bg-background px-5 py-4 transition-colors hover:bg-border/30",
        className
      )}
    >
      {children}
    </div>
  );
}
