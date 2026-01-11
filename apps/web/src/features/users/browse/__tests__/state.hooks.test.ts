import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUsersFilters, useUsersTableState } from "../state.hooks";
import type { UsersSearch } from "../schema";

// =============================================================================
// Test Fixtures
// =============================================================================

const createMockSearch = (
  overrides: Partial<UsersSearch> = {}
): UsersSearch => ({
  page: 1,
  limit: 20,
  sortBy: "name",
  sortOrder: "asc",
  search: undefined,
  type: undefined,
  isActive: true,
  hasAccount: undefined,
  ...overrides,
});

// =============================================================================
// useUsersFilters
// =============================================================================

describe("useUsersFilters", () => {
  let mockUpdateSearch: (updates: Partial<UsersSearch>) => void;

  beforeEach(() => {
    mockUpdateSearch = vi.fn();
  });

  describe("filters object", () => {
    it("extracts filter values from search", () => {
      const search = createMockSearch({
        search: "test query",
        type: "employee",
        isActive: false,
        hasAccount: true,
      });

      const { result } = renderHook(() =>
        useUsersFilters(search, mockUpdateSearch)
      );

      expect(result.current.filters).toEqual({
        search: "test query",
        type: "employee",
        isActive: false,
        hasAccount: true,
      });
    });

    it("returns undefined for unset filters", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useUsersFilters(search, mockUpdateSearch)
      );

      expect(result.current.filters.search).toBeUndefined();
      expect(result.current.filters.type).toBeUndefined();
      expect(result.current.filters.isActive).toBe(true); // Default is true
      expect(result.current.filters.hasAccount).toBeUndefined();
    });
  });

  describe("active filters computation", () => {
    it("returns empty array when no filters active", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useUsersFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toEqual([]);
      expect(result.current.hasActiveFilters).toBe(false);
    });

    it("creates active filter for search", () => {
      const search = createMockSearch({ search: "test query" });

      const { result } = renderHook(() =>
        useUsersFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toHaveLength(1);
      expect(result.current.activeFilters[0]).toMatchObject({
        key: "search",
        label: "Busqueda",
        value: "test query",
      });
      expect(result.current.hasActiveFilters).toBe(true);
    });

    it("creates active filter for type with Empleado label", () => {
      const search = createMockSearch({ type: "employee" });

      const { result } = renderHook(() =>
        useUsersFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toHaveLength(1);
      expect(result.current.activeFilters[0]).toMatchObject({
        key: "type",
        label: "Tipo",
        value: "Empleado",
      });
    });

    it("creates active filter for type with Agente label", () => {
      const search = createMockSearch({ type: "agent" });

      const { result } = renderHook(() =>
        useUsersFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters[0]).toMatchObject({
        key: "type",
        label: "Tipo",
        value: "Agente",
      });
    });

    it("creates active filter for type with Admin Cliente label", () => {
      const search = createMockSearch({ type: "client_admin" });

      const { result } = renderHook(() =>
        useUsersFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters[0]).toMatchObject({
        key: "type",
        label: "Tipo",
        value: "Admin Cliente",
      });
    });

    it("creates active filter for type with Afiliado label", () => {
      const search = createMockSearch({ type: "affiliate" });

      const { result } = renderHook(() =>
        useUsersFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters[0]).toMatchObject({
        key: "type",
        label: "Tipo",
        value: "Afiliado",
      });
    });

    it("only shows isActive chip when explicitly false", () => {
      const search = createMockSearch({ isActive: true });

      const { result } = renderHook(() =>
        useUsersFilters(search, mockUpdateSearch)
      );

      expect(
        result.current.activeFilters.find((f) => f.key === "isActive")
      ).toBeUndefined();
    });

    it("creates active filter for isActive when false", () => {
      const search = createMockSearch({ isActive: false });

      const { result } = renderHook(() =>
        useUsersFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toHaveLength(1);
      expect(result.current.activeFilters[0]).toMatchObject({
        key: "isActive",
        label: "Estado",
        value: "Inactivo",
      });
    });

    it("creates active filter for hasAccount when true", () => {
      const search = createMockSearch({ hasAccount: true });

      const { result } = renderHook(() =>
        useUsersFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toHaveLength(1);
      expect(result.current.activeFilters[0]).toMatchObject({
        key: "hasAccount",
        label: "Cuenta",
        value: "Con cuenta",
      });
    });

    it("creates active filter for hasAccount when false", () => {
      const search = createMockSearch({ hasAccount: false });

      const { result } = renderHook(() =>
        useUsersFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toHaveLength(1);
      expect(result.current.activeFilters[0]).toMatchObject({
        key: "hasAccount",
        label: "Cuenta",
        value: "Sin cuenta",
      });
    });

    it("creates multiple active filters", () => {
      const search = createMockSearch({
        search: "test",
        type: "employee",
        isActive: false,
        hasAccount: true,
      });

      const { result } = renderHook(() =>
        useUsersFilters(search, mockUpdateSearch)
      );

      expect(result.current.activeFilters).toHaveLength(4);
      expect(result.current.hasActiveFilters).toBe(true);
    });
  });

  describe("filter update handlers", () => {
    it("updateFilter calls updateSearch with correct key", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useUsersFilters(search, mockUpdateSearch)
      );

      act(() => {
        result.current.updateFilter("search", "new query");
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({ search: "new query" });
    });

    it("updateFilter works for type", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useUsersFilters(search, mockUpdateSearch)
      );

      act(() => {
        result.current.updateFilter("type", "agent");
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({ type: "agent" });
    });

    it("updateFilter works for isActive", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useUsersFilters(search, mockUpdateSearch)
      );

      act(() => {
        result.current.updateFilter("isActive", false);
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({ isActive: false });
    });

    it("updateFilter works for hasAccount", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useUsersFilters(search, mockUpdateSearch)
      );

      act(() => {
        result.current.updateFilter("hasAccount", true);
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({ hasAccount: true });
    });

    it("clearAllFilters resets all filter fields to defaults", () => {
      const search = createMockSearch({
        search: "test",
        type: "employee",
        isActive: false,
        hasAccount: true,
      });

      const { result } = renderHook(() =>
        useUsersFilters(search, mockUpdateSearch)
      );

      act(() => {
        result.current.clearAllFilters();
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        search: undefined,
        type: undefined,
        isActive: true, // Resets to default (show active)
        hasAccount: undefined,
      });
    });
  });

  describe("active filter removal", () => {
    it("onRemove for search filter calls updateSearch", () => {
      const search = createMockSearch({ search: "test" });

      const { result } = renderHook(() =>
        useUsersFilters(search, mockUpdateSearch)
      );

      const searchFilter = result.current.activeFilters.find(
        (f) => f.key === "search"
      );

      act(() => {
        searchFilter?.onRemove();
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({ search: undefined });
    });

    it("onRemove for type filter clears type", () => {
      const search = createMockSearch({ type: "employee" });

      const { result } = renderHook(() =>
        useUsersFilters(search, mockUpdateSearch)
      );

      const typeFilter = result.current.activeFilters.find(
        (f) => f.key === "type"
      );

      act(() => {
        typeFilter?.onRemove();
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({ type: undefined });
    });

    it("onRemove for isActive filter resets to true", () => {
      const search = createMockSearch({ isActive: false });

      const { result } = renderHook(() =>
        useUsersFilters(search, mockUpdateSearch)
      );

      const isActiveFilter = result.current.activeFilters.find(
        (f) => f.key === "isActive"
      );

      act(() => {
        isActiveFilter?.onRemove();
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({ isActive: true });
    });

    it("onRemove for hasAccount filter clears to undefined", () => {
      const search = createMockSearch({ hasAccount: true });

      const { result } = renderHook(() =>
        useUsersFilters(search, mockUpdateSearch)
      );

      const hasAccountFilter = result.current.activeFilters.find(
        (f) => f.key === "hasAccount"
      );

      act(() => {
        hasAccountFilter?.onRemove();
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({ hasAccount: undefined });
    });
  });
});

// =============================================================================
// useUsersTableState
// =============================================================================

describe("useUsersTableState", () => {
  let mockUpdateSearch: (updates: Partial<UsersSearch>) => void;

  beforeEach(() => {
    mockUpdateSearch = vi.fn();
  });

  describe("sorting state", () => {
    it("converts URL sort to TanStack Table format", () => {
      const search = createMockSearch({
        sortBy: "email",
        sortOrder: "asc",
      });

      const { result } = renderHook(() =>
        useUsersTableState(search, mockUpdateSearch)
      );

      expect(result.current.sorting).toEqual([{ id: "email", desc: false }]);
    });

    it("handles desc sort order", () => {
      const search = createMockSearch({
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const { result } = renderHook(() =>
        useUsersTableState(search, mockUpdateSearch)
      );

      expect(result.current.sorting).toEqual([{ id: "createdAt", desc: true }]);
    });

    it("defaults to name when sortBy is undefined", () => {
      // Use type assertion to test edge case when sortBy might be undefined
      const search = {
        ...createMockSearch({ sortOrder: "asc" }),
        sortBy: undefined,
      } as unknown as UsersSearch;

      const { result } = renderHook(() =>
        useUsersTableState(search, mockUpdateSearch)
      );

      expect(result.current.sorting).toEqual([{ id: "name", desc: false }]);
    });

    it("onSortingChange updates URL with new sort", () => {
      const search = createMockSearch({
        sortBy: "name",
        sortOrder: "asc",
      });

      const { result } = renderHook(() =>
        useUsersTableState(search, mockUpdateSearch)
      );

      act(() => {
        result.current.onSortingChange([{ id: "email", desc: true }]);
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        sortBy: "email",
        sortOrder: "desc",
      });
    });

    it("onSortingChange handles function updater", () => {
      const search = createMockSearch({
        sortBy: "name",
        sortOrder: "asc",
      });

      const { result } = renderHook(() =>
        useUsersTableState(search, mockUpdateSearch)
      );

      act(() => {
        // TanStack Table typically passes a function updater
        result.current.onSortingChange(() => [{ id: "type", desc: false }]);
      });

      expect(mockUpdateSearch).toHaveBeenCalledWith({
        sortBy: "type",
        sortOrder: "asc",
      });
    });

    it("onSortingChange does nothing for empty array", () => {
      const search = createMockSearch();

      const { result } = renderHook(() =>
        useUsersTableState(search, mockUpdateSearch)
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
        useUsersTableState(search, mockUpdateSearch)
      );

      expect(result.current.pagination).toEqual({
        pageIndex: 0,
        pageSize: 20,
      });
    });

    it("handles page 3 correctly", () => {
      const search = createMockSearch({ page: 3, limit: 50 });

      const { result } = renderHook(() =>
        useUsersTableState(search, mockUpdateSearch)
      );

      expect(result.current.pagination).toEqual({
        pageIndex: 2,
        pageSize: 50,
      });
    });

    it("onPaginationChange converts 0-based to 1-based page", () => {
      const search = createMockSearch({ page: 1, limit: 20 });

      const { result } = renderHook(() =>
        useUsersTableState(search, mockUpdateSearch)
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
        useUsersTableState(search, mockUpdateSearch)
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
        useUsersTableState(search, mockUpdateSearch)
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
        sortBy: "email",
        sortOrder: "desc",
      });

      const { result } = renderHook(() =>
        useUsersTableState(search, mockUpdateSearch)
      );

      // Both should reflect current state
      expect(result.current.sorting).toEqual([{ id: "email", desc: true }]);
      expect(result.current.pagination).toEqual({
        pageIndex: 1, // page 2 = index 1
        pageSize: 20,
      });

      // Changing sort doesn't change pagination
      act(() => {
        result.current.onSortingChange([{ id: "type", desc: false }]);
      });

      expect(mockUpdateSearch).toHaveBeenLastCalledWith({
        sortBy: "type",
        sortOrder: "asc",
      });
    });
  });
});
