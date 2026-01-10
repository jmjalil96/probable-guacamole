import { Controller } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import type { InsurerType, Insurer } from "shared";
import {
  Button,
  Alert,
  Modal,
  FormField,
  Input,
  Select,
  Checkbox,
} from "@/components/ui";
import { useExitConfirmation } from "@/lib/hooks";
import { TYPE_OPTIONS } from "../shared";
import { useInsurerForm, useInsurerCreateForm } from "./hooks";
import type { InsurerFormData } from "./schema";

// =============================================================================
// InsurerForm (shared between create and edit)
// =============================================================================

export interface InsurerFormProps {
  control: Control<InsurerFormData>;
  errors: FieldErrors<InsurerFormData>;
  onSubmit: (e: React.FormEvent) => void;
  formId: string;
  showIsActive?: boolean;
}

export function InsurerForm({
  control,
  errors,
  onSubmit,
  formId,
  showIsActive = true,
}: InsurerFormProps) {
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
              placeholder="Nombre de la aseguradora..."
              error={!!errors.name}
              autoFocus
            />
          )}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Codigo" htmlFor="code" error={errors.code?.message}>
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value || null)}
                placeholder="ABC123"
                error={!!errors.code}
              />
            )}
          />
        </FormField>

        <FormField
          label="Tipo"
          htmlFor="type"
          error={errors.type?.message}
          required
        >
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onChange={(val) => field.onChange(val as InsurerType)}
                options={TYPE_OPTIONS}
                placeholder="Seleccionar tipo..."
                error={!!errors.type}
                size="md"
              />
            )}
          />
        </FormField>
      </div>

      <FormField label="Email" htmlFor="email" error={errors.email?.message}>
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="email"
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value || null)}
              placeholder="contacto@aseguradora.com"
              error={!!errors.email}
            />
          )}
        />
      </FormField>

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
              placeholder="+1 (555) 123-4567"
              error={!!errors.phone}
            />
          )}
        />
      </FormField>

      <FormField
        label="Sitio Web"
        htmlFor="website"
        error={errors.website?.message}
      >
        <Controller
          name="website"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value || null)}
              placeholder="https://www.aseguradora.com"
              error={!!errors.website}
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
// InsurerCreateModal (for browse page "New" button)
// =============================================================================

export interface InsurerCreateModalProps {
  open: boolean;
  onClose: () => void;
}

export function InsurerCreateModal({ open, onClose }: InsurerCreateModalProps) {
  const form = useInsurerCreateForm(open, () => {
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
            <Modal.Title>Nueva Aseguradora</Modal.Title>
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

            <InsurerForm
              control={form.control}
              errors={form.errors}
              onSubmit={(e) => void form.handleSubmit(form.onSubmit)(e)}
              formId="create-insurer-form"
              showIsActive={false}
            />
          </Modal.Body>

          <Modal.Footer>
            <Button variant="ghost" onClick={requestExit} disabled={form.isBusy}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="create-insurer-form"
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
// InsurerEditModal (for detail page)
// =============================================================================

export interface InsurerEditModalProps {
  open: boolean;
  onClose: () => void;
  insurer: Insurer;
}

export function InsurerEditModal({
  open,
  onClose,
  insurer,
}: InsurerEditModalProps) {
  const form = useInsurerForm(insurer, open, onClose);

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
            <Modal.Title>Editar Aseguradora</Modal.Title>
            <Modal.Description>{insurer.name}</Modal.Description>
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

            <InsurerForm
              control={form.control}
              errors={form.errors}
              onSubmit={(e) => void form.handleSubmit(form.onSubmit)(e)}
              formId="edit-insurer-form"
              showIsActive={true}
            />
          </Modal.Body>

          <Modal.Footer>
            <Button variant="ghost" onClick={requestExit} disabled={form.isBusy}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="edit-insurer-form"
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
// InsurerDeleteDialog
// =============================================================================

export interface InsurerDeleteDialogProps {
  open: boolean;
  insurer: Insurer | undefined;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function InsurerDeleteDialog({
  open,
  insurer,
  isDeleting,
  onConfirm,
  onCancel,
}: InsurerDeleteDialogProps) {
  return (
    <Modal open={open} onClose={onCancel}>
      <Modal.Panel size="md">
        <Modal.Header>
          <Modal.Title>Eliminar Aseguradora</Modal.Title>
          <Modal.Description>
            ¿Esta seguro que desea eliminar{" "}
            <span className="font-semibold">{insurer?.name}</span>? Esta accion
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
