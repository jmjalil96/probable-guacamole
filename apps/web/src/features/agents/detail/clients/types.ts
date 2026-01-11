import type { AgentClient } from "shared";

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
  client: AgentClient | null;
  isRemoving: boolean;
}

export interface ClientRemoveHandlers {
  openRemove: (client: AgentClient) => void;
  confirmRemove: () => void;
  cancelRemove: () => void;
}

// =============================================================================
// Master Hook Return Type
// =============================================================================

export interface UseAgentClientsTabReturn {
  // Data
  clients: AgentClient[];
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

export interface AgentClientsTabProps {
  agentId: string;
}

export interface ClientsTabHeaderProps {
  onAdd: () => void;
}

export interface ClientsTableProps {
  data: AgentClient[];
  onRemove: (client: AgentClient) => void;
  emptyState?: string;
}

export interface ClientRowActionsProps {
  client: AgentClient;
  onRemove: (client: AgentClient) => void;
}

export interface AssignClientModalProps {
  open: boolean;
  agentId: string;
  onClose: () => void;
}

export interface ClientRemoveDialogProps {
  open: boolean;
  client: AgentClient | null;
  isRemoving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
