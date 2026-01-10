import { Plus } from "lucide-react";
import type { InsurerType } from "shared";
import {
  Button,
  ListHeader,
  FilterChip,
  FilterBar,
  SearchInput,
  Select,
} from "@/components/ui";
import { TYPE_OPTIONS, IS_ACTIVE_OPTIONS } from "../shared";
import type { ActiveFilter } from "./types";

// =============================================================================
// InsurersFilterChips
// =============================================================================

export interface InsurersFilterChipsProps {
  filters: ActiveFilter[];
}

export function InsurersFilterChips({ filters }: InsurersFilterChipsProps) {
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
// InsurersFiltersInline
// =============================================================================

export interface InsurersFiltersInlineProps {
  // Filter values
  search: string | undefined;
  type: InsurerType | undefined;
  isActive: boolean | undefined;
  // Callbacks
  onSearchChange: (value: string | undefined) => void;
  onTypeChange: (value: InsurerType | undefined) => void;
  onIsActiveChange: (value: boolean | undefined) => void;
  // Actions
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

export function InsurersFiltersInline({
  search,
  type,
  isActive,
  onSearchChange,
  onTypeChange,
  onIsActiveChange,
  onClearAll,
  hasActiveFilters,
}: InsurersFiltersInlineProps) {
  return (
    <FilterBar>
      <SearchInput
        value={search ?? ""}
        onChange={(v) => onSearchChange(v || undefined)}
        placeholder="Buscar aseguradoras..."
        debounce={300}
        className="flex-1 sm:flex-none"
      />

      {/* Desktop: Inline filters */}
      <div className="hidden items-center gap-4 sm:flex">
        <FilterBar.Divider />
        <Select
          options={TYPE_OPTIONS}
          value={type ?? ""}
          onChange={(v) => onTypeChange((v as InsurerType) || undefined)}
          placeholder="Tipo"
          className="min-w-[180px]"
        />
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
// InsurersListHeader
// =============================================================================

export interface InsurersListHeaderProps {
  total: number | undefined;
  onNew: () => void;
}

export function InsurersListHeader({ total, onNew }: InsurersListHeaderProps) {
  return (
    <ListHeader
      title="Aseguradoras"
      {...(total !== undefined && { count: total })}
    >
      <Button onClick={onNew}>
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Nueva Aseguradora</span>
      </Button>
    </ListHeader>
  );
}
