import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  ClaimTransition,
  ClaimTransitionWithReason,
  ClaimTransitionResponse,
} from "shared";
import { claimKeys } from "./keys";

// =============================================================================
// Factory
// =============================================================================

type TransitionParams<T> = { id: string; data?: T };

/**
 * Creates a transition mutation hook for the specified endpoint.
 * All transition hooks share identical cache invalidation logic.
 */
function createTransitionMutation<T = ClaimTransition>(endpoint: string) {
  return function useTransition() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, data }: TransitionParams<T>) => {
        const { data: response } = await api.post<ClaimTransitionResponse>(
          `/claims/${id}/${endpoint}`,
          data ?? {}
        );
        return response;
      },
      onSuccess: (_, { id }) => {
        void queryClient.invalidateQueries({ queryKey: claimKeys.detail(id) });
        void queryClient.invalidateQueries({ queryKey: claimKeys.lists() });
      },
    });
  };
}

// =============================================================================
// Transition Hooks
// =============================================================================

// No reason required
export const useReviewClaim = createTransitionMutation("review");
export const useSubmitClaim = createTransitionMutation("submit");
export const useSettleClaim = createTransitionMutation("settle");

// Reason required
export const useReturnClaim =
  createTransitionMutation<ClaimTransitionWithReason>("return");
export const useRequestInfo =
  createTransitionMutation<ClaimTransitionWithReason>("request-info");
export const useProvideInfo =
  createTransitionMutation<ClaimTransitionWithReason>("provide-info");
export const useCancelClaim =
  createTransitionMutation<ClaimTransitionWithReason>("cancel");
