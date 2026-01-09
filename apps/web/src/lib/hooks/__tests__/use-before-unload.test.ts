import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockInstance,
} from "vitest";
import { renderHook } from "@testing-library/react";
import { useBeforeUnload } from "../use-before-unload";

describe("useBeforeUnload", () => {
  let addEventListenerSpy: MockInstance<typeof window.addEventListener>;
  let removeEventListenerSpy: MockInstance<typeof window.removeEventListener>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, "addEventListener");
    removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it("adds beforeunload listener when enabled", () => {
    renderHook(() => useBeforeUnload(true));

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function)
    );
  });

  it("does not add listener when disabled", () => {
    renderHook(() => useBeforeUnload(false));

    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function)
    );
  });

  it("removes listener on unmount", () => {
    const { unmount } = renderHook(() => useBeforeUnload(true));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function)
    );
  });

  it("removes listener when disabled after being enabled", () => {
    const { rerender } = renderHook(({ enabled }) => useBeforeUnload(enabled), {
      initialProps: { enabled: true },
    });

    rerender({ enabled: false });

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function)
    );
  });

  it("handler prevents default and sets returnValue", () => {
    renderHook(() => useBeforeUnload(true));

    // Get the handler that was registered
    const calls = addEventListenerSpy.mock.calls;
    const beforeUnloadCall = calls.find((call) => call[0] === "beforeunload");
    const handler = beforeUnloadCall?.[1] as EventListener | undefined;

    expect(handler).toBeDefined();

    // Create a mock BeforeUnloadEvent
    const event = {
      preventDefault: vi.fn(),
      returnValue: undefined as unknown,
    } as unknown as BeforeUnloadEvent;

    handler!(event);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.returnValue).toBe("");
  });
});
