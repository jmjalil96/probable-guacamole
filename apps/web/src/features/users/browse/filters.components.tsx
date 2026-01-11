import { SlidersHorizontal } from "lucide-react";
import type { UserType } from "shared";
import {
  ListHeader,
  FilterChip,
  FilterBar,
  SearchInput,
  Select,
  Button,
  Sheet,
  FormField,
} from "@/components/ui";
import { IS_ACTIVE_OPTIONS, USER_TYPE_OPTIONS, HAS_ACCOUNT_OPTIONS } from "../shared";
import type { ActiveFilter } from "./types";

// =============================================================================
// UsersFilterChips
// =============================================================================

export interface UsersFilterChipsProps {
  filters: ActiveFilter[];
}

export function UsersFilterChips({ filters }: UsersFilterChipsProps) {
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
// UsersFiltersInline
// =============================================================================

export interface UsersFiltersInlineProps {
  search: string | undefined;
  type: string | undefined;
  isActive: boolean | undefined;
  hasAccount: boolean | undefined;
  onSearchChange: (value: string | undefined) => void;
  onTypeChange: (value: string | undefined) => void;
  onIsActiveChange: (value: boolean | undefined) => void;
  onHasAccountChange: (value: boolean | undefined) => void;
  onOpenMobileFilters?: (() => void) | undefined;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

export function UsersFiltersInline({
  search,
  type,
  isActive,
  hasAccount,
  onSearchChange,
  onTypeChange,
  onIsActiveChange,
  onHasAccountChange,
  onOpenMobileFilters,
  onClearAll,
  hasActiveFilters,
}: UsersFiltersInlineProps) {
  return (
    <FilterBar>
      <SearchInput
        value={search ?? ""}
        onChange={(v) => onSearchChange(v || undefined)}
        placeholder="Buscar usuarios..."
        debounce={300}
        className="flex-1 sm:flex-none"
      />

      {/* Desktop: Inline filters */}
      <div className="hidden items-center gap-4 sm:flex">
        <FilterBar.Divider />
        <Select
          options={USER_TYPE_OPTIONS}
          value={type ?? ""}
          onChange={(v) => onTypeChange(v || undefined)}
          placeholder="Tipo"
        />
        <Select
          options={IS_ACTIVE_OPTIONS}
          value={isActive === undefined ? "" : String(isActive)}
          onChange={(v) => onIsActiveChange(v === "" ? undefined : v === "true")}
          placeholder="Estado"
        />
        <Select
          options={HAS_ACCOUNT_OPTIONS}
          value={hasAccount === undefined ? "" : String(hasAccount)}
          onChange={(v) => onHasAccountChange(v === "" ? undefined : v === "true")}
          placeholder="Cuenta"
        />
      </div>

      <FilterBar.Spacer />

      {/* Mobile: Filter button (like claims pattern) */}
      {onOpenMobileFilters && (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 sm:hidden"
          onClick={onOpenMobileFilters}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      )}

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
// UsersFiltersSheet (Mobile)
// =============================================================================

export interface UsersFiltersSheetProps {
  open: boolean;
  onClose: () => void;
  // Filter values
  type: UserType | undefined;
  isActive: boolean | undefined;
  hasAccount: boolean | undefined;
  // Callbacks
  onTypeChange: (value: UserType | undefined) => void;
  onIsActiveChange: (value: boolean | undefined) => void;
  onHasAccountChange: (value: boolean | undefined) => void;
  onClearAll: () => void;
}

export function UsersFiltersSheet({
  open,
  onClose,
  type,
  isActive,
  hasAccount,
  onTypeChange,
  onIsActiveChange,
  onHasAccountChange,
  onClearAll,
}: UsersFiltersSheetProps) {
  return (
    <Sheet open={open} onClose={onClose}>
      <Sheet.Panel side="right" size="full">
        <Sheet.Header>
          <Sheet.Title>Filtros</Sheet.Title>
        </Sheet.Header>
        <Sheet.Body className="space-y-4">
          <FormField label="Tipo de Usuario">
            <Select
              options={USER_TYPE_OPTIONS}
              value={type ?? ""}
              onChange={(v) => onTypeChange((v as UserType) || undefined)}
              placeholder="Seleccionar tipo..."
            />
          </FormField>
          <FormField label="Estado">
            <Select
              options={IS_ACTIVE_OPTIONS}
              value={isActive === undefined ? "" : String(isActive)}
              onChange={(v) => onIsActiveChange(v === "" ? undefined : v === "true")}
              placeholder="Seleccionar estado..."
            />
          </FormField>
          <FormField label="Cuenta">
            <Select
              options={HAS_ACCOUNT_OPTIONS}
              value={hasAccount === undefined ? "" : String(hasAccount)}
              onChange={(v) => onHasAccountChange(v === "" ? undefined : v === "true")}
              placeholder="Seleccionar..."
            />
          </FormField>
        </Sheet.Body>
        <Sheet.Footer>
          <Button variant="ghost" onClick={onClearAll}>
            Limpiar Todo
          </Button>
          <Button onClick={onClose}>Aplicar Filtros</Button>
        </Sheet.Footer>
      </Sheet.Panel>
    </Sheet>
  );
}

// =============================================================================
// UsersListHeader
// =============================================================================

export interface UsersListHeaderProps {
  total: number | undefined;
}

export function UsersListHeader({ total }: UsersListHeaderProps) {
  return <ListHeader title="Usuarios" {...(total !== undefined && { count: total })} />;
}
