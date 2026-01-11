import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAffiliatesFilters, useAffiliatesTableState } from "../state.hooks";
import type { AffiliatesSearch } from "../schema";

// =============================================================================
// Test Fixtures
// =============================================================================

const createMockSearch = (
  overrides: Partial<AffiliatesSearch> = {}
): AffiliatesSearch => ({
  page: 1,
  limit: 20,
  sortBy: "lastName",
  sortOrder: "asc",
  search: undefined,
  clientId: undefined,
  isActive: true,
  hasPortalAccess: undefined,
  ...overrides,
});

// =============================================================================
// useAffiliatesFilters
// =============================================================================

describe("useAffiliatesFilters", () => {
  let mockUpdateSearch: (updates: Partial<AffiliatesSearch>) => void;

  beforeEach(() => {
    mockUpdateSearch = vi.fn();
  });

  describe("filters object", () => {
    it("extracts filter values from search", () => {
      const search = createMockSearch({
        search: "test query",
        clientId: "client-123",
        isActive: false,
        hasPortalAccess: "true",
      });

      const { result } = renderHook(() =>
        useAffiliatesFilters(search, mockUpdateSearch)
      );

      expect(result.current.filters).toEqual({
        search: "test query",
        clientId: "client-123",
        isActive: false,
        hasPortalAccess: "true",
      });
    });

    it("returns undefined for unset filters", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useAffiliatesFilters(search, mockUpdateSearch)
      );

      expect(result.current.filters.search).toBeUndefined();
      expect(result.current.filters.clientId).toBeUndefined();
      expect(result.current.filters.isActive).toBe(true); // Default is true
      expect(result.current.filters.hasPortalAccess).toBeUndefined();
    });
  });

  describe("active filters computation", () => {
    it("returns empty array when no filters active", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useAffiliatesFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toEqual([]);
      // hasActiveFilters should include clientId check
    });

    it("creates active filter for search", () => {
      const search = createMockSearch({ search: "test query" });

      const { result } = renderHook(() =>
        useAffiliatesFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toHaveLength(1);
      expect(result.current.activeFilters[0]).toMatchObject({
        key: "search",
        label: "Búsqueda",
        value: "test query",
      });
      expect(result.current.hasActiveFilters).toBe(true);
    });

    it("only shows isActive chip when explicitly false", () => {
      const search = createMockSearch({ isActive: true });

      const { result } = renderHook(() =>
        useAffiliatesFilters(search, mockUpdateSearch)
      );

      expect(
        result.current.activeFilters.find((f) => f.key === "isActive")
      ).toBeUndefined();
    });

    it("creates active filter for isActive when false", () => {
      const search = createMockSearch({ isActive: false });

      const { result } = renderHook(() =>
        useAffiliatesFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toHaveLength(1);
      expect(result.current.activeFilters[0]).toMatchObject({
        key: "isActive",
        label: "Estado",
        value: "Inactivo",
      });
    });

    it("creates active filter for hasPortalAccess with Con acceso label", () => {
      const search = createMockSearch({ hasPortalAccess: "true" });

      const { result } = renderHook(() =>
        useAffiliatesFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toHaveLength(1);
      expect(result.current.activeFilters[0]).toMatchObject({
        key: "hasPortalAccess",
        label: "Acceso Portal",
        value: "Con acceso",
      });
    });

    it("creates active filter for hasPortalAccess with Sin acceso label", () => {
      const search = createMockSearch({ hasPortalAccess: "false" });

      const { result } = renderHook(() =>
        useAffiliatesFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters[0]).toMatchObject({
        key: "hasPortalAccess",
        label: "Acceso Portal",
        value: "Sin acceso",
      });
    });

    it("creates active filter for hasPortalAccess with pending label", () => {
      const search = createMockSearch({ hasPortalAccess: "pending" });

      const { result } = renderHook(() =>
        useAffiliatesFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters[0]).toMatchObject({
        key: "hasPortalAccess",
        label: "Acceso Portal",
        value: "Invitación pendiente",
      });
    });

    it("hasActiveFilters includes clientId check", () => {
      const search = createMockSearch({ clientId: "client-123" });

      const { result } = renderHook(() =>
        useAffiliatesFilters(search, mockUpdateSearch)
      );

      // clientId is handled separately in the component, not in activeFilters
      expect(result.current.hasActiveFilters).toBe(true);
    });

    it("creates multiple active filters", () => {
      const search = createMockSearch({
        search: "test",
        isActive: false,
        hasPortalAccess: "true",
      });

      const { result } = renderHook(() =>
        useAffiliatesFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toHaveLength(3);
      expect(result.current.hasActiveFilters).toBe(true);
    });
  });

  describe("filter update handlers", () => {
    it("updateFilter calls updateSearch with correct key", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useAffiliatesFilters(search, mockUpdateSearch)
      );

      act(() => {
        result.current.updateFilter("search", "new query");
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({ search: "new query" });
    });

    it("updateFilter works for clientId", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useAffiliatesFilters(search, mockUpdateSearch)
      );

      act(() => {
        result.current.updateFilter("clientId", "client-456");
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        clientId: "client-456",
      });
    });

    it("updateFilter works for isActive", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useAffiliatesFilters(search, mockUpdateSearch)
      );

      act(() => {
        result.current.updateFilter("isActive", false);
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({ isActive: false });
    });

    it("updateFilter works for hasPortalAccess", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useAffiliatesFilters(search, mockUpdateSearch)
      );

      act(() => {
        result.current.updateFilter("hasPortalAccess", "pending");
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        hasPortalAccess: "pending",
      });
    });

    it("clearAllFilters resets all filter fields to defaults", () => {
      const search = createMockSearch({
        search: "test",
        clientId: "client-123",
        isActive: false,
        hasPortalAccess: "true",
      });

      const { result } = renderHook(() =>
        useAffiliatesFilters(search, mockUpdateSearch)
      );

      act(() => {
        result.current.clearAllFilters();
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        search: undefined,
        clientId: undefined,
        isActive: true, // Resets to default (show active)
        hasPortalAccess: undefined,
      });
    });
  });

  describe("active filter removal", () => {
    it("onRemove for search filter calls updateSearch", () => {
      const search = createMockSearch({ search: "test" });

      const { result } = renderHook(() =>
        useAffiliatesFilters(search, mockUpdateSearch)
      );

      const searchFilter = result.current.activeFilters.find(
        (f) => f.key === "search"
      );

      act(() => {
        searchFilter?.onRemove();
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({ search: undefined });
    });

    it("onRemove for isActive filter resets to true", () => {
      const search = createMockSearch({ isActive: false });

      const { result } = renderHook(() =>
        useAffiliatesFilters(search, mockUpdateSearch)
      );

      const isActiveFilter = result.current.activeFilters.find(
        (f) => f.key === "isActive"
      );

      act(() => {
        isActiveFilter?.onRemove();
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({ isActive: true });
    });

    it("onRemove for hasPortalAccess filter clears to undefined", () => {
      const search = createMockSearch({ hasPortalAccess: "true" });

      const { result } = renderHook(() =>
        useAffiliatesFilters(search, mockUpdateSearch)
      );

      const portalFilter = result.current.activeFilters.find(
        (f) => f.key === "hasPortalAccess"
      );

      act(() => {
        portalFilter?.onRemove();
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        hasPortalAccess: undefined,
      });
    });
  });
});

// =============================================================================
// useAffiliatesTableState
// =============================================================================

describe("useAffiliatesTableState", () => {
  let mockUpdateSearch: (updates: Partial<AffiliatesSearch>) => void;

  beforeEach(() => {
    mockUpdateSearch = vi.fn();
  });

  describe("sorting state", () => {
    it("converts URL sort to TanStack Table format", () => {
      const search = createMockSearch({
        sortBy: "firstName",
        sortOrder: "asc",
      });

      const { result } = renderHook(() =>
        useAffiliatesTableState(search, mockUpdateSearch)
      );

      expect(result.current.sorting).toEqual([{ id: "firstName", desc: false }]);
    });

    it("handles desc sort order", () => {
      const search = createMockSearch({
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const { result } = renderHook(() =>
        useAffiliatesTableState(search, mockUpdateSearch)
      );

      expect(result.current.sorting).toEqual([{ id: "createdAt", desc: true }]);
    });

    it("onSortingChange updates URL with new sort", () => {
      const search = createMockSearch({
        sortBy: "lastName",
        sortOrder: "asc",
      });

      const { result } = renderHook(() =>
        useAffiliatesTableState(search, mockUpdateSearch)
      );

      act(() => {
        result.current.onSortingChange([{ id: "firstName", desc: true }]);
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        sortBy: "firstName",
        sortOrder: "desc",
      });
    });

    it("onSortingChange handles function updater", () => {
      const search = createMockSearch({
        sortBy: "lastName",
        sortOrder: "asc",
      });

      const { result } = renderHook(() =>
        useAffiliatesTableState(search, mockUpdateSearch)
      );

      act(() => {
        // TanStack Table typically passes a function updater
        result.current.onSortingChange(() => [{ id: "documentNumber", desc: false }]);
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        sortBy: "documentNumber",
        sortOrder: "asc",
      });
    });

    it("onSortingChange does nothing for empty array", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useAffiliatesTableState(search, mockUpdateSearch)
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
        useAffiliatesTableState(search, mockUpdateSearch)
      );

      expect(result.current.pagination).toEqual({
        pageIndex: 0,
        pageSize: 20,
      });
    });

    it("handles page 3 correctly", () => {
      const search = createMockSearch({ page: 3, limit: 50 });

      const { result } = renderHook(() =>
        useAffiliatesTableState(search, mockUpdateSearch)
      );

      expect(result.current.pagination).toEqual({
        pageIndex: 2,
        pageSize: 50,
      });
    });

    it("onPaginationChange converts 0-based to 1-based page", () => {
      const search = createMockSearch({ page: 1, limit: 20 });

      const { result } = renderHook(() =>
        useAffiliatesTableState(search, mockUpdateSearch)
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
        useAffiliatesTableState(search, mockUpdateSearch)
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
        useAffiliatesTableState(search, mockUpdateSearch)
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
        sortBy: "firstName",
        sortOrder: "desc",
      });

      const { result } = renderHook(() =>
        useAffiliatesTableState(search, mockUpdateSearch)
      );

      // Both should reflect current state
      expect(result.current.sorting).toEqual([{ id: "firstName", desc: true }]);
      expect(result.current.pagination).toEqual({
        pageIndex: 1, // page 2 = index 1
        pageSize: 20,
      });

      // Changing sort doesn't change pagination
      act(() => {
        result.current.onSortingChange([{ id: "documentNumber", desc: false }]);
      });

      expect(mockUpdateSearch).toHaveBeenLastCalledWith({
        sortBy: "documentNumber",
        sortOrder: "asc",
      });
    });
  });
});
