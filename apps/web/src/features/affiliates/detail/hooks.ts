import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAffiliate } from "../api";
import type { UseAffiliateDetailReturn } from "./types";

// =============================================================================
// useAffiliateDetail (Master Orchestration)
// =============================================================================

/**
 * Main orchestration hook for the affiliate detail page.
 * Simpler than claims - no transitions, modals, or tabs.
 */
export function useAffiliateDetail(
  affiliateId: string
): UseAffiliateDetailReturn {
  // ---------------------------------------------------------------------------
  // 1. Data Fetching
  // ---------------------------------------------------------------------------
  const { data: affiliate, isLoading, isError, error } = useAffiliate(affiliateId);

  // ---------------------------------------------------------------------------
  // 2. Navigation
  // ---------------------------------------------------------------------------
  const navigate = useNavigate();

  const navigateBack = useCallback(() => {
    void navigate({ to: "/affiliates" });
  }, [navigate]);

  // ---------------------------------------------------------------------------
  // 3. Return Composed Interface
  // ---------------------------------------------------------------------------
  return {
    // Data
    affiliate,
    isLoading,
    isError,
    error,

    // Navigation
    navigateBack,
  };
}
