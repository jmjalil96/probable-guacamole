import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "../../feedback/empty-state";

export interface FeedProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  className?: string;
}

export function Feed<T>({
  items,
  renderItem,
  keyExtractor,
  emptyMessage = "No hay elementos.",
  className,
}: FeedProps<T>) {
  if (items.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-px overflow-hidden rounded-xl bg-border",
        className
      )}
    >
      {items.map((item, index) => (
        <div key={keyExtractor(item)}>{renderItem(item, index)}</div>
      ))}
    </div>
  );
}
