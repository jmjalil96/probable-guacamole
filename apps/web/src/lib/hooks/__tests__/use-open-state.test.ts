import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOpenState } from "../use-open-state";

describe("useOpenState", () => {
  describe("initialization", () => {
    it("defaults to closed", () => {
      const { result } = renderHook(() => useOpenState());
      expect(result.current.open).toBe(false);
      expect(result.current.key).toBe(0);
    });

    it("can be initialized as open", () => {
      const { result } = renderHook(() => useOpenState(true));
      expect(result.current.open).toBe(true);
    });
  });

  describe("onOpen", () => {
    it("sets open to true", () => {
      const { result } = renderHook(() => useOpenState());

      act(() => {
        result.current.onOpen();
      });

      expect(result.current.open).toBe(true);
    });

    it("increments key on each open", () => {
      const { result } = renderHook(() => useOpenState());

      expect(result.current.key).toBe(0);

      act(() => {
        result.current.onOpen();
      });
      expect(result.current.key).toBe(1);

      act(() => {
        result.current.onClose();
        result.current.onOpen();
      });
      expect(result.current.key).toBe(2);
    });
  });

  describe("onClose", () => {
    it("sets open to false", () => {
      const { result } = renderHook(() => useOpenState(true));

      act(() => {
        result.current.onClose();
      });

      expect(result.current.open).toBe(false);
    });

    it("does not change key on close", () => {
      const { result } = renderHook(() => useOpenState());

      act(() => {
        result.current.onOpen();
      });
      const keyAfterOpen = result.current.key;

      act(() => {
        result.current.onClose();
      });

      expect(result.current.key).toBe(keyAfterOpen);
    });
  });

  describe("function stability", () => {
    it("onOpen is stable across renders", () => {
      const { result, rerender } = renderHook(() => useOpenState());

      const firstOnOpen = result.current.onOpen;
      rerender();
      const secondOnOpen = result.current.onOpen;

      expect(firstOnOpen).toBe(secondOnOpen);
    });

    it("onClose is stable across renders", () => {
      const { result, rerender } = renderHook(() => useOpenState());

      const firstOnClose = result.current.onClose;
      rerender();
      const secondOnClose = result.current.onClose;

      expect(firstOnClose).toBe(secondOnClose);
    });
  });
});
