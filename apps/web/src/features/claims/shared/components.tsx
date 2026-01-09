import { RotateCw } from "lucide-react";
import { Button, Spinner } from "@/components/ui";

// =============================================================================
// Error State
// =============================================================================

export interface ClaimsErrorStateProps {
  onRetry: () => void;
}

export function ClaimsErrorState({ onRetry }: ClaimsErrorStateProps) {
  return (
    <div className="mx-4 mt-4 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6 sm:mt-6 lg:mx-8">
      <span>Error al cargar reclamos. Intente nuevamente.</span>
      <Button variant="ghost" size="sm" onClick={onRetry}>
        <RotateCw className="h-4 w-4" />
        Reintentar
      </Button>
    </div>
  );
}

// =============================================================================
// Fetching Overlay
// =============================================================================

export function ClaimsFetchingOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 rounded-2xl">
      <Spinner size="lg" />
    </div>
  );
}
