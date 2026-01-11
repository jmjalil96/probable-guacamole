import { Controller } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import type { Employee } from "shared";
import {
  Button,
  Alert,
  Modal,
  FormField,
  Input,
  Checkbox,
} from "@/components/ui";
import { useExitConfirmation } from "@/lib/hooks";
import { useEmployeeForm } from "./hooks";
import type { EmployeeFormData } from "./schema";

// =============================================================================
// EmployeeForm
// =============================================================================

export interface EmployeeFormProps {
  control: Control<EmployeeFormData>;
  errors: FieldErrors<EmployeeFormData>;
  onSubmit: (e: React.FormEvent) => void;
  formId: string;
}

export function EmployeeForm({
  control,
  errors,
  onSubmit,
  formId,
}: EmployeeFormProps) {
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
          label="Departamento"
          htmlFor="department"
          error={errors.department?.message}
        >
          <Controller
            name="department"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value || null)}
                placeholder="Departamento..."
                error={!!errors.department}
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
// EmployeeEditModal
// =============================================================================

export interface EmployeeEditModalProps {
  open: boolean;
  onClose: () => void;
  employee: Employee;
}

export function EmployeeEditModal({
  open,
  onClose,
  employee,
}: EmployeeEditModalProps) {
  const form = useEmployeeForm(employee, open, onClose);

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
            <Modal.Title>Editar Empleado</Modal.Title>
            <Modal.Description>
              {employee.firstName} {employee.lastName}
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

            <EmployeeForm
              control={form.control}
              errors={form.errors}
              onSubmit={(e) => void form.handleSubmit(form.onSubmit)(e)}
              formId="edit-employee-form"
            />
          </Modal.Body>

          <Modal.Footer>
            <Button variant="ghost" onClick={requestExit} disabled={form.isBusy}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="edit-employee-form"
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
