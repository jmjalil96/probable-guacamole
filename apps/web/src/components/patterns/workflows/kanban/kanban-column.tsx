import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui";

export interface KanbanColumnProps {
  title: string;
  count: number;
  /** Number of items currently loaded/displayed. Used to calculate remaining items. */
  loadedCount?: number;
  color: string;
  children: ReactNode;
  isLoading?: boolean;
  hasMore?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  emptyState?: ReactNode;
  className?: string;
}

export function KanbanColumn({
  title,
  count,
  loadedCount,
  color,
  children,
  isLoading = false,
  hasMore = false,
  isFetchingNextPage = false,
  onLoadMore,
  emptyState,
  className,
}: KanbanColumnProps) {
  const isEmpty = !isLoading && count === 0;

  return (
    <div
      className={cn(
        "flex h-full w-[340px] min-w-[340px] flex-col rounded-xl bg-border/20",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pb-3 pt-4">
        <div
          className="h-4 w-1 shrink-0 rounded-sm"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-semibold text-text">{title}</span>
        <span className="text-[13px] text-text-muted">{count}</span>
      </div>

      {/* Cards area */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : isEmpty ? (
          (emptyState ?? (
            <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
              <p className="text-[13px] text-text-muted">No items</p>
            </div>
          ))
        ) : (
          children
        )}

        {/* Load more button */}
        {hasMore && !isLoading && (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm text-primary hover:bg-primary/5 disabled:opacity-50"
          >
            {isFetchingNextPage ? (
              <>
                <Spinner size="sm" />
                <span>Cargando...</span>
              </>
            ) : (
              <span>Cargar más ({count - (loadedCount ?? 0)} restantes)</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
