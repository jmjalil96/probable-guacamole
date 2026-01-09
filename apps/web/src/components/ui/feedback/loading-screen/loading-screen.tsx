import { Spinner } from "../../primitives/spinner";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      {message && (
        <p className="text-text-muted text-sm font-medium">{message}</p>
      )}
    </div>
  );
}
