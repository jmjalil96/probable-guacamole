import { forwardRef, useState, useEffect, useRef } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerVariants, popoverContentVariants } from "./popover.variants";

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  /** Available options to select from. */
  options: MultiSelectOption[];
  /** Currently selected values. */
  value: string[];
  /** Callback when selection changes. */
  onChange: (value: string[]) => void;
  /** Placeholder when no options are selected. @default "Select..." */
  placeholder?: string;
  /** Accessible label for the trigger button. @default "Select options" */
  label?: string;
  /** Size variant. "sm" for filter bars, "md" for forms. @default "sm" */
  size?: "sm" | "md";
  /** Disables the select. @default false */
  disabled?: boolean;
  /** Shows error styling. @default false */
  error?: boolean;
  /** Additional CSS classes for the trigger button. */
  className?: string;
}

/**
 * A multi-select dropdown with checkboxes.
 * Supports keyboard navigation and displays count when multiple items are selected.
 *
 * @example
 * ```tsx
 * const [selected, setSelected] = useState<string[]>([]);
 * <MultiSelect
 *   options={[{ value: "a", label: "Option A" }, { value: "b", label: "Option B" }]}
 *   value={selected}
 *   onChange={setSelected}
 *   placeholder="Select options..."
 * />
 * ```
 */
export const MultiSelect = forwardRef<HTMLButtonElement, MultiSelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = "Select...",
      label = "Select options",
      size = "sm",
      disabled = false,
      error = false,
      className,
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);
    const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

    const toggleOption = (optionValue: string) => {
      if (value.includes(optionValue)) {
        onChange(value.filter((v) => v !== optionValue));
      } else {
        onChange([...value, optionValue]);
      }
    };

    const getDisplayText = () => {
      if (value.length === 0) return placeholder;
      if (value.length === 1) {
        return options.find((o) => o.value === value[0])?.label ?? value[0];
      }
      return `${value.length} selected`;
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (options.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((i) => Math.min(i + 1, options.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Home":
          e.preventDefault();
          setHighlightedIndex(0);
          break;
        case "End":
          e.preventDefault();
          setHighlightedIndex(options.length - 1);
          break;
        case " ":
        case "Enter":
          e.preventDefault();
          if (options[highlightedIndex]) {
            toggleOption(options[highlightedIndex].value);
          }
          break;
      }
    };

    // Clamp highlighted index when options change
    const clampedHighlightedIndex =
      options.length === 0 ? 0 : Math.min(highlightedIndex, options.length - 1);

    // Focus the highlighted option when it changes
    useEffect(() => {
      optionRefs.current[clampedHighlightedIndex]?.focus();
    }, [clampedHighlightedIndex]);

    const handleOpenChange = (isOpen: boolean) => {
      if (disabled) return;
      setOpen(isOpen);
      if (isOpen) {
        setHighlightedIndex(0);
      }
    };

    return (
      <Popover.Root open={open} onOpenChange={handleOpenChange}>
        <Popover.Trigger asChild>
          <button
            ref={ref}
            type="button"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label={label}
            className={cn(
              triggerVariants({ size, error }),
              value.length === 0 ? "text-text-muted" : "text-text",
              className
            )}
          >
            <span className="truncate">{getDisplayText()}</span>
            <ChevronDown
              size={16}
              className={cn(
                "shrink-0 text-text-muted transition-transform",
                open && "rotate-180"
              )}
              aria-hidden="true"
            />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            role="listbox"
            aria-label={label}
            aria-multiselectable="true"
            sideOffset={8}
            align="start"
            onKeyDown={handleKeyDown}
            className={popoverContentVariants()}
          >
            <div ref={listRef} className="flex flex-col">
              {options.map((option, index) => {
                const isSelected = value.includes(option.value);
                const isHighlighted = index === clampedHighlightedIndex;

                return (
                  <div
                    key={option.value}
                    ref={(el) => {
                      optionRefs.current[index] = el;
                    }}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={isHighlighted ? 0 : -1}
                    onClick={() => toggleOption(option.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-text",
                      "outline-none transition-colors",
                      "hover:bg-primary/5 focus:bg-primary/5",
                      isHighlighted && "bg-primary/5"
                    )}
                  >
                    <div
                      aria-hidden="true"
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded",
                        "border transition-colors",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-border bg-background"
                      )}
                    >
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <span>{option.label}</span>
                  </div>
                );
              })}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    );
  }
);

MultiSelect.displayName = "MultiSelect";
