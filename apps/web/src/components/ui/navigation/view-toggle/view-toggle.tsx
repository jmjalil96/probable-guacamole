import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ViewToggleOption<T extends string> {
  value: T;
  icon: ReactNode;
  label: string;
}

export interface ViewToggleProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: ViewToggleOption<T>[];
  className?: string;
}

export function ViewToggle<T extends string>({
  value,
  onChange,
  options,
  className,
}: ViewToggleProps<T>) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-[10px] bg-black/[0.04] p-1",
        className
      )}
      role="radiogroup"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={option.label}
            title={option.label}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex h-8 w-9 items-center justify-center rounded-lg transition-all",
              isActive
                ? "bg-white text-primary shadow-sm"
                : "text-text-muted hover:text-text"
            )}
          >
            {option.icon}
          </button>
        );
      })}
    </div>
  );
}
