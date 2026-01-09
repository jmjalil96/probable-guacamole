import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useClaimsFilters, useClaimsTableState } from "../state.hooks";
import type { ClaimsSearch } from "../schema";

// =============================================================================
// Test Fixtures
// =============================================================================

const createMockSearch = (
  overrides: Partial<ClaimsSearch> = {}
): ClaimsSearch => ({
  view: "list",
  page: 1,
  limit: 20,
  sortBy: "createdAt",
  sortOrder: "desc",
  search: undefined,
  status: undefined,
  careType: undefined,
  submittedDateFrom: undefined,
  submittedDateTo: undefined,
  incidentDateFrom: undefined,
  incidentDateTo: undefined,
  ...overrides,
});

// =============================================================================
// useClaimsFilters
// =============================================================================

describe("useClaimsFilters", () => {
  let mockUpdateSearch: (updates: Partial<ClaimsSearch>) => void;

  beforeEach(() => {
    mockUpdateSearch = vi.fn();
  });

  describe("filters object", () => {
    it("extracts filter values from search", () => {
      const search = createMockSearch({
        search: "test query",
        status: ["DRAFT", "SUBMITTED"],
        careType: "AMBULATORY",
        submittedDateFrom: "2024-01-01",
        submittedDateTo: "2024-01-31",
        incidentDateFrom: "2024-02-01",
        incidentDateTo: "2024-02-28",
      });

      const { result } = renderHook(() =>
        useClaimsFilters(search, mockUpdateSearch)
      );

      expect(result.current.filters).toEqual({
        search: "test query",
        status: ["DRAFT", "SUBMITTED"],
        careType: "AMBULATORY",
        submittedDateFrom: "2024-01-01",
        submittedDateTo: "2024-01-31",
        incidentDateFrom: "2024-02-01",
        incidentDateTo: "2024-02-28",
      });
    });

    it("returns undefined for unset filters", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useClaimsFilters(search, mockUpdateSearch)
      );

      expect(result.current.filters.search).toBeUndefined();
      expect(result.current.filters.status).toBeUndefined();
      expect(result.current.filters.careType).toBeUndefined();
    });
  });

  describe("active filters computation", () => {
    it("returns empty array when no filters active", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useClaimsFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toEqual([]);
      expect(result.current.hasActiveFilters).toBe(false);
    });

    it("creates active filter for search", () => {
      const search = createMockSearch({ search: "test query" });

      const { result } = renderHook(() =>
        useClaimsFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toHaveLength(1);
      expect(result.current.activeFilters[0]).toMatchObject({
        key: "search",
        label: "Búsqueda",
        value: "test query",
      });
      expect(result.current.hasActiveFilters).toBe(true);
    });

    it("creates active filter for status with Spanish labels", () => {
      const search = createMockSearch({ status: ["DRAFT", "SUBMITTED"] });

      const { result } = renderHook(() =>
        useClaimsFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toHaveLength(1);
      expect(result.current.activeFilters[0]).toMatchObject({
        key: "status",
        label: "Estado",
        value: "Borrador, Enviado",
      });
    });

    it("creates active filter for careType with Spanish label", () => {
      const search = createMockSearch({ careType: "AMBULATORY" });

      const { result } = renderHook(() =>
        useClaimsFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toHaveLength(1);
      expect(result.current.activeFilters[0]).toMatchObject({
        key: "careType",
        label: "Tipo de Atención",
        value: "Ambulatorio",
      });
    });

    it("creates active filter for submitted date range", () => {
      const search = createMockSearch({
        submittedDateFrom: "2024-01-01",
        submittedDateTo: "2024-01-31",
      });

      const { result } = renderHook(() =>
        useClaimsFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toHaveLength(1);
      expect(result.current.activeFilters[0]).toMatchObject({
        key: "submittedDate",
        label: "Enviado",
      });
      // Value should contain formatted dates
      expect(result.current.activeFilters[0]?.value).toContain("-");
    });

    it("creates active filter for incident date range", () => {
      const search = createMockSearch({
        incidentDateFrom: "2024-02-01",
        incidentDateTo: "2024-02-28",
      });

      const { result } = renderHook(() =>
        useClaimsFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toHaveLength(1);
      expect(result.current.activeFilters[0]).toMatchObject({
        key: "incidentDate",
        label: "Fecha Incidente",
      });
    });

    it("handles partial date ranges (only from)", () => {
      const search = createMockSearch({
        submittedDateFrom: "2024-01-01",
      });

      const { result } = renderHook(() =>
        useClaimsFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toHaveLength(1);
      expect(result.current.activeFilters[0]?.value).toContain("...");
    });

    it("handles partial date ranges (only to)", () => {
      const search = createMockSearch({
        submittedDateTo: "2024-01-31",
      });

      const { result } = renderHook(() =>
        useClaimsFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toHaveLength(1);
      expect(result.current.activeFilters[0]?.value).toContain("...");
    });

    it("creates multiple active filters", () => {
      const search = createMockSearch({
        search: "test",
        status: ["DRAFT"],
        careType: "HOSPITALARY",
      });

      const { result } = renderHook(() =>
        useClaimsFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toHaveLength(3);
      expect(result.current.hasActiveFilters).toBe(true);
    });
  });

  describe("filter update handlers", () => {
    it("updateFilter calls updateSearch with correct key", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useClaimsFilters(search, mockUpdateSearch)
      );

      act(() => {
        result.current.updateFilter("search", "new query");
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({ search: "new query" });
    });

    it("updateFilter works for status array", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useClaimsFilters(search, mockUpdateSearch)
      );

      act(() => {
        result.current.updateFilter("status", ["DRAFT", "IN_REVIEW"]);
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        status: ["DRAFT", "IN_REVIEW"],
      });
    });

    it("clearAllFilters resets all filter fields", () => {
      const search = createMockSearch({
        search: "test",
        status: ["DRAFT"],
        careType: "AMBULATORY",
        submittedDateFrom: "2024-01-01",
        submittedDateTo: "2024-01-31",
        incidentDateFrom: "2024-02-01",
        incidentDateTo: "2024-02-28",
      });

      const { result } = renderHook(() =>
        useClaimsFilters(search, mockUpdateSearch)
      );

      act(() => {
        result.current.clearAllFilters();
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        search: undefined,
        status: undefined,
        careType: undefined,
        submittedDateFrom: undefined,
        submittedDateTo: undefined,
        incidentDateFrom: undefined,
        incidentDateTo: undefined,
      });
    });

    it("handleSubmittedDateChange formats dates correctly", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useClaimsFilters(search, mockUpdateSearch)
      );

      // Use specific date objects to avoid timezone issues
      const fromDate = new Date(2024, 0, 15); // Jan 15, 2024
      const toDate = new Date(2024, 0, 20); // Jan 20, 2024

      act(() => {
        result.current.handleSubmittedDateChange({
          from: fromDate,
          to: toDate,
        });
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        submittedDateFrom: "2024-01-15",
        submittedDateTo: "2024-01-20",
      });
    });

    it("handleSubmittedDateChange handles undefined dates", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useClaimsFilters(search, mockUpdateSearch)
      );

      act(() => {
        result.current.handleSubmittedDateChange({
          from: undefined,
          to: undefined,
        });
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        submittedDateFrom: undefined,
        submittedDateTo: undefined,
      });
    });

    it("handleIncidentDateChange formats dates correctly", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useClaimsFilters(search, mockUpdateSearch)
      );

      // Use specific date objects to avoid timezone issues
      const fromDate = new Date(2024, 1, 1); // Feb 1, 2024
      const toDate = new Date(2024, 1, 15); // Feb 15, 2024

      act(() => {
        result.current.handleIncidentDateChange({
          from: fromDate,
          to: toDate,
        });
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        incidentDateFrom: "2024-02-01",
        incidentDateTo: "2024-02-15",
      });
    });

    it("clearIncidentDate clears both incident date fields", () => {
      const search = createMockSearch({
        incidentDateFrom: "2024-02-01",
        incidentDateTo: "2024-02-28",
      });

      const { result } = renderHook(() =>
        useClaimsFilters(search, mockUpdateSearch)
      );

      act(() => {
        result.current.clearIncidentDate();
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        incidentDateFrom: undefined,
        incidentDateTo: undefined,
      });
    });
  });

  describe("active filter removal", () => {
    it("onRemove for search filter calls updateSearch", () => {
      const search = createMockSearch({ search: "test" });

      const { result } = renderHook(() =>
        useClaimsFilters(search, mockUpdateSearch)
      );

      const searchFilter = result.current.activeFilters.find(
        (f) => f.key === "search"
      );

      act(() => {
        searchFilter?.onRemove();
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({ search: undefined });
    });

    it("onRemove for status filter clears status", () => {
      const search = createMockSearch({ status: ["DRAFT", "SUBMITTED"] });

      const { result } = renderHook(() =>
        useClaimsFilters(search, mockUpdateSearch)
      );

      const statusFilter = result.current.activeFilters.find(
        (f) => f.key === "status"
      );

      act(() => {
        statusFilter?.onRemove();
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({ status: undefined });
    });

    it("onRemove for careType filter clears careType", () => {
      const search = createMockSearch({ careType: "AMBULATORY" });

      const { result } = renderHook(() =>
        useClaimsFilters(search, mockUpdateSearch)
      );

      const careTypeFilter = result.current.activeFilters.find(
        (f) => f.key === "careType"
      );

      act(() => {
        careTypeFilter?.onRemove();
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({ careType: undefined });
    });

    it("onRemove for submitted date clears both date fields", () => {
      const search = createMockSearch({
        submittedDateFrom: "2024-01-01",
        submittedDateTo: "2024-01-31",
      });

      const { result } = renderHook(() =>
        useClaimsFilters(search, mockUpdateSearch)
      );

      const dateFilter = result.current.activeFilters.find(
        (f) => f.key === "submittedDate"
      );

      act(() => {
        dateFilter?.onRemove();
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        submittedDateFrom: undefined,
        submittedDateTo: undefined,
      });
    });

    it("onRemove for incident date clears both date fields", () => {
      const search = createMockSearch({
        incidentDateFrom: "2024-02-01",
        incidentDateTo: "2024-02-28",
      });

      const { result } = renderHook(() =>
        useClaimsFilters(search, mockUpdateSearch)
      );

      const dateFilter = result.current.activeFilters.find(
        (f) => f.key === "incidentDate"
      );

      act(() => {
        dateFilter?.onRemove();
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        incidentDateFrom: undefined,
        incidentDateTo: undefined,
      });
    });
  });
});

// =============================================================================
// useClaimsTableState
// =============================================================================

describe("useClaimsTableState", () => {
  let mockUpdateSearch: (updates: Partial<ClaimsSearch>) => void;

  beforeEach(() => {
    mockUpdateSearch = vi.fn();
  });

  describe("sorting state", () => {
    it("converts URL sort to TanStack Table format", () => {
      const search = createMockSearch({
        sortBy: "claimNumber",
        sortOrder: "asc",
      });

      const { result } = renderHook(() =>
        useClaimsTableState(search, mockUpdateSearch)
      );

      expect(result.current.sorting).toEqual([
        { id: "claimNumber", desc: false },
      ]);
    });

    it("handles desc sort order", () => {
      const search = createMockSearch({
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const { result } = renderHook(() =>
        useClaimsTableState(search, mockUpdateSearch)
      );

      expect(result.current.sorting).toEqual([{ id: "createdAt", desc: true }]);
    });

    it("onSortingChange updates URL with new sort", () => {
      const search = createMockSearch({
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const { result } = renderHook(() =>
        useClaimsTableState(search, mockUpdateSearch)
      );

      act(() => {
        result.current.onSortingChange([{ id: "claimNumber", desc: false }]);
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        sortBy: "claimNumber",
        sortOrder: "asc",
      });
    });

    it("onSortingChange handles function updater", () => {
      const search = createMockSearch({
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const { result } = renderHook(() =>
        useClaimsTableState(search, mockUpdateSearch)
      );

      act(() => {
        // TanStack Table typically passes a function updater
        result.current.onSortingChange(() => [
          { id: "submittedDate", desc: true },
        ]);
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        sortBy: "submittedDate",
        sortOrder: "desc",
      });
    });

    it("onSortingChange does nothing for empty array", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useClaimsTableState(search, mockUpdateSearch)
      );

      act(() => {
        result.current.onSortingChange([]);
      });

      expect(mockUpdateSearch).not.toHaveBeenCalled();
    });
  });

  describe("pagination state", () => {
    it("converts 1-based page to 0-based pageIndex", () => {
      const search = createMockSearch({ page: 1, limit: 20 });

      const { result } = renderHook(() =>
        useClaimsTableState(search, mockUpdateSearch)
      );

      expect(result.current.pagination).toEqual({
        pageIndex: 0,
        pageSize: 20,
      });
    });

    it("handles page 3 correctly", () => {
      const search = createMockSearch({ page: 3, limit: 50 });

      const { result } = renderHook(() =>
        useClaimsTableState(search, mockUpdateSearch)
      );

      expect(result.current.pagination).toEqual({
        pageIndex: 2,
        pageSize: 50,
      });
    });

    it("onPaginationChange converts 0-based to 1-based page", () => {
      const search = createMockSearch({ page: 1, limit: 20 });

      const { result } = renderHook(() =>
        useClaimsTableState(search, mockUpdateSearch)
      );

      act(() => {
        result.current.onPaginationChange({ pageIndex: 2, pageSize: 20 });
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        page: 3, // 0-based index 2 = page 3
        limit: 20,
      });
    });

    it("onPaginationChange handles function updater", () => {
      const search = createMockSearch({ page: 2, limit: 20 });

      const { result } = renderHook(() =>
        useClaimsTableState(search, mockUpdateSearch)
      );

      act(() => {
        result.current.onPaginationChange((current) => ({
          pageIndex: current.pageIndex + 1,
          pageSize: current.pageSize,
        }));
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        page: 3, // current was page 2 (index 1), +1 = index 2 = page 3
        limit: 20,
      });
    });

    it("onPaginationChange handles page size change", () => {
      const search = createMockSearch({ page: 1, limit: 20 });

      const { result } = renderHook(() =>
        useClaimsTableState(search, mockUpdateSearch)
      );

      act(() => {
        result.current.onPaginationChange({ pageIndex: 0, pageSize: 50 });
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        page: 1,
        limit: 50,
      });
    });
  });

  describe("combined state updates", () => {
    it("sorting and pagination are independent", () => {
      const search = createMockSearch({
        page: 2,
        limit: 20,
        sortBy: "claimNumber",
        sortOrder: "asc",
      });

      const { result } = renderHook(() =>
        useClaimsTableState(search, mockUpdateSearch)
      );

      // Both should reflect current state
      expect(result.current.sorting).toEqual([
        { id: "claimNumber", desc: false },
      ]);
      expect(result.current.pagination).toEqual({
        pageIndex: 1, // page 2 = index 1
        pageSize: 20,
      });

      // Changing sort doesn't change pagination
      act(() => {
        result.current.onSortingChange([{ id: "status", desc: true }]);
      });

      expect(mockUpdateSearch).toHaveBeenLastCalledWith({
        sortBy: "status",
        sortOrder: "desc",
      });
    });
  });
});
