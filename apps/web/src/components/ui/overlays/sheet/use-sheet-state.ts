import { useOpenState, type OpenState } from "@/lib/hooks";

export interface UseSheetStateReturn {
  desktopOpen: boolean;
  mobileOpen: boolean;
  openDesktop: () => void;
  closeDesktop: () => void;
  openMobile: () => void;
  closeMobile: () => void;
  // Grouped format (consistent with other state hooks)
  desktop: OpenState;
  mobile: OpenState;
}

/**
 * Manages responsive sheet open/close state for desktop and mobile variants.
 * Pure UI state with no external dependencies - reusable across all list views.
 */
export function useSheetState(): UseSheetStateReturn {
  const desktop = useOpenState();
  const mobile = useOpenState();

  return {
    // Legacy flat format
    desktopOpen: desktop.open,
    mobileOpen: mobile.open,
    openDesktop: desktop.onOpen,
    closeDesktop: desktop.onClose,
    openMobile: mobile.onOpen,
    closeMobile: mobile.onClose,
    // Grouped format
    desktop,
    mobile,
  };
}
