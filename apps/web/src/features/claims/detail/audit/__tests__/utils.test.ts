import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { AuditLogItem } from "shared";
import {
  groupEventsByDate,
  formatRelativeTime,
  getActionColor,
  getActionLabel,
  getUserInitials,
  getEventDetail,
} from "../utils";

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

// =============================================================================
// groupEventsByDate
// =============================================================================

describe("groupEventsByDate", () => {
  it("returns empty array for empty input", () => {
    expect(groupEventsByDate([])).toEqual([]);
  });

  it("groups events by date", () => {
    const events = [
      createMockEvent({ id: "1", createdAt: "2024-01-15T10:00:00Z" }),
      createMockEvent({ id: "2", createdAt: "2024-01-15T14:00:00Z" }),
      createMockEvent({ id: "3", createdAt: "2024-01-16T10:00:00Z" }),
    ];

    const groups = groupEventsByDate(events);

    expect(groups.length).toBe(2);
  });

  it("sorts events within groups by date descending", () => {
    const events = [
      createMockEvent({ id: "1", createdAt: "2024-01-15T10:00:00Z" }),
      createMockEvent({ id: "2", createdAt: "2024-01-15T14:00:00Z" }),
    ];

    const groups = groupEventsByDate(events);
    const firstGroup = groups[0];

    expect(firstGroup).toBeDefined();
    expect(firstGroup?.events[0]?.id).toBe("2"); // Later time comes first
    expect(firstGroup?.events[1]?.id).toBe("1");
  });

  it("excludes READ actions", () => {
    const events = [
      createMockEvent({ id: "1", action: "CREATE" }),
      createMockEvent({ id: "2", action: "READ" }),
      createMockEvent({ id: "3", action: "UPDATE" }),
    ];

    const groups = groupEventsByDate(events);
    const allEvents = groups.flatMap((g) => g.events);

    expect(allEvents).toHaveLength(2);
    expect(allEvents.find((e) => e.action === "READ")).toBeUndefined();
  });

  it("returns empty array when only READ events exist", () => {
    const events = [
      createMockEvent({ id: "1", action: "READ" }),
      createMockEvent({ id: "2", action: "READ" }),
    ];

    const groups = groupEventsByDate(events);

    expect(groups).toEqual([]);
  });

  it("provides date label for each group", () => {
    const events = [createMockEvent({ createdAt: "2024-01-15T10:00:00Z" })];

    const groups = groupEventsByDate(events);

    expect(groups[0]?.label).toBeDefined();
    expect(groups[0]?.label.length).toBeGreaterThan(0);
  });

  it("provides date key in yyyy-MM-dd format", () => {
    const events = [createMockEvent({ createdAt: "2024-01-15T10:00:00Z" })];

    const groups = groupEventsByDate(events);

    expect(groups[0]?.date).toBe("2024-01-15");
  });
});

// =============================================================================
// formatRelativeTime
// =============================================================================

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'ahora' for less than 1 minute ago", () => {
    const result = formatRelativeTime("2024-01-15T11:59:30Z");
    expect(result).toBe("ahora");
  });

  it("returns minutes for less than 1 hour ago", () => {
    const result = formatRelativeTime("2024-01-15T11:30:00Z");
    expect(result).toBe("30m");
  });

  it("returns hours for less than 24 hours ago", () => {
    const result = formatRelativeTime("2024-01-15T10:00:00Z");
    expect(result).toBe("2h");
  });

  it("returns '1d' for yesterday", () => {
    const result = formatRelativeTime("2024-01-14T12:00:00Z");
    expect(result).toBe("1d");
  });

  it("returns short date for older dates", () => {
    const result = formatRelativeTime("2024-01-10T12:00:00Z");
    expect(result).toMatch(/\d+ \w+/); // e.g., "10 ene"
  });
});

// =============================================================================
// getActionColor
// =============================================================================

