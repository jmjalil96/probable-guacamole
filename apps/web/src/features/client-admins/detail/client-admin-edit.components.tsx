import { Controller } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import type { ClientAdmin } from "shared";
import {
  Button,
  Alert,
  Modal,
  FormField,
  Input,
  Checkbox,
} from "@/components/ui";
import { useExitConfirmation } from "@/lib/hooks";
import { useClientAdminForm } from "./hooks";
import type { ClientAdminFormData } from "./schema";

// =============================================================================
// ClientAdminForm
// =============================================================================

export interface ClientAdminFormProps {
  control: Control<ClientAdminFormData>;
  errors: FieldErrors<ClientAdminFormData>;
  onSubmit: (e: React.FormEvent) => void;
  formId: string;
}

export function ClientAdminForm({
  control,
  errors,
  onSubmit,
  formId,
}: ClientAdminFormProps) {
  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Nombre"
          htmlFor="firstName"
          error={errors.firstName?.message}
          required
        >
          <Controller
            name="firstName"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Nombre..."
                error={!!errors.firstName}
                autoFocus
              />
            )}
          />
        </FormField>

        <FormField
          label="Apellido"
          htmlFor="lastName"
          error={errors.lastName?.message}
          required
        >
          <Controller
            name="lastName"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Apellido..."
                error={!!errors.lastName}
              />
            )}
          />
        </FormField>
      </div>

      <FormField
        label="Correo Electronico"
        htmlFor="email"
        error={errors.email?.message}
        required
      >
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="email"
              placeholder="correo@ejemplo.com"
              error={!!errors.email}
            />
          )}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Telefono"
          htmlFor="phone"
          error={errors.phone?.message}
        >
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value || null)}
                placeholder="+1 234 567 8900"
                error={!!errors.phone}
              />
            )}
          />
        </FormField>

        <FormField
          label="Cargo"
          htmlFor="jobTitle"
          error={errors.jobTitle?.message}
        >
          <Controller
            name="jobTitle"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value || null)}
                placeholder="Cargo..."
                error={!!errors.jobTitle}
              />
            )}
          />
        </FormField>
      </div>

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
    </form>
  );
}

// =============================================================================
// ClientAdminEditModal
// =============================================================================

export interface ClientAdminEditModalProps {
  open: boolean;
  onClose: () => void;
  clientAdmin: ClientAdmin;
}

export function ClientAdminEditModal({
  open,
  onClose,
  clientAdmin,
}: ClientAdminEditModalProps) {
  const form = useClientAdminForm(clientAdmin, open, onClose);

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
        <Modal.Panel size="lg">
          <Modal.Header>
            <Modal.Title>Editar Administrador de Cliente</Modal.Title>
            <Modal.Description>
              {clientAdmin.firstName} {clientAdmin.lastName}
            </Modal.Description>
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

            <ClientAdminForm
              control={form.control}
              errors={form.errors}
              onSubmit={(e) => void form.handleSubmit(form.onSubmit)(e)}
              formId="edit-client-admin-form"
            />
          </Modal.Body>

          <Modal.Footer>
            <Button variant="ghost" onClick={requestExit} disabled={form.isBusy}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="edit-client-admin-form"
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
