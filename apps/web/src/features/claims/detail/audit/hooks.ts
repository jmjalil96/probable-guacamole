import { useMemo } from "react";
import { useClaimAuditTrail } from "../../api";
import { groupEventsByDate } from "./utils";
import type { UseAuditTabReturn } from "./types";

// =============================================================================
// useAuditTab (Master Orchestration Hook)
// =============================================================================

/**
 * Main orchestration hook for the audit tab.
 * Follows the same pattern as useDocumentsTab and useInvoicesTab.
 */
export function useAuditTab(claimId: string): UseAuditTabReturn {
  // ---------------------------------------------------------------------------
  // 1. Data Fetching
  // ---------------------------------------------------------------------------
  const { data, isLoading, isError, refetch } = useClaimAuditTrail(claimId, {
    page: 1,
    limit: 50,
  });

  // ---------------------------------------------------------------------------
  // 2. Data Transformation
  // ---------------------------------------------------------------------------
  const events = useMemo(() => data?.data ?? [], [data]);

  const groupedEvents = useMemo(() => groupEventsByDate(events), [events]);

  // Count visible events (excluding filtered actions like READ)
  const totalCount = useMemo(
    () => groupedEvents.reduce((sum, group) => sum + group.events.length, 0),
    [groupedEvents]
  );

  // ---------------------------------------------------------------------------
  // 3. Return Composed Interface
  // ---------------------------------------------------------------------------
  return {
    // Data
    events,
    groupedEvents,
    totalCount,

    // Loading States
    isLoading,
    isError,
    refetch,
  };
}
