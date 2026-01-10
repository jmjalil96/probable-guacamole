import { Plus } from "lucide-react";
import {
  Button,
  ListHeader,
  FilterChip,
  FilterBar,
  SearchInput,
  Select,
} from "@/components/ui";
import { IS_ACTIVE_OPTIONS } from "../shared";
import type { ActiveFilter } from "./types";

// =============================================================================
// ClientsFilterChips
// =============================================================================

export interface ClientsFilterChipsProps {
  filters: ActiveFilter[];
}

export function ClientsFilterChips({ filters }: ClientsFilterChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto border-b border-border px-4 py-3 scrollbar-hide sm:px-6 lg:px-8">
      {filters.map((filter) => (
        <FilterChip
          key={filter.key}
          label={filter.label}
          value={filter.value}
          onRemove={filter.onRemove}
          className="shrink-0"
        />
      ))}
    </div>
  );
}

// =============================================================================
// ClientsFiltersInline
// =============================================================================

export interface ClientsFiltersInlineProps {
  // Filter values
  search: string | undefined;
  isActive: boolean | undefined;
  // Callbacks
  onSearchChange: (value: string | undefined) => void;
  onIsActiveChange: (value: boolean | undefined) => void;
  // Actions
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

export function ClientsFiltersInline({
  search,
  isActive,
  onSearchChange,
  onIsActiveChange,
  onClearAll,
  hasActiveFilters,
}: ClientsFiltersInlineProps) {
  return (
    <FilterBar>
      <SearchInput
        value={search ?? ""}
        onChange={(v) => onSearchChange(v || undefined)}
        placeholder="Buscar clientes..."
        debounce={300}
        className="flex-1 sm:flex-none"
      />

      {/* Desktop: Inline filters */}
      <div className="hidden items-center gap-4 sm:flex">
        <FilterBar.Divider />
        <Select
          options={IS_ACTIVE_OPTIONS}
          value={isActive === undefined ? "" : String(isActive)}
          onChange={(v) =>
            onIsActiveChange(v === "" ? undefined : v === "true")
          }
          placeholder="Estado"
        />
      </div>

      <FilterBar.Spacer />

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="shrink-0 whitespace-nowrap"
        >
          <span className="hidden sm:inline">Limpiar todo</span>
          <span className="sm:hidden">Limpiar</span>
        </Button>
      )}
    </FilterBar>
  );
}

// =============================================================================
// ClientsListHeader
// =============================================================================

export interface ClientsListHeaderProps {
  total: number | undefined;
  onNew: () => void;
}

export function ClientsListHeader({ total, onNew }: ClientsListHeaderProps) {
  return (
    <ListHeader
      title="Clientes"
      {...(total !== undefined && { count: total })}
    >
      <Button onClick={onNew}>
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Nuevo Cliente</span>
      </Button>
    </ListHeader>
  );
}
