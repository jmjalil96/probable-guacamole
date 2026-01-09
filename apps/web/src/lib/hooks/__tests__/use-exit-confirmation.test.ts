import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useExitConfirmation } from "../use-exit-confirmation";

describe("useExitConfirmation", () => {
  describe("initial state", () => {
    it("showDialog is false initially", () => {
      const onExit = vi.fn();
      const { result } = renderHook(() =>
        useExitConfirmation({ isDirty: false, hasFiles: false, onExit })
      );

      expect(result.current.showDialog).toBe(false);
    });
  });

  describe("requestExit", () => {
    it("calls onExit immediately when no unsaved changes", () => {
      const onExit = vi.fn();
      const { result } = renderHook(() =>
        useExitConfirmation({ isDirty: false, hasFiles: false, onExit })
      );

      act(() => {
        result.current.requestExit();
      });

      expect(onExit).toHaveBeenCalled();
      expect(result.current.showDialog).toBe(false);
    });

    it("shows dialog when form is dirty", () => {
      const onExit = vi.fn();
      const { result } = renderHook(() =>
        useExitConfirmation({ isDirty: true, hasFiles: false, onExit })
      );

      act(() => {
        result.current.requestExit();
      });

      expect(onExit).not.toHaveBeenCalled();
      expect(result.current.showDialog).toBe(true);
    });

    it("shows dialog when has files", () => {
      const onExit = vi.fn();
      const { result } = renderHook(() =>
        useExitConfirmation({ isDirty: false, hasFiles: true, onExit })
      );

      act(() => {
        result.current.requestExit();
      });

      expect(onExit).not.toHaveBeenCalled();
      expect(result.current.showDialog).toBe(true);
    });

    it("shows dialog when both dirty and has files", () => {
      const onExit = vi.fn();
      const { result } = renderHook(() =>
        useExitConfirmation({ isDirty: true, hasFiles: true, onExit })
      );

      act(() => {
        result.current.requestExit();
      });

      expect(result.current.showDialog).toBe(true);
    });
  });

  describe("confirmExit", () => {
    it("hides dialog and calls onExit", () => {
      const onExit = vi.fn();
      const { result } = renderHook(() =>
        useExitConfirmation({ isDirty: true, hasFiles: false, onExit })
      );

      // First show the dialog
      act(() => {
        result.current.requestExit();
      });
      expect(result.current.showDialog).toBe(true);

      // Then confirm
      act(() => {
        result.current.confirmExit();
      });

      expect(result.current.showDialog).toBe(false);
      expect(onExit).toHaveBeenCalled();
    });
  });

  describe("cancelExit", () => {
    it("hides dialog without calling onExit", () => {
      const onExit = vi.fn();
      const { result } = renderHook(() =>
        useExitConfirmation({ isDirty: true, hasFiles: false, onExit })
      );

      // First show the dialog
      act(() => {
        result.current.requestExit();
      });
      expect(result.current.showDialog).toBe(true);

      // Then cancel
      act(() => {
        result.current.cancelExit();
      });

      expect(result.current.showDialog).toBe(false);
      expect(onExit).not.toHaveBeenCalled();
    });
  });

  describe("function stability", () => {
    it("callbacks are stable across renders", () => {
      const onExit = vi.fn();
      const { result, rerender } = renderHook(() =>
        useExitConfirmation({ isDirty: false, hasFiles: false, onExit })
      );

      const firstRequestExit = result.current.requestExit;
      const firstConfirmExit = result.current.confirmExit;
      const firstCancelExit = result.current.cancelExit;

      rerender();

      expect(result.current.requestExit).toBe(firstRequestExit);
      expect(result.current.confirmExit).toBe(firstConfirmExit);
      expect(result.current.cancelExit).toBe(firstCancelExit);
    });
  });

  describe("prop changes", () => {
    it("updates behavior when isDirty changes", () => {
      const onExit = vi.fn();
      const { result, rerender } = renderHook(
        ({ isDirty }) =>
          useExitConfirmation({ isDirty, hasFiles: false, onExit }),
        { initialProps: { isDirty: false } }
      );

      // Initially exits without dialog
      act(() => {
        result.current.requestExit();
      });
      expect(onExit).toHaveBeenCalled();
      onExit.mockClear();

      // After becoming dirty, shows dialog
      rerender({ isDirty: true });
      act(() => {
        result.current.requestExit();
      });
      expect(onExit).not.toHaveBeenCalled();
      expect(result.current.showDialog).toBe(true);
    });
  });
});
