import { RotateCw } from "lucide-react";
import { Button, Spinner } from "@/components/ui";

export interface UsersErrorStateProps {
  onRetry: () => void;
}

export function UsersErrorState({ onRetry }: UsersErrorStateProps) {
  return (
    <div className="mx-4 mt-4 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6 sm:mt-6 lg:mx-8">
      <span>Error al cargar usuarios. Intente nuevamente.</span>
      <Button variant="ghost" size="sm" onClick={onRetry}>
        <RotateCw className="h-4 w-4" />
        Reintentar
      </Button>
    </div>
  );
}

export function UsersFetchingOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/60">
      <Spinner size="lg" />
    </div>
  );
}
