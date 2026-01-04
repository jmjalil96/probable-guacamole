interface ErrorScreenProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorScreen({
  title = "Something went wrong",
  message = "An unexpected error occurred",
  onRetry,
}: ErrorScreenProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-alert-light rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-alert text-2xl">!</span>
        </div>
        <h1 className="text-2xl font-semibold text-text mb-2">{title}</h1>
        <p className="text-text-muted mb-6">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-hover transition-colors"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
