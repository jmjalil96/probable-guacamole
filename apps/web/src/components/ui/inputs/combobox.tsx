/**
 * Combobox - Async searchable select component
 *
 * External Library:
 * - downshift (https://github.com/downshift-js/downshift)
 * - License: MIT
 * - Used for: Keyboard navigation, ARIA combobox pattern, state management
 */

import {
  useState,
  useId,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  type MouseEvent,
} from "react";
import { useCombobox } from "downshift";
import * as Popover from "@radix-ui/react-popover";
import { Search, Loader2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { popoverContentVariants } from "./popover.variants";

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  /** The currently selected option. */
  value: ComboboxOption | null;
  /** Callback when selection changes. */
  onChange: (option: ComboboxOption | null) => void;
  /** Async function to fetch options based on search query. */
  onSearch: (query: string) => Promise<ComboboxOption[]>;
  /** Input placeholder text. @default "Search..." */
  placeholder?: string;
  /** Accessible label for the input. @default "Search" */
  label?: string;
  /** Disables the combobox. @default false */
  disabled?: boolean;
  /** Shows error styling. @default false */
  error?: boolean;
  /** Size variant. "sm" for filter bars, "md" for forms. @default "sm" */
  size?: "sm" | "md";
  /** Debounce delay for search in milliseconds. @default 300 */
  debounceMs?: number;
  /** Additional CSS classes for the container. */
  className?: string;
}

/**
 * An async searchable select component with keyboard navigation.
 * Fetches options dynamically based on user input with debouncing.
 *
 * @example
 * ```tsx
 * <Combobox
 *   value={selectedUser}
 *   onChange={setSelectedUser}
 *   onSearch={async (query) => fetchUsers(query)}
 *   placeholder="Search users..."
 * />
 * ```
 */
export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(
  (
    {
      value,
      onChange,
      onSearch,
      placeholder = "Search...",
      label = "Search",
      disabled = false,
      error = false,
      size = "sm",
      debounceMs = 300,
      className,
    },
    ref
  ) => {
    const [options, setOptions] = useState<ComboboxOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const generatedId = useId();
    const internalRef = useRef<HTMLInputElement>(null);

    // Refs for debounced search
    const searchSeqRef = useRef(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
      undefined
    );
    const onSearchRef = useRef(onSearch);

    // Keep onSearch ref updated
    useEffect(() => {
      onSearchRef.current = onSearch;
    }, [onSearch]);

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, []);

    const performSearch = useCallback(async (query: string, seq: number) => {
      try {
        const results = await onSearchRef.current(query);
        if (seq !== searchSeqRef.current) return;
        setOptions(results);
        setIsLoading(false);
      } catch {
        if (seq !== searchSeqRef.current) return;
        setOptions([]);
        setIsLoading(false);
      }
    }, []);

    const debouncedSearch = useCallback(
      (query: string) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        const seq = ++searchSeqRef.current;
        timeoutRef.current = setTimeout(() => {
          void performSearch(query, seq);
        }, debounceMs);
      },
      [debounceMs, performSearch]
    );

    const cancelSearch = useCallback(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }, []);

    const invalidateSearch = useCallback(() => {
      searchSeqRef.current++;
    }, []);

    const {
      isOpen,
      getMenuProps,
      getInputProps,
      getItemProps,
      highlightedIndex,
      openMenu,
      closeMenu,
      setInputValue,
    } = useCombobox({
      items: options,
      selectedItem: value,
      itemToString: (item) => item?.label ?? "",
      onSelectedItemChange: ({ selectedItem }) => {
        onChange(selectedItem ?? null);
        closeMenu();
      },
      onInputValueChange: ({ inputValue, type }) => {
        if (type !== useCombobox.stateChangeTypes.InputChange) return;
        const q = (inputValue ?? "").trim();
        if (!q) {
          cancelSearch();
          invalidateSearch();
          setIsLoading(false);
          setHasSearched(false);
          setOptions([]);
          closeMenu();
          return;
        }
        setHasSearched(true);
        setIsLoading(true);
        openMenu();
        debouncedSearch(q);
      },
    });

    const handleClear = (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      cancelSearch();
      invalidateSearch();
      onChange(null);
      setInputValue("");
      setOptions([]);
      setHasSearched(false);
      setIsLoading(false);
      closeMenu();
      internalRef.current?.focus();
    };

    const showEmpty = hasSearched && !isLoading && options.length === 0;
    const showDropdown =
      isOpen && (isLoading || options.length > 0 || showEmpty);

    // Merge refs for input
    const inputProps = getInputProps(
      {
        id: generatedId,
        disabled,
        onFocus: () => {
          if (options.length > 0 || hasSearched) openMenu();
        },
      },
      { suppressRefError: true }
    );

    return (
      <Popover.Root
        open={showDropdown}
        onOpenChange={(next) => {
          if (!next) {
            cancelSearch();
            closeMenu();
          }
        }}
      >
        <div className="relative">
          <label htmlFor={generatedId} className="sr-only">
            {label}
          </label>

          <Popover.Trigger asChild>
            <div
              className={cn(
                "flex items-center gap-2 border transition-colors",
                // Size variants
                size === "sm"
                  ? "h-10 px-3 rounded-lg bg-background"
                  : "h-11 px-4 rounded-xl bg-white",
                // Error/default border
                error
                  ? "border-alert focus-within:border-alert focus-within:ring-alert/10"
                  : "border-border hover:border-text-light focus-within:border-primary",
                // Focus ring based on size
                size === "sm"
                  ? "focus-within:ring-2 focus-within:ring-primary/40"
                  : "focus-within:ring-4 focus-within:ring-primary/10",
                disabled && "cursor-not-allowed opacity-50",
                className
              )}
            >
              <Search
                size={16}
                className="shrink-0 text-text-muted"
                aria-hidden="true"
              />
              <input
                {...inputProps}
                ref={(node) => {
                  internalRef.current = node;
                  if (typeof ref === "function") {
                    ref(node);
                  } else if (ref) {
                    ref.current = node;
                  }
                }}
                placeholder={placeholder}
                className={cn(
                  "flex-1 bg-transparent text-sm text-text outline-none",
                  "placeholder:text-text-muted",
                  "disabled:cursor-not-allowed"
                )}
              />
              {value && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label="Clear selection"
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded",
                    "text-text-muted/70 transition-colors",
                    "hover:bg-alert/10 hover:text-alert",
                    "focus:outline-none"
                  )}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </div>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              {...getMenuProps({}, { suppressRefError: true })}
              sideOffset={8}
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
              className={popoverContentVariants({ size: "default" })}
              style={{ width: "var(--radix-popover-trigger-width)" }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-text-muted">
                  <Loader2
                    size={14}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  Loading...
                </div>
              ) : showEmpty ? (
                <div className="px-3 py-2 text-sm text-text-muted">
                  No results found
                </div>
              ) : (
                options.map((option, index) => (
                  <div
                    key={option.value}
                    {...getItemProps({ item: option, index })}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-3",
                      "px-4 py-2.5 text-sm text-text outline-none transition-colors",
                      highlightedIndex === index && "bg-primary/5"
                    )}
                  >
                    <span>{option.label}</span>
                    {value?.value === option.value && (
                      <Check
                        size={14}
                        className="text-primary"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                ))
              )}
            </Popover.Content>
          </Popover.Portal>
        </div>
      </Popover.Root>
    );
  }
);
Combobox.displayName = "Combobox";
