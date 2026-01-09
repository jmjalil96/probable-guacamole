import { useState, useCallback } from "react";
import { useBeforeUnload } from "./use-before-unload";

// =============================================================================
// Types
// =============================================================================

export interface UseExitConfirmationOptions {
  isDirty: boolean;
  hasFiles: boolean;
  onExit: () => void;
}

export interface UseExitConfirmationReturn {
  showDialog: boolean;
  requestExit: () => void;
  confirmExit: () => void;
  cancelExit: () => void;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Manages exit confirmation dialog state.
 * Shows a confirmation dialog when there are unsaved changes.
 * Also prevents accidental browser navigation (refresh, back, close tab).
 * Reusable across any form with unsaved changes detection.
 */
export function useExitConfirmation({
  isDirty,
  hasFiles,
  onExit,
}: UseExitConfirmationOptions): UseExitConfirmationReturn {
  const [showDialog, setShowDialog] = useState(false);

  const hasUnsavedChanges = isDirty || hasFiles;

  // Prevent accidental browser navigation (refresh, back, close tab)
  useBeforeUnload(hasUnsavedChanges);

  const requestExit = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowDialog(true);
      return;
    }

    onExit();
  }, [hasUnsavedChanges, onExit]);

  const confirmExit = useCallback(() => {
    setShowDialog(false);
    onExit();
  }, [onExit]);

  const cancelExit = useCallback(() => {
    setShowDialog(false);
  }, []);

  return {
    showDialog,
    requestExit,
    confirmExit,
    cancelExit,
  };
}
