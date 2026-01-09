import type { ReactNode, ChangeEvent } from "react";
import { createContext, useContext } from "react";
import { Alert, type AlertProps, Textarea, Button } from "@/components/ui";

// Context for sharing state
interface ComposerContextValue {
  isSubmitting: boolean;
  canSubmit: boolean;
}

const ComposerContext = createContext<ComposerContextValue | null>(null);

function useComposerContext() {
  const context = useContext(ComposerContext);
  if (!context) {
    throw new Error(
      "Composer compound components must be used within Composer"
    );
  }
  return context;
}

// Main Composer component
export interface ComposerProps {
  isSubmitting: boolean;
  canSubmit: boolean;
  className?: string;
  children: ReactNode;
}

export function Composer({
  isSubmitting,
  canSubmit,
  className,
  children,
}: ComposerProps) {
  return (
    <ComposerContext.Provider value={{ isSubmitting, canSubmit }}>
      <div
        className={`rounded-xl border border-border bg-background p-6 ${className ?? ""}`}
      >
        {children}
      </div>
    </ComposerContext.Provider>
  );
}

// Error sub-component
interface ComposerErrorProps {
  error?: Pick<AlertProps, "title" | "description" | "items"> | null;
  onDismiss?: () => void;
}

function ComposerError({ error, onDismiss }: ComposerErrorProps) {
  if (!error) return null;

  return (
    <Alert
      variant="error"
      title={error.title}
      description={error.description}
      items={error.items}
      onDismiss={onDismiss}
      className="mb-4"
    />
  );
}

// Input sub-component
interface ComposerInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

function ComposerInput({
  value,
  onChange,
  placeholder = "Escriba aquí...",
  rows = 6,
}: ComposerInputProps) {
  return (
    <Textarea
      className="border-none bg-transparent"
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
        onChange(e.target.value)
      }
    />
  );
}

// Footer sub-component
interface ComposerFooterProps {
  children: ReactNode;
}

function ComposerFooter({ children }: ComposerFooterProps) {
  return <div className="mt-5 border-t border-border pt-5">{children}</div>;
}

// Submit button sub-component
interface ComposerSubmitProps {
  children: ReactNode;
  onClick?: () => void;
}

function ComposerSubmit({ children, onClick }: ComposerSubmitProps) {
  const { isSubmitting, canSubmit } = useComposerContext();

  return (
    <Button
      variant="primary"
      className="w-full"
      disabled={!canSubmit}
      loading={isSubmitting}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

// Attach sub-components
Composer.Error = ComposerError;
Composer.Input = ComposerInput;
Composer.Footer = ComposerFooter;
Composer.Submit = ComposerSubmit;
