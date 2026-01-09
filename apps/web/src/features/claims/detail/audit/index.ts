// Main Component (entry point for tab)
export { ClaimAuditTab } from "./components";

// Sub-Components
export {
  AuditFeed,
  AuditFeedGroup,
  AuditFeedItem,
  AuditDot,
} from "./components";

// Hooks
export { useAuditTab } from "./hooks";

// Utilities
export {
  groupEventsByDate,
  formatRelativeTime,
  getActionColor,
  getActionLabel,
  getUserInitials,
  getEventDetail,
  ACTION_COLORS,
} from "./utils";

// Types
export type {
  AuditEventGroup,
  AuditActionColor,
  UseAuditTabReturn,
  ClaimAuditTabProps,
  AuditFeedProps,
  AuditFeedGroupProps,
  AuditFeedItemProps,
  AuditDotProps,
  EventDetail,
  FieldChange,
} from "./types";
