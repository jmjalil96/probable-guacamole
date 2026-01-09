import { useEffect } from "react";

// =============================================================================
// Hook
// =============================================================================

/**
 * Shows browser's native "Leave site?" dialog when user attempts to navigate away.
 * Handles: page refresh, tab/window close, browser back/forward, address bar navigation.
 *
 * @param enabled - Whether to show the warning. Typically derived from dirty state.
 *
 * @example
 * ```tsx
 * const isDirty = formState.isDirty || hasUploadedFiles;
 * useBeforeUnload(isDirty);
 * ```
 *
 * Note: Modern browsers show a generic message and ignore custom text for security.
 */
export function useBeforeUnload(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Setting returnValue is required for the dialog to show
      // The actual string value is ignored by modern browsers
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled]);
}
