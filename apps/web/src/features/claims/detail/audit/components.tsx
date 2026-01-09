import {
  Spinner,
  ErrorState,
  EmptyState,
  FeedItem,
  FeedGroup,
  UserAvatar,
} from "@/components/ui";
import { SectionHeader, FieldChangesList } from "@/components/patterns";
import { cn } from "@/lib/utils";
import { useAuditTab } from "./hooks";
import {
  formatRelativeTime,
  getActionColor,
  getActionLabel,
  getEventDetail,
  ACTION_COLORS,
} from "./utils";
import type {
  ClaimAuditTabProps,
  AuditFeedProps,
  AuditFeedGroupProps,
  AuditFeedItemProps,
  AuditDotProps,
} from "./types";

// =============================================================================
// AuditDot
// =============================================================================

export function AuditDot({ action }: AuditDotProps) {
  const colorKey = getActionColor(action);
  const color = ACTION_COLORS[colorKey];

  return (
    <span
      className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}

// =============================================================================
// AuditFeedItem
// =============================================================================

export function AuditFeedItem({ event }: AuditFeedItemProps) {
  const userName = event.user?.name ?? "Sistema";
  const actionLabel = getActionLabel(event.action);
  const detail = getEventDetail(event);
  const relativeTime = formatRelativeTime(event.createdAt);

  const hasPrimary = detail.primary !== null;
  const hasSecondary = detail.secondary !== null;
  const hasChanges = detail.changes !== null && detail.changes.length > 0;
  const hasContent = hasPrimary || hasSecondary || hasChanges;

  return (
    <FeedItem>
      {/* Header Row */}
      <div className={cn("flex items-center gap-3", hasContent && "mb-2.5")}>
        <UserAvatar user={event.user} />

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <AuditDot action={event.action} />
          <span className="text-sm font-medium text-text">{actionLabel}</span>
          <span className="ml-auto text-xs text-text-muted">
            {relativeTime}
          </span>
        </div>
      </div>

      {/* Content Row */}
      {hasContent && (
        <div className="ml-11 flex flex-col gap-1">
          {hasPrimary && (
            <span className="text-[13px] font-medium text-text">
              {detail.primary}
            </span>
          )}
          {hasSecondary && (
            <span className="text-[13px] text-text-muted">
              {detail.secondary}
            </span>
          )}
          {hasChanges && <FieldChangesList changes={detail.changes!} />}
          <span className="text-xs text-text-light">{userName}</span>
        </div>
      )}

      {/* User name when no other content */}
      {!hasContent && (
        <div className="ml-11">
          <span className="text-xs text-text-light">{userName}</span>
        </div>
      )}
    </FeedItem>
  );
}

// =============================================================================
// AuditFeedGroup
// =============================================================================

export function AuditFeedGroup({ group }: AuditFeedGroupProps) {
  return (
    <FeedGroup label={group.label}>
      {group.events.map((event) => (
        <AuditFeedItem key={event.id} event={event} />
      ))}
    </FeedGroup>
  );
}

// =============================================================================
// AuditFeed
// =============================================================================

export function AuditFeed({ groups, emptyState }: AuditFeedProps) {
  if (groups.length === 0) {
    return (
      <EmptyState message={emptyState ?? "No hay actividad registrada."} />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <AuditFeedGroup key={group.date} group={group} />
      ))}
    </div>
  );
}

// =============================================================================
// ClaimAuditTab (Entry Point)
// =============================================================================

export function ClaimAuditTab({ claimId }: ClaimAuditTabProps) {
  const { groupedEvents, totalCount, isLoading, isError, refetch } =
    useAuditTab(claimId);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg border border-border bg-white">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message="Error al cargar el historial. Intente nuevamente."
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div>
      <SectionHeader
        title="Actividad"
        count={totalCount}
        countLabel={(n) => (n === 1 ? "evento" : "eventos")}
        variant="uppercase"
      />
      <AuditFeed groups={groupedEvents} />
    </div>
  );
}