describe("getActionColor", () => {
  it("returns 'created' for CREATE action", () => {
    expect(getActionColor("CREATE")).toBe("created");
    expect(getActionColor("CLAIM_CREATED")).toBe("created");
  });

  it("returns 'status' for status change actions", () => {
    expect(getActionColor("STATUS_CHANGE")).toBe("status");
    expect(getActionColor("UPDATE")).toBe("status");
    expect(getActionColor("CLAIM_TRANSITIONED")).toBe("status");
  });

  it("returns 'document' for file actions", () => {
    expect(getActionColor("FILE_UPLOADED")).toBe("document");
    expect(getActionColor("FILE_UPLOAD_INITIATED")).toBe("document");
    expect(getActionColor("FILE_DELETED")).toBe("document");
  });

  it("returns 'note' for note actions", () => {
    expect(getActionColor("NOTE_ADDED")).toBe("note");
    expect(getActionColor("NOTE_UPDATED")).toBe("note");
    expect(getActionColor("NOTE_DELETED")).toBe("note");
  });

  it("returns 'assigned' for assignment actions", () => {
    expect(getActionColor("CLAIM_ASSIGNED")).toBe("assigned");
    expect(getActionColor("ADJUSTER_ASSIGNED")).toBe("assigned");
  });

  it("returns 'approved' for approval actions", () => {
    expect(getActionColor("CLAIM_APPROVED")).toBe("approved");
    expect(getActionColor("CLAIM_SETTLED")).toBe("approved");
  });

  it("returns 'payment' for payment and invoice actions", () => {
    expect(getActionColor("PAYMENT_ISSUED")).toBe("payment");
    expect(getActionColor("INVOICE_ADDED")).toBe("payment");
    expect(getActionColor("INVOICE_UPDATED")).toBe("payment");
  });

  it("returns 'default' for unknown actions", () => {
    expect(getActionColor("UNKNOWN_ACTION")).toBe("default");
    expect(getActionColor("CUSTOM_ACTION")).toBe("default");
  });
});

// =============================================================================
// getActionLabel
// =============================================================================

describe("getActionLabel", () => {
  it("returns Spanish label for known actions", () => {
    expect(getActionLabel("CLAIM_CREATED")).toBe("Reclamo creado");
    expect(getActionLabel("CREATE")).toBe("Registro creado");
    expect(getActionLabel("STATUS_CHANGE")).toBe("Estado cambiado");
  });

  it("returns file-related labels", () => {
    expect(getActionLabel("FILE_UPLOADED")).toBe("Documento subido");
    expect(getActionLabel("FILE_DELETED")).toBe("Documento eliminado");
  });

  it("returns note-related labels", () => {
    expect(getActionLabel("NOTE_ADDED")).toBe("Nota agregada");
    expect(getActionLabel("NOTE_UPDATED")).toBe("Nota actualizada");
    expect(getActionLabel("NOTE_DELETED")).toBe("Nota eliminada");
  });

  it("returns invoice-related labels", () => {
    expect(getActionLabel("INVOICE_ADDED")).toBe("Factura agregada");
    expect(getActionLabel("INVOICE_UPDATED")).toBe("Factura actualizada");
    expect(getActionLabel("INVOICE_DELETED")).toBe("Factura eliminada");
  });

  it("formats unknown actions by replacing underscores", () => {
    expect(getActionLabel("CUSTOM_ACTION_NAME")).toBe("custom action name");
  });
});

// =============================================================================
// getUserInitials
// =============================================================================

describe("getUserInitials", () => {
  it("returns two initials for full name", () => {
    expect(getUserInitials("John Doe")).toBe("JD");
  });

  it("returns one initial for single name", () => {
    expect(getUserInitials("John")).toBe("J");
  });

  it("handles names with multiple parts", () => {
    expect(getUserInitials("John Michael Doe")).toBe("JD");
  });

  it("handles extra whitespace", () => {
    expect(getUserInitials("  John   Doe  ")).toBe("JD");
  });

  it("returns ? for empty string", () => {
    expect(getUserInitials("")).toBe("?");
  });

  it("returns ? for whitespace only", () => {
    expect(getUserInitials("   ")).toBe("?");
  });

  it("returns uppercase initials", () => {
    expect(getUserInitials("john doe")).toBe("JD");
  });
});

// =============================================================================
// getEventDetail
// =============================================================================

