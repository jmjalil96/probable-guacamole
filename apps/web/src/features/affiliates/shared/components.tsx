import { RotateCw } from "lucide-react";
import { Button, Spinner } from "@/components/ui";

// =============================================================================
// Error State
// =============================================================================

export interface AffiliatesErrorStateProps {
  onRetry: () => void;
}

export function AffiliatesErrorState({ onRetry }: AffiliatesErrorStateProps) {
  return (
    <div className="mx-4 mt-4 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6 sm:mt-6 lg:mx-8">
      <span>Error al cargar afiliados. Intente nuevamente.</span>
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

export function AffiliatesFetchingOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 rounded-2xl">
      <Spinner size="lg" />
    </div>
  );
}

// =============================================================================
// Detail Error State
// =============================================================================

export interface AffiliateDetailErrorProps {
  error: Error | null;
  onBack?: () => void;
}

export function AffiliateDetailError({ error, onBack }: AffiliateDetailErrorProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <p className="text-text-muted">
        {error?.message ?? "Error al cargar el afiliado."}
      </p>
      {onBack && (
        <Button variant="secondary" onClick={onBack}>
          Volver a Afiliados
        </Button>
      )}
    </div>
  );
}
