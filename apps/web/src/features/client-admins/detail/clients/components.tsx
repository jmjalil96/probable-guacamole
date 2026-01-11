import { useMemo } from "react";
import { Plus, Trash2, MoreVertical } from "lucide-react";
import {
  Button,
  Alert,
  Modal,
  FormField,
  Combobox,
  DataTable,
  DropdownMenu,
  Spinner,
  ErrorState,
} from "@/components/ui";
import { SectionHeader, DeleteDialog } from "@/components/patterns";
import { useClientAdminClientsTab, useAssignClientForm } from "./hooks";
import { clientColumns, clientColumnHelper } from "./columns";
import type {
  ClientAdminClientsTabProps,
  ClientsTabHeaderProps,
  ClientsTableProps,
  ClientRowActionsProps,
  AssignClientModalProps,
  ClientRemoveDialogProps,
} from "./types";

// =============================================================================
// ClientsTabHeader
// =============================================================================

export function ClientsTabHeader({ onAdd }: ClientsTabHeaderProps) {
  return (
    <SectionHeader
      title="Clientes Asignados"
      variant="default"
      action={
        <Button variant="primary" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Asignar Cliente
        </Button>
      }
    />
  );
}

// =============================================================================
// ClientRowActions
// =============================================================================

export function ClientRowActions({
  client,
  onRemove,
}: ClientRowActionsProps) {
  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-border hover:text-text"
            data-row-nav="ignore"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Item destructive onClick={() => onRemove(client)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Remover
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>
    </div>
  );
}

// =============================================================================
// ClientsTable
// =============================================================================

export function ClientsTable({
  data,
  onRemove,
  emptyState = "No hay clientes asignados.",
}: ClientsTableProps) {
  // Combine static columns with actions column (requires callbacks)
  const columns = useMemo(
    () => [
      ...clientColumns,
      clientColumnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <ClientRowActions client={row.original} onRemove={onRemove} />
        ),
      }),
    ],
    [onRemove]
  );

  return (
    <DataTable
      data={data}
      columns={columns}
      getRowId={(row) => row.clientId}
      emptyState={emptyState}
    />
  );
}

// =============================================================================
// AssignClientModal
// =============================================================================

export function AssignClientModal({
  open,
  clientAdminId,
  onClose,
}: AssignClientModalProps) {
  const form = useAssignClientForm(clientAdminId, onClose);

  return (
    <Modal open={open} onClose={onClose}>
      <Modal.Panel size="md">
        <Modal.Header>
          <Modal.Title>Asignar Cliente</Modal.Title>
          <Modal.Description>
            Busque y seleccione un cliente para asignar a este administrador.
          </Modal.Description>
        </Modal.Header>

        <Modal.Body>
          {form.formError && (
            <Alert
              variant="error"
              title={form.formError.title}
              description={form.formError.description}
              onDismiss={form.clearFormError}
              className="mb-5"
            />
          )}

          <FormField label="Cliente" htmlFor="clientId" required>
            <Combobox
              value={form.selectedClient}
              onChange={form.setSelectedClient}
              onSearch={form.onSearch}
              placeholder="Buscar cliente..."
              disabled={form.isBusy}
              size="md"
            />
          </FormField>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="ghost" onClick={onClose} disabled={form.isBusy}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            loading={form.isBusy}
            disabled={!form.selectedClient || form.isBusy}
            onClick={() => void form.onSubmit()}
          >
            Asignar
          </Button>
        </Modal.Footer>
      </Modal.Panel>
    </Modal>
  );
}

// =============================================================================
// ClientRemoveDialog
// =============================================================================

export function ClientRemoveDialog({
  open,
  client,
  isRemoving,
  onConfirm,
  onCancel,
}: ClientRemoveDialogProps) {
  return (
    <DeleteDialog
      open={open}
      title="Remover Cliente"
      description={
        <>
          ¿Esta seguro que desea remover al cliente{" "}
          <span className="font-semibold">{client?.clientName}</span> de este
          administrador?
        </>
      }
      isDeleting={isRemoving}
      onConfirm={onConfirm}
      onCancel={onCancel}
      confirmLabel="Remover"
    />
  );
}

// =============================================================================
// ClientAdminClientsTab (Entry Point)
// =============================================================================

export function ClientAdminClientsTab({ clientAdminId }: ClientAdminClientsTabProps) {
  const {
    clients,
    isLoading,
    isError,
    refetch,
    modalState,
    modalHandlers,
    removeState,
    removeHandlers,
  } = useClientAdminClientsTab(clientAdminId);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg border border-border bg-white">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message="Error al cargar los clientes. Intente nuevamente."
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div>
      <ClientsTabHeader onAdd={modalHandlers.openAdd} />

      <ClientsTable data={clients} onRemove={removeHandlers.openRemove} />

      <AssignClientModal
        key={modalState.key}
        open={modalState.open}
        clientAdminId={clientAdminId}
        onClose={modalHandlers.close}
      />

      <ClientRemoveDialog
        open={removeState.open}
        client={removeState.client}
        isRemoving={removeState.isRemoving}
        onConfirm={removeHandlers.confirmRemove}
        onCancel={removeHandlers.cancelRemove}
      />
    </div>
  );
}
