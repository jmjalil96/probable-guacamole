import type { AuditLogItem } from "shared";

// =============================================================================
// Date Grouping Types
// =============================================================================

export interface AuditEventGroup {
  /** Display label: "Hoy", "Ayer", or formatted date */
  label: string;
  /** ISO date string for sorting/keying */
  date: string;
  /** Events in this group */
  events: AuditLogItem[];
}

// =============================================================================
// Action Colors
// =============================================================================

export type AuditActionColor =
  | "created"
  | "status"
  | "document"
  | "note"
  | "assigned"
  | "approved"
  | "payment"
  | "default";

// =============================================================================
// Master Hook Return Type
// =============================================================================

export interface UseAuditTabReturn {
  // Data
  events: AuditLogItem[];
  groupedEvents: AuditEventGroup[];
  totalCount: number;

  // Loading States
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;
}

// =============================================================================
// Component Props
// =============================================================================

export interface ClaimAuditTabProps {
  claimId: string;
}

export interface AuditTabHeaderProps {
  count: number;
}

export interface AuditFeedProps {
  groups: AuditEventGroup[];
  emptyState?: string;
}

export interface AuditFeedGroupProps {
  group: AuditEventGroup;
}

export interface AuditFeedItemProps {
  event: AuditLogItem;
}

export interface AuditAvatarProps {
  user: { id: string; name: string } | null;
}

export interface AuditDotProps {
  action: string;
}

export interface AuditErrorStateProps {
  onRetry: () => void;
}

// =============================================================================
// Event Detail Types
// =============================================================================

export interface FieldChange {
  /** Original field name from API */
  field: string;
  /** Human-readable label */
  label: string;
  /** Previous value (formatted) */
  oldValue: string;
  /** New value (formatted) */
  newValue: string;
}

export interface EventDetail {
  /** Primary detail text (e.g., filename, invoice number, status transition) */
  primary: string | null;
  /** Secondary detail (e.g., reason, notes, provider name) */
  secondary: string | null;
  /** Field changes for UPDATE actions */
  changes: FieldChange[] | null;
}

export interface AuditFieldChangesProps {
  changes: FieldChange[];
}
