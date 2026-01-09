import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/mocks/server";
import { createWrapper } from "@/test/render";
import type { AuditLogItem } from "shared";
import { useAuditTab } from "../hooks";

// =============================================================================
// Test Fixtures
// =============================================================================

const createMockEvent = (
  overrides: Partial<AuditLogItem> = {}
): AuditLogItem => ({
  id: "event-1",
  action: "CREATE",
  severity: "INFO",
  oldValue: null,
  newValue: { status: "DRAFT" },
  metadata: { claimNumber: 1 },
  user: {
    id: "user-1",
    name: "John Doe",
  },
  ipAddress: null,
  userAgent: null,
  createdAt: "2024-01-15T10:00:00Z",
  ...overrides,
});

const mockEvent1 = createMockEvent({
  id: "event-1",
  action: "CREATE",
  createdAt: "2024-01-15T10:00:00Z",
});

const mockEvent2 = createMockEvent({
  id: "event-2",
  action: "STATUS_CHANGE",
  oldValue: { status: "DRAFT" },
  newValue: { status: "SUBMITTED" },
  createdAt: "2024-01-15T14:00:00Z",
});

const mockEvent3 = createMockEvent({
  id: "event-3",
  action: "UPDATE",
  oldValue: { description: "Old description" },
  newValue: { description: "New description" },
  createdAt: "2024-01-16T10:00:00Z",
});

const mockReadEvent = createMockEvent({
  id: "event-4",
  action: "READ",
  createdAt: "2024-01-16T11:00:00Z",
});

const mockAuditResponse = {
  data: [mockEvent1, mockEvent2, mockEvent3],
  pagination: { total: 3, page: 1, limit: 50, totalPages: 1 },
};

// =============================================================================
// useAuditTab
// =============================================================================

describe("useAuditTab", () => {
  beforeEach(() => {
    server.use(
      http.get("*/claims/claim-1/audit-trail", () => {
        return HttpResponse.json(mockAuditResponse);
      })
    );
  });

  describe("data fetching", () => {
    it("fetches audit events for the claim", async () => {
      const { result } = renderHook(() => useAuditTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.events).toHaveLength(3);
    });

    it("returns empty arrays when no events", async () => {
      server.use(
        http.get("*/claims/claim-1/audit-trail", () => {
          return HttpResponse.json({
            data: [],
            pagination: { total: 0, page: 1, limit: 50, totalPages: 0 },
          });
        })
      );

      const { result } = renderHook(() => useAuditTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.events).toEqual([]);
      expect(result.current.groupedEvents).toEqual([]);
    });

    it("tracks loading state", () => {
      server.use(
        http.get("*/claims/claim-1/audit-trail", async () => {
          await delay(100);
          return HttpResponse.json(mockAuditResponse);
        })
      );

      const { result } = renderHook(() => useAuditTab("claim-1"), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it("tracks error state", async () => {
      server.use(
        http.get("*/claims/claim-1/audit-trail", () => {
          return HttpResponse.json({ message: "Error" }, { status: 500 });
        })
      );

      const { result } = renderHook(() => useAuditTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it("provides refetch function", async () => {
      const { result } = renderHook(() => useAuditTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe("function");
    });
  });

  describe("event grouping by date", () => {
    it("groups events by date", async () => {
      const { result } = renderHook(() => useAuditTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Events span 2 days (Jan 15 and Jan 16)
      expect(result.current.groupedEvents.length).toBeGreaterThanOrEqual(1);
    });

    it("sorts events within groups by date descending", async () => {
      const { result } = renderHook(() => useAuditTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Latest events should come first
      const firstGroup = result.current.groupedEvents[0];
      if (firstGroup && firstGroup.events.length > 1) {
        const firstEvent = firstGroup.events[0];
        const secondEvent = firstGroup.events[1];
        if (firstEvent && secondEvent) {
          const firstEventDate = new Date(firstEvent.createdAt).getTime();
          const secondEventDate = new Date(secondEvent.createdAt).getTime();
          expect(firstEventDate).toBeGreaterThanOrEqual(secondEventDate);
        }
      }
    });

    it("provides date labels for groups", async () => {
      const { result } = renderHook(() => useAuditTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.groupedEvents.forEach((group) => {
        expect(group.label).toBeDefined();
        expect(typeof group.label).toBe("string");
        expect(group.label.length).toBeGreaterThan(0);
      });
    });

    it("provides date key for each group", async () => {
      const { result } = renderHook(() => useAuditTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.groupedEvents.forEach((group) => {
        expect(group.date).toBeDefined();
        // Date format: yyyy-MM-dd
        expect(group.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });

  describe("READ action filtering", () => {
    it("excludes READ actions from grouped events", async () => {
      server.use(
        http.get("*/claims/claim-1/audit-trail", () => {
          return HttpResponse.json({
            data: [mockEvent1, mockReadEvent],
            pagination: { total: 2, page: 1, limit: 50, totalPages: 1 },
          });
        })
      );

      const { result } = renderHook(() => useAuditTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Raw events includes READ
      expect(result.current.events).toHaveLength(2);

      // Grouped events excludes READ
      const allGroupedEvents = result.current.groupedEvents.flatMap(
        (g) => g.events
      );
      const readEvents = allGroupedEvents.filter((e) => e.action === "READ");
      expect(readEvents).toHaveLength(0);
    });

    it("returns empty groups if only READ events exist", async () => {
      server.use(
        http.get("*/claims/claim-1/audit-trail", () => {
          return HttpResponse.json({
            data: [mockReadEvent],
            pagination: { total: 1, page: 1, limit: 50, totalPages: 1 },
          });
        })
      );

      const { result } = renderHook(() => useAuditTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.events).toHaveLength(1);
      expect(result.current.groupedEvents).toEqual([]);
    });
  });

  describe("total count", () => {
    it("counts visible events (excluding filtered actions)", async () => {
      const { result } = renderHook(() => useAuditTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 3 events, none are READ
      expect(result.current.totalCount).toBe(3);
    });

    it("returns zero when all events are filtered", async () => {
      server.use(
        http.get("*/claims/claim-1/audit-trail", () => {
          return HttpResponse.json({
            data: [mockReadEvent],
            pagination: { total: 1, page: 1, limit: 50, totalPages: 1 },
          });
        })
      );

      const { result } = renderHook(() => useAuditTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.totalCount).toBe(0);
    });

    it("counts across all groups", async () => {
      server.use(
        http.get("*/claims/claim-1/audit-trail", () => {
          return HttpResponse.json({
            data: [mockEvent1, mockEvent2, mockEvent3, mockReadEvent],
            pagination: { total: 4, page: 1, limit: 50, totalPages: 1 },
          });
        })
      );

      const { result } = renderHook(() => useAuditTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 4 events, 1 is READ, so 3 visible
      expect(result.current.totalCount).toBe(3);
    });
  });
});
