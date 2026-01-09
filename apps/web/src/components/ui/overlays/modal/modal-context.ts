import { createContext, useContext } from "react";

// =============================================================================
// Context
// =============================================================================

export interface ModalContextValue {
  onClose: () => void;
}

export const ModalContext = createContext<ModalContextValue | null>(null);

/**
 * Hook to access Modal context from compound components.
 * Exported for advanced use cases (e.g., custom close buttons).
 */
export function useModalContext() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("Modal compound components must be used within a Modal");
  }
  return context;
}
