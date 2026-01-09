import { RotateCw } from "lucide-react";
import { Button } from "../../primitives/button";

export interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
      <span>{message}</span>
      <Button variant="ghost" size="sm" onClick={onRetry}>
        <RotateCw className="h-4 w-4" />
        Reintentar
      </Button>
    </div>
  );
}