describe("getEventDetail", () => {
  describe("STATUS_CHANGE action", () => {
    it("shows status transition", () => {
      const event = createMockEvent({
        action: "STATUS_CHANGE",
        oldValue: { status: "DRAFT" },
        newValue: { status: "SUBMITTED" },
      });

      const detail = getEventDetail(event);

      expect(detail.primary).toBe("Borrador → Enviado");
    });

    it("includes reason in secondary when provided", () => {
      const event = createMockEvent({
        action: "STATUS_CHANGE",
        oldValue: { status: "SUBMITTED" },
        newValue: { status: "RETURNED" },
        metadata: { reason: "Missing documents" },
      });

      const detail = getEventDetail(event);

      expect(detail.secondary).toContain("Motivo: Missing documents");
    });

    it("includes notes in secondary when provided", () => {
      const event = createMockEvent({
        action: "STATUS_CHANGE",
        oldValue: { status: "DRAFT" },
        newValue: { status: "SUBMITTED" },
        metadata: { notes: "Ready for review" },
      });

      const detail = getEventDetail(event);

      expect(detail.secondary).toContain("Ready for review");
    });
  });

  describe("UPDATE action", () => {
    it("shows field change count", () => {
      const event = createMockEvent({
        action: "UPDATE",
        oldValue: { description: "Old", diagnosis: "Old" },
        newValue: { description: "New", diagnosis: "New" },
      });

      const detail = getEventDetail(event);

      expect(detail.primary).toContain("2 campos modificados");
    });

    it("provides field changes array", () => {
      const event = createMockEvent({
        action: "UPDATE",
        oldValue: { description: "Old description" },
        newValue: { description: "New description" },
      });

      const detail = getEventDetail(event);

      expect(detail.changes).not.toBeNull();
      expect(detail.changes).toHaveLength(1);
      expect(detail.changes![0]).toMatchObject({
        field: "description",
        label: "Descripción",
        oldValue: "Old description",
        newValue: "New description",
      });
    });

    it("excludes updatedAt and updatedById from changes", () => {
      const event = createMockEvent({
        action: "UPDATE",
        oldValue: { description: "Old", updatedAt: "2024-01-01" },
        newValue: { description: "New", updatedAt: "2024-01-02" },
      });

      const detail = getEventDetail(event);

      expect(detail.changes).toHaveLength(1);
      expect(detail.changes?.[0]?.field).toBe("description");
    });
  });

  describe("CREATE action for Claim", () => {
    it("shows claim number", () => {
      const event = createMockEvent({
        action: "CREATE",
        metadata: { claimNumber: 123 },
      });

      const detail = getEventDetail(event);

      expect(detail.primary).toBe("CLM-123");
    });

    it("shows file count when files attached", () => {
      const event = createMockEvent({
        action: "CREATE",
        metadata: { claimNumber: 123, fileCount: 3 },
      });

      const detail = getEventDetail(event);

      expect(detail.secondary).toBe("3 archivos adjuntos");
    });

    it("shows singular for one file", () => {
      const event = createMockEvent({
        action: "CREATE",
        metadata: { claimNumber: 123, fileCount: 1 },
      });

      const detail = getEventDetail(event);

      expect(detail.secondary).toBe("1 archivo adjunto");
    });
  });

  describe("FILE_UPLOAD_INITIATED action", () => {
    it("shows file name", () => {
      const event = createMockEvent({
        action: "FILE_UPLOAD_INITIATED",
        newValue: { fileName: "invoice.pdf" },
      });

      const detail = getEventDetail(event);

      expect(detail.primary).toBe("invoice.pdf");
    });

    it("shows file size and category in secondary", () => {
      const event = createMockEvent({
        action: "FILE_UPLOAD_INITIATED",
        newValue: {
          fileName: "invoice.pdf",
          fileSize: 102400,
          category: "invoice",
        },
      });

      const detail = getEventDetail(event);

      expect(detail.secondary).toContain("100.0 KB");
      expect(detail.secondary).toContain("Factura");
    });
  });

  describe("CREATE action for Invoice", () => {
    it("shows invoice number", () => {
      const event = createMockEvent({
        action: "CREATE",
        newValue: {
          invoiceNumber: "INV-001",
          providerName: "Hospital",
          amountSubmitted: "1500.00",
        },
      });

      const detail = getEventDetail(event);

      expect(detail.primary).toBe("INV-001");
    });

    it("shows provider and amount in secondary", () => {
      const event = createMockEvent({
        action: "CREATE",
        newValue: {
          invoiceNumber: "INV-001",
          providerName: "Hospital",
          amountSubmitted: "1500.00",
        },
      });

      const detail = getEventDetail(event);

      expect(detail.secondary).toContain("Hospital");
      expect(detail.secondary).toContain("$");
    });
  });

  describe("DELETE action for Invoice", () => {
    it("shows deleted invoice info", () => {
      const event = createMockEvent({
        action: "DELETE",
        oldValue: {
          invoiceNumber: "INV-001",
          providerName: "Hospital",
          amountSubmitted: "1500.00",
        },
      });

      const detail = getEventDetail(event);

      expect(detail.primary).toBe("INV-001");
      expect(detail.secondary).toContain("eliminado");
    });
  });

  describe("unknown actions", () => {
    it("returns null primary and secondary for unknown action", () => {
      const event = createMockEvent({
        action: "UNKNOWN_ACTION",
        oldValue: null,
        newValue: null,
        metadata: {},
      });

      const detail = getEventDetail(event);

      expect(detail.primary).toBeNull();
      expect(detail.secondary).toBeNull();
      expect(detail.changes).toBeNull();
    });
  });
});
