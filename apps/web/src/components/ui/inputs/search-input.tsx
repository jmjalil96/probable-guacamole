import {
  forwardRef,
  useId,
  useState,
  useEffect,
  type InputHTMLAttributes,
} from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "type"
> {
  /** The current search value. */
  value: string;
  /** Callback when the search value changes. */
  onChange: (value: string) => void;
  /** Accessible label for the input. @default "Buscar" */
  label?: string;
  /** Debounce delay in ms. @default 0 (no debounce) */
  debounce?: number;
}

/**
 * A search input with an icon and styled for filter bars.
 * Supports optional debouncing for reduced API calls.
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState("");
 * <SearchInput value={search} onChange={setSearch} placeholder="Buscar..." debounce={300} />
 * ```
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      debounce = 0,
      label = "Buscar",
      placeholder = "Buscar...",
      className,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    // Internal state for immediate UI feedback
    const [localValue, setLocalValue] = useState(value);

    // Sync external value changes (e.g., clear filters)
    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    // Debounced onChange
    useEffect(() => {
      if (debounce === 0) return;
      if (localValue === value) return;

      const timer = setTimeout(() => {
        onChange(localValue);
      }, debounce);

      return () => clearTimeout(timer);
    }, [localValue, debounce, onChange, value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      if (debounce === 0) {
        onChange(newValue);
      }
    };

    return (
      <div className="relative">
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
        <Search
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          id={inputId}
          ref={ref}
          type="search"
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            "h-10 w-full min-w-[200px] rounded-lg sm:min-w-[280px]",
            "bg-border/30 pl-10 pr-3 text-sm text-text",
            "placeholder:text-text-muted",
            "border border-transparent",
            "transition-colors",
            "hover:bg-border/50",
            "focus:bg-background focus:border-primary focus:outline-none",
            "focus-visible:ring-2 focus-visible:ring-primary/40",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
