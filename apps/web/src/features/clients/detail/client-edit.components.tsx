import { Controller } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import type { Client } from "shared";
import {
  Button,
  Alert,
  Modal,
  FormField,
  Input,
  Checkbox,
} from "@/components/ui";
import { useExitConfirmation } from "@/lib/hooks";
import { useClientForm, useClientCreateForm } from "./hooks";
import type { ClientFormData } from "./schema";

// =============================================================================
// ClientForm (shared between create and edit)
// =============================================================================

export interface ClientFormProps {
  control: Control<ClientFormData>;
  errors: FieldErrors<ClientFormData>;
  onSubmit: (e: React.FormEvent) => void;
  formId: string;
  showIsActive?: boolean;
}

export function ClientForm({
  control,
  errors,
  onSubmit,
  formId,
  showIsActive = true,
}: ClientFormProps) {
  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-4">
      <FormField
        label="Nombre"
        htmlFor="name"
        error={errors.name?.message}
        required
      >
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              placeholder="Nombre del cliente..."
              error={!!errors.name}
              autoFocus
            />
          )}
        />
      </FormField>

      {showIsActive && (
        <FormField label="Estado" htmlFor="isActive">
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <span className="text-sm text-text-muted">
                  {field.value ? "Activo" : "Inactivo"}
                </span>
              </div>
            )}
          />
        </FormField>
      )}
    </form>
  );
}

// =============================================================================
// ClientCreateModal (for browse page "New" button)
// =============================================================================

export interface ClientCreateModalProps {
  open: boolean;
  onClose: () => void;
}

export function ClientCreateModal({ open, onClose }: ClientCreateModalProps) {
  const form = useClientCreateForm(open, () => {
    onClose();
  });

  const {
    showDialog: showExitDialog,
    requestExit,
    confirmExit,
    cancelExit,
  } = useExitConfirmation({
    isDirty: form.isDirty,
    hasFiles: false,
    onExit: onClose,
  });

  return (
    <>
      <Modal open={open} onClose={requestExit}>
        <Modal.Panel size="md">
          <Modal.Header>
            <Modal.Title>Nuevo Cliente</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {form.formError && (
              <Alert
                variant="error"
                title={form.formError.title}
                description={form.formError.description}
                items={form.formError.items}
                onDismiss={form.clearFormError}
                className="mb-5"
              />
            )}

            <ClientForm
              control={form.control}
              errors={form.errors}
              onSubmit={(e) => void form.handleSubmit(form.onSubmit)(e)}
              formId="create-client-form"
              showIsActive={false}
            />
          </Modal.Body>

          <Modal.Footer>
            <Button variant="ghost" onClick={requestExit} disabled={form.isBusy}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="create-client-form"
              variant="primary"
              loading={form.isBusy}
            >
              Crear
            </Button>
          </Modal.Footer>
        </Modal.Panel>
      </Modal>

      <Modal open={showExitDialog} onClose={cancelExit}>
        <Modal.Panel size="md">
          <Modal.Header>
            <Modal.Title>¿Descartar cambios?</Modal.Title>
            <Modal.Description>
              Tiene cambios sin guardar que se perderan.
            </Modal.Description>
          </Modal.Header>
          <Modal.Footer>
            <Button variant="ghost" onClick={cancelExit}>
              Seguir editando
            </Button>
            <Button variant="destructive" onClick={confirmExit}>
              Descartar
            </Button>
          </Modal.Footer>
        </Modal.Panel>
      </Modal>
    </>
  );
}

// =============================================================================
// ClientEditModal (for detail page)
// =============================================================================

export interface ClientEditModalProps {
  open: boolean;
  onClose: () => void;
  client: Client;
}

export function ClientEditModal({
  open,
  onClose,
  client,
}: ClientEditModalProps) {
  const form = useClientForm(client, open, onClose);

  const {
    showDialog: showExitDialog,
    requestExit,
    confirmExit,
    cancelExit,
  } = useExitConfirmation({
    isDirty: form.isDirty,
    hasFiles: false,
    onExit: onClose,
  });

  return (
    <>
      <Modal open={open} onClose={requestExit}>
        <Modal.Panel size="md">
          <Modal.Header>
            <Modal.Title>Editar Cliente</Modal.Title>
            <Modal.Description>{client.name}</Modal.Description>
          </Modal.Header>

          <Modal.Body>
            {form.formError && (
              <Alert
                variant="error"
                title={form.formError.title}
                description={form.formError.description}
                items={form.formError.items}
                onDismiss={form.clearFormError}
                className="mb-5"
              />
            )}

            <ClientForm
              control={form.control}
              errors={form.errors}
              onSubmit={(e) => void form.handleSubmit(form.onSubmit)(e)}
              formId="edit-client-form"
              showIsActive={true}
            />
          </Modal.Body>

          <Modal.Footer>
            <Button variant="ghost" onClick={requestExit} disabled={form.isBusy}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="edit-client-form"
              variant="primary"
              loading={form.isBusy}
              disabled={!form.isDirty || form.isBusy}
            >
              Guardar
            </Button>
          </Modal.Footer>
        </Modal.Panel>
      </Modal>

      <Modal open={showExitDialog} onClose={cancelExit}>
        <Modal.Panel size="md">
          <Modal.Header>
            <Modal.Title>¿Descartar cambios?</Modal.Title>
            <Modal.Description>
              Tiene cambios sin guardar que se perderan.
            </Modal.Description>
          </Modal.Header>
          <Modal.Footer>
            <Button variant="ghost" onClick={cancelExit}>
              Seguir editando
            </Button>
            <Button variant="destructive" onClick={confirmExit}>
              Descartar
            </Button>
          </Modal.Footer>
        </Modal.Panel>
      </Modal>
    </>
  );
}

// =============================================================================
// ClientDeleteDialog
// =============================================================================

export interface ClientDeleteDialogProps {
  open: boolean;
  client: Client | undefined;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ClientDeleteDialog({
  open,
  client,
  isDeleting,
  onConfirm,
  onCancel,
}: ClientDeleteDialogProps) {
  return (
    <Modal open={open} onClose={onCancel}>
      <Modal.Panel size="md">
        <Modal.Header>
          <Modal.Title>Eliminar Cliente</Modal.Title>
          <Modal.Description>
            ¿Esta seguro que desea eliminar{" "}
            <span className="font-semibold">{client?.name}</span>? Esta accion
            no se puede deshacer.
          </Modal.Description>
        </Modal.Header>
        <Modal.Footer>
          <Button variant="ghost" onClick={onCancel} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            loading={isDeleting}
          >
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal.Panel>
    </Modal>
  );
}
