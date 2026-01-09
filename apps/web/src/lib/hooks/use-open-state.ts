import { useState, useCallback } from "react";

export interface OpenState {
  open: boolean;
  /** Key that increments on each open - use as component key to reset state */
  key: number;
  onOpen: () => void;
  onClose: () => void;
}

/**
 * Generic open/close state for modals, sheets, dialogs, etc.
 * Includes a key that increments on open to enable state reset via remounting.
 */
export function useOpenState(defaultOpen = false): OpenState {
  const [state, setState] = useState({ open: defaultOpen, key: 0 });

  const onOpen = useCallback(() => {
    setState((prev) => ({ open: true, key: prev.key + 1 }));
  }, []);

  const onClose = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  return { open: state.open, key: state.key, onOpen, onClose };
}
