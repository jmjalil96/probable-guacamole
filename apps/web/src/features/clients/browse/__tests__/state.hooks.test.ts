import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useClientsFilters, useClientsTableState } from "../state.hooks";
import type { ClientsSearch } from "../schema";

// =============================================================================
// Test Fixtures
// =============================================================================

const createMockSearch = (
  overrides: Partial<ClientsSearch> = {}
): ClientsSearch => ({
  page: 1,
  limit: 20,
  sortBy: "name",
  sortOrder: "asc",
  search: undefined,
  isActive: true,
  ...overrides,
});

// =============================================================================
// useClientsFilters
// =============================================================================

describe("useClientsFilters", () => {
  let mockUpdateSearch: (updates: Partial<ClientsSearch>) => void;

  beforeEach(() => {
    mockUpdateSearch = vi.fn();
  });

  describe("filters object", () => {
    it("extracts filter values from search", () => {
      const search = createMockSearch({
        search: "test query",
        isActive: false,
      });

      const { result } = renderHook(() =>
        useClientsFilters(search, mockUpdateSearch)
      );

      expect(result.current.filters).toEqual({
        search: "test query",
        isActive: false,
      });
    });

    it("returns undefined for unset filters", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useClientsFilters(search, mockUpdateSearch)
      );

      expect(result.current.filters.search).toBeUndefined();
      expect(result.current.filters.isActive).toBe(true); // Default is true
    });
  });

  describe("active filters computation", () => {
    it("returns empty array when no filters active", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useClientsFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toEqual([]);
      expect(result.current.hasActiveFilters).toBe(false);
    });

    it("creates active filter for search", () => {
      const search = createMockSearch({ search: "test query" });

      const { result } = renderHook(() =>
        useClientsFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toHaveLength(1);
      expect(result.current.activeFilters[0]).toMatchObject({
        key: "search",
        label: "Busqueda",
        value: "test query",
      });
      expect(result.current.hasActiveFilters).toBe(true);
    });

    it("only shows isActive chip when explicitly false", () => {
      const search = createMockSearch({ isActive: true });

      const { result } = renderHook(() =>
        useClientsFilters(search, mockUpdateSearch)
      );

      expect(
        result.current.activeFilters.find((f) => f.key === "isActive")
      ).toBeUndefined();
    });

    it("creates active filter for isActive when false", () => {
      const search = createMockSearch({ isActive: false });

      const { result } = renderHook(() =>
        useClientsFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toHaveLength(1);
      expect(result.current.activeFilters[0]).toMatchObject({
        key: "isActive",
        label: "Estado",
        value: "Inactivo",
      });
    });

    it("creates multiple active filters", () => {
      const search = createMockSearch({
        search: "test",
        isActive: false,
      });

      const { result } = renderHook(() =>
        useClientsFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toHaveLength(2);
      expect(result.current.hasActiveFilters).toBe(true);
    });
  });

  describe("filter update handlers", () => {
    it("updateFilter calls updateSearch with correct key", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useClientsFilters(search, mockUpdateSearch)
      );

      act(() => {
        result.current.updateFilter("search", "new query");
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({ search: "new query" });
    });

    it("updateFilter works for isActive", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useClientsFilters(search, mockUpdateSearch)
      );

      act(() => {
        result.current.updateFilter("isActive", false);
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({ isActive: false });
    });

    it("clearAllFilters resets all filter fields to defaults", () => {
      const search = createMockSearch({
        search: "test",
        isActive: false,
      });

      const { result } = renderHook(() =>
        useClientsFilters(search, mockUpdateSearch)
      );

      act(() => {
        result.current.clearAllFilters();
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        search: undefined,
        isActive: true, // Resets to default (show active)
      });
    });
  });

  describe("active filter removal", () => {
    it("onRemove for search filter calls updateSearch", () => {
      const search = createMockSearch({ search: "test" });

      const { result } = renderHook(() =>
        useClientsFilters(search, mockUpdateSearch)
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
        useClientsFilters(search, mockUpdateSearch)
      );

      const isActiveFilter = result.current.activeFilters.find(
        (f) => f.key === "isActive"
      );

      act(() => {
        isActiveFilter?.onRemove();
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({ isActive: true });
    });
  });
});

// =============================================================================
// useClientsTableState
// =============================================================================

describe("useClientsTableState", () => {
  let mockUpdateSearch: (updates: Partial<ClientsSearch>) => void;

  beforeEach(() => {
    mockUpdateSearch = vi.fn();
  });

  describe("sorting state", () => {
    it("converts URL sort to TanStack Table format", () => {
      const search = createMockSearch({
        sortBy: "name",
        sortOrder: "asc",
      });

      const { result } = renderHook(() =>
        useClientsTableState(search, mockUpdateSearch)
      );

      expect(result.current.sorting).toEqual([{ id: "name", desc: false }]);
    });

    it("handles desc sort order", () => {
      const search = createMockSearch({
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const { result } = renderHook(() =>
        useClientsTableState(search, mockUpdateSearch)
      );

      expect(result.current.sorting).toEqual([{ id: "createdAt", desc: true }]);
    });

    it("defaults to name when sortBy is undefined", () => {
      // Use type assertion to test edge case when sortBy might be undefined
      const search = {
        ...createMockSearch({ sortOrder: "asc" }),
        sortBy: undefined,
      } as unknown as ClientsSearch;

      const { result } = renderHook(() =>
        useClientsTableState(search, mockUpdateSearch)
      );

      expect(result.current.sorting).toEqual([{ id: "name", desc: false }]);
    });

    it("onSortingChange updates URL with new sort", () => {
      const search = createMockSearch({
        sortBy: "name",
        sortOrder: "asc",
      });

      const { result } = renderHook(() =>
        useClientsTableState(search, mockUpdateSearch)
      );

      act(() => {
        result.current.onSortingChange([{ id: "createdAt", desc: true }]);
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        sortBy: "createdAt",
        sortOrder: "desc",
      });
    });

    it("onSortingChange handles function updater", () => {
      const search = createMockSearch({
        sortBy: "name",
        sortOrder: "asc",
      });

      const { result } = renderHook(() =>
        useClientsTableState(search, mockUpdateSearch)
      );

      act(() => {
        // TanStack Table typically passes a function updater
        result.current.onSortingChange(() => [{ id: "updatedAt", desc: false }]);
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        sortBy: "updatedAt",
        sortOrder: "asc",
      });
    });

    it("onSortingChange does nothing for empty array", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useClientsTableState(search, mockUpdateSearch)
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
        useClientsTableState(search, mockUpdateSearch)
      );

      expect(result.current.pagination).toEqual({
        pageIndex: 0,
        pageSize: 20,
      });
    });

    it("handles page 3 correctly", () => {
      const search = createMockSearch({ page: 3, limit: 50 });

      const { result } = renderHook(() =>
        useClientsTableState(search, mockUpdateSearch)
      );

      expect(result.current.pagination).toEqual({
        pageIndex: 2,
        pageSize: 50,
      });
    });

    it("onPaginationChange converts 0-based to 1-based page", () => {
      const search = createMockSearch({ page: 1, limit: 20 });

      const { result } = renderHook(() =>
        useClientsTableState(search, mockUpdateSearch)
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
        useClientsTableState(search, mockUpdateSearch)
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
        useClientsTableState(search, mockUpdateSearch)
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
        sortBy: "name",
        sortOrder: "desc",
      });

      const { result } = renderHook(() =>
        useClientsTableState(search, mockUpdateSearch)
      );

      // Both should reflect current state
      expect(result.current.sorting).toEqual([{ id: "name", desc: true }]);
      expect(result.current.pagination).toEqual({
        pageIndex: 1, // page 2 = index 1
        pageSize: 20,
      });

      // Changing sort doesn't change pagination
      act(() => {
        result.current.onSortingChange([{ id: "createdAt", desc: false }]);
      });

      expect(mockUpdateSearch).toHaveBeenLastCalledWith({
        sortBy: "createdAt",
        sortOrder: "asc",
      });
    });
  });
});
