import { Controller } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import type { Agent } from "shared";
import {
  Button,
  Alert,
  Modal,
  FormField,
  Input,
  Checkbox,
} from "@/components/ui";
import { useExitConfirmation } from "@/lib/hooks";
import { useAgentForm } from "./hooks";
import type { AgentFormData } from "./schema";

// =============================================================================
// AgentForm
// =============================================================================

export interface AgentFormProps {
  control: Control<AgentFormData>;
  errors: FieldErrors<AgentFormData>;
  onSubmit: (e: React.FormEvent) => void;
  formId: string;
}

export function AgentForm({
  control,
  errors,
  onSubmit,
  formId,
}: AgentFormProps) {
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

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Numero de Licencia"
          htmlFor="licenseNumber"
          error={errors.licenseNumber?.message}
        >
          <Controller
            name="licenseNumber"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value || null)}
                placeholder="Numero de licencia..."
                error={!!errors.licenseNumber}
              />
            )}
          />
        </FormField>

        <FormField
          label="Agencia"
          htmlFor="agencyName"
          error={errors.agencyName?.message}
        >
          <Controller
            name="agencyName"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value || null)}
                placeholder="Nombre de agencia..."
                error={!!errors.agencyName}
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
// AgentEditModal
// =============================================================================

export interface AgentEditModalProps {
  open: boolean;
  onClose: () => void;
  agent: Agent;
}

export function AgentEditModal({
  open,
  onClose,
  agent,
}: AgentEditModalProps) {
  const form = useAgentForm(agent, open, onClose);

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
            <Modal.Title>Editar Agente</Modal.Title>
            <Modal.Description>
              {agent.firstName} {agent.lastName}
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

            <AgentForm
              control={form.control}
              errors={form.errors}
              onSubmit={(e) => void form.handleSubmit(form.onSubmit)(e)}
              formId="edit-agent-form"
            />
          </Modal.Body>

          <Modal.Footer>
            <Button variant="ghost" onClick={requestExit} disabled={form.isBusy}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="edit-agent-form"
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
