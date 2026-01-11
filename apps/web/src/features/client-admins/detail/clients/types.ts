import type { ClientAdminClient } from "shared";

// =============================================================================
// Form Error
// =============================================================================

export interface FormError {
  title: string;
  description?: string;
  items?: string[];
}

// =============================================================================
// Modal State
// =============================================================================

export interface ClientModalState {
  open: boolean;
  /** Key that increments on each open - use as component key to reset state */
  key: number;
}

export interface ClientModalHandlers {
  openAdd: () => void;
  close: () => void;
}

// =============================================================================
// Remove State
// =============================================================================

export interface ClientRemoveState {
  open: boolean;
  client: ClientAdminClient | null;
  isRemoving: boolean;
}

export interface ClientRemoveHandlers {
  openRemove: (client: ClientAdminClient) => void;
  confirmRemove: () => void;
  cancelRemove: () => void;
}

// =============================================================================
// Master Hook Return Type
// =============================================================================

export interface UseClientAdminClientsTabReturn {
  // Data
  clients: ClientAdminClient[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;

  // Add Modal
  modalState: ClientModalState;
  modalHandlers: ClientModalHandlers;

  // Remove Dialog
  removeState: ClientRemoveState;
  removeHandlers: ClientRemoveHandlers;
}

// =============================================================================
// Component Props
// =============================================================================

export interface ClientAdminClientsTabProps {
  clientAdminId: string;
}

export interface ClientsTabHeaderProps {
  onAdd: () => void;
}

export interface ClientsTableProps {
  data: ClientAdminClient[];
  onRemove: (client: ClientAdminClient) => void;
  emptyState?: string;
}

export interface ClientRowActionsProps {
  client: ClientAdminClient;
  onRemove: (client: ClientAdminClient) => void;
}

export interface AssignClientModalProps {
  open: boolean;
  clientAdminId: string;
  onClose: () => void;
}

export interface ClientRemoveDialogProps {
  open: boolean;
  client: ClientAdminClient | null;
  isRemoving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
