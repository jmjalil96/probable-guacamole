import { useState, useMemo } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/react";
import { ChevronDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "../primitives/spinner";
import { inputTriggerVariants, optionVariants } from "./popover.variants";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  /** Size variant. "sm" for filter bars, "md" for forms. @default "md" */
  size?: "sm" | "md";
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  emptyMessage?: string;
  className?: string;
  onBlur?: () => void;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  size = "md",
  disabled = false,
  loading = false,
  error = false,
  emptyMessage = "No se encontraron resultados",
  className,
  onBlur,
}: SearchableSelectProps) {
  const [query, setQuery] = useState("");

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value) ?? null,
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!query) return options;
    const lowerQuery = query.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(lowerQuery) ||
        opt.description?.toLowerCase().includes(lowerQuery)
    );
  }, [options, query]);

  const handleChange = (option: SelectOption | null) => {
    onChange(option?.value ?? "");
    setQuery("");
  };

  const isDisabled = disabled || loading;

  return (
    <Combobox
      value={selectedOption}
      onChange={handleChange}
      disabled={isDisabled}
      as="div"
      className={cn("group relative", className)}
    >
      {/* Input */}
      <div className="relative">
        <ComboboxInput
          className={inputTriggerVariants({ size, error })}
          placeholder={selectedOption ? undefined : placeholder}
          displayValue={(option: SelectOption | null) => option?.label ?? ""}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={onBlur}
        />

        {/* Right side button/spinner */}
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3">
          {loading ? (
            <Spinner size="sm" />
          ) : (
            <ChevronDown
              className={cn(
                "h-5 w-5 text-text-light transition-transform",
                "group-data-[open]:rotate-180"
              )}
            />
          )}
        </ComboboxButton>
      </div>

      {/* Options dropdown */}
      <ComboboxOptions
        anchor="bottom start"
        className={cn(
          "z-50 w-[var(--input-width)]",
          "max-h-60 overflow-auto",
          "bg-white border border-border rounded-xl shadow-lg",
          "py-1",
          "focus:outline-none",
          "transition-opacity duration-100",
          "data-[closed]:opacity-0"
        )}
      >
        {/* Search hint */}
        {options.length > 5 && (
          <div className="px-3 py-2 flex items-center gap-2 text-xs text-text-light border-b border-border">
            <Search className="h-3 w-3" />
            <span>{searchPlaceholder}</span>
          </div>
        )}

        {/* Empty state */}
        {filteredOptions.length === 0 && (
          <div className="px-4 py-3 text-sm text-text-light text-center">
            {emptyMessage}
          </div>
        )}

        {/* Options */}
        {filteredOptions.map((option) => (
          <ComboboxOption
            key={option.value}
            value={option}
            className={optionVariants()}
          >
            {({ selected }) => (
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span
                    className={cn("block truncate", selected && "font-medium")}
                  >
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="text-xs text-text-light truncate">
                      {option.description}
                    </span>
                  )}
                </div>
                {selected && (
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </div>
            )}
          </ComboboxOption>
        ))}
      </ComboboxOptions>
    </Combobox>
  );
}
