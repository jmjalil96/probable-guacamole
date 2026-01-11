import type { AffiliateDetail } from "shared";

// =============================================================================
// Master Hook Return Type
// =============================================================================

export interface UseAffiliateDetailReturn {
  // Data (affiliate is undefined while loading or on error)
  affiliate: AffiliateDetail | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;

  // Navigation
  navigateBack: () => void;
}

// =============================================================================
// Layout Props
// =============================================================================

export interface AffiliateDetailLayoutProps {
  affiliate: AffiliateDetail;
  onBack: () => void;
}
