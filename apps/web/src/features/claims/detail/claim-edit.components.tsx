import type { ReactNode } from "react";
import { Controller } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import type { CareType } from "shared";
import {
  Button,
  Alert,
  Modal,
  FormField,
  Textarea,
  Input,
  Select,
  SearchableSelect,
  DatePicker,
  CurrencyInput,
  type SelectOption,
} from "@/components/ui";
import { useExitConfirmation } from "@/lib/hooks";
import { parseDate, formatDateToString } from "@/lib/formatting";
import { CARE_TYPE_OPTIONS } from "../shared";
import { useEditClaimForm, usePolicyLookup } from "./hooks";
import type { EditClaimForm } from "./schema";
import type { ClaimDetail } from "shared";

// =============================================================================
// FormSection (internal helper)
// =============================================================================

interface FormSectionProps {
  title: string;
  children: ReactNode;
}

function FormSection({ title, children }: FormSectionProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-border">
      <header className="border-b border-border/60 bg-background/50 px-5 py-3">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

// =============================================================================
// ClaimInfoSection (DRAFT phase fields)
// =============================================================================

interface ClaimInfoSectionProps {
  control: Control<EditClaimForm>;
  errors: FieldErrors<EditClaimForm>;
  policyOptions: SelectOption[];
  policyLoading: boolean;
}

function ClaimInfoSection({
  control,
  errors,
  policyOptions,
  policyLoading,
}: ClaimInfoSectionProps) {
  const careTypeOptions = CARE_TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  return (
    <FormSection title="Información del Reclamo">
      <div className="grid grid-cols-3 gap-x-5 gap-y-4">
        <FormField
          label="Póliza"
          htmlFor="policyId"
          error={errors.policyId?.message}
        >
          <Controller
            name="policyId"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                value={field.value ?? ""}
                onChange={(val) => field.onChange(val || null)}
                onBlur={field.onBlur}
                options={policyOptions}
                placeholder="Seleccionar póliza..."
                size="md"
                loading={policyLoading}
                error={!!errors.policyId}
                emptyMessage="No hay pólizas disponibles"
              />
            )}
          />
        </FormField>

        <FormField
          label="Tipo de Atención"
          htmlFor="careType"
          error={errors.careType?.message}
        >
          <Controller
            name="careType"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? ""}
                onChange={(val) => field.onChange((val as CareType) || null)}
                options={careTypeOptions}
                placeholder="Seleccionar..."
                size="md"
                error={!!errors.careType}
              />
            )}
          />
        </FormField>

        <FormField
          label="Diagnóstico"
          htmlFor="diagnosis"
          error={errors.diagnosis?.message}
        >
          <Controller
            name="diagnosis"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value || null)}
                placeholder="Diagnóstico..."
                error={!!errors.diagnosis}
              />
            )}
          />
        </FormField>

        <FormField
          label="Fecha de Incidente"
          htmlFor="incidentDate"
          error={errors.incidentDate?.message}
        >
          <Controller
            name="incidentDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={parseDate(field.value)}
                onChange={(date: Date | undefined) =>
                  field.onChange(formatDateToString(date))
                }
                size="md"
                error={!!errors.incidentDate}
              />
            )}
          />
        </FormField>

        <div className="col-span-3">
          <FormField
            label="Descripción"
            htmlFor="description"
            error={errors.description?.message}
            required
          >
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  rows={3}
                  placeholder="Descripción del reclamo..."
                  error={!!errors.description}
                />
              )}
            />
          </FormField>
        </div>
      </div>
    </FormSection>
  );
}

// =============================================================================
// SubmissionSection (IN_REVIEW -> SUBMITTED phase fields)
// =============================================================================

interface SubmissionSectionProps {
  control: Control<EditClaimForm>;
  errors: FieldErrors<EditClaimForm>;
}

function SubmissionSection({ control, errors }: SubmissionSectionProps) {
  return (
    <FormSection title="Envío">
      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
        <FormField
          label="Monto Enviado"
          htmlFor="amountSubmitted"
          error={errors.amountSubmitted?.message}
        >
          <Controller
            name="amountSubmitted"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={!!errors.amountSubmitted}
              />
            )}
          />
        </FormField>

        <FormField
          label="Fecha de Envío"
          htmlFor="submittedDate"
          error={errors.submittedDate?.message}
        >
          <Controller
            name="submittedDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={parseDate(field.value)}
                onChange={(date: Date | undefined) =>
                  field.onChange(formatDateToString(date))
                }
                size="md"
                error={!!errors.submittedDate}
              />
            )}
          />
        </FormField>
      </div>
    </FormSection>
  );
}

// =============================================================================
// SettlementSection (SUBMITTED -> SETTLED phase fields)
// =============================================================================

interface SettlementSectionProps {
  control: Control<EditClaimForm>;
  errors: FieldErrors<EditClaimForm>;
}

function SettlementSection({ control, errors }: SettlementSectionProps) {
  return (
    <FormSection title="Liquidación">
      <div className="grid grid-cols-3 gap-x-5 gap-y-4">
        {/* Settlement amounts */}
        <FormField
          label="Monto Aprobado"
          htmlFor="amountApproved"
          error={errors.amountApproved?.message}
        >
          <Controller
            name="amountApproved"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={!!errors.amountApproved}
              />
            )}
          />
        </FormField>

        <FormField
          label="Monto Rechazado"
          htmlFor="amountDenied"
          error={errors.amountDenied?.message}
        >
          <Controller
            name="amountDenied"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={!!errors.amountDenied}
              />
            )}
          />
        </FormField>

        <FormField
          label="Sin Procesar"
          htmlFor="amountUnprocessed"
          error={errors.amountUnprocessed?.message}
        >
          <Controller
            name="amountUnprocessed"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={!!errors.amountUnprocessed}
              />
            )}
          />
        </FormField>

        {/* Deductions */}
        <FormField
          label="Deducible"
          htmlFor="deductibleApplied"
          error={errors.deductibleApplied?.message}
        >
          <Controller
            name="deductibleApplied"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={!!errors.deductibleApplied}
              />
            )}
          />
        </FormField>

        <FormField
          label="Copago"
          htmlFor="copayApplied"
          error={errors.copayApplied?.message}
        >
          <Controller
            name="copayApplied"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={!!errors.copayApplied}
              />
            )}
          />
        </FormField>

        <FormField
          label="Fecha de Liquidación"
          htmlFor="settlementDate"
          error={errors.settlementDate?.message}
        >
          <Controller
            name="settlementDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={parseDate(field.value)}
                onChange={(date: Date | undefined) =>
                  field.onChange(formatDateToString(date))
                }
                size="md"
                error={!!errors.settlementDate}
              />
            )}
          />
        </FormField>

        {/* Settlement record */}
        <FormField
          label="Número de Liquidación"
          htmlFor="settlementNumber"
          error={errors.settlementNumber?.message}
        >
          <Controller
            name="settlementNumber"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value || null)}
                placeholder="Número..."
                error={!!errors.settlementNumber}
              />
            )}
          />
        </FormField>

        <div className="col-span-3">
          <FormField
            label="Notas de Liquidación"
            htmlFor="settlementNotes"
            error={errors.settlementNotes?.message}
          >
            <Controller
              name="settlementNotes"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  rows={3}
                  placeholder="Notas..."
                  error={!!errors.settlementNotes}
                />
              )}
            />
          </FormField>
        </div>
      </div>
    </FormSection>
  );
}

// =============================================================================
// ClaimEditForm
// =============================================================================

export interface ClaimEditFormProps {
  control: Control<EditClaimForm>;
  errors: FieldErrors<EditClaimForm>;
  policyOptions: SelectOption[];
  policyLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function ClaimEditForm({
  control,
  errors,
  policyOptions,
  policyLoading,
  onSubmit,
}: ClaimEditFormProps) {
  return (
    <form id="edit-claim-form" onSubmit={onSubmit} className="space-y-5">
      {/* DRAFT phase fields */}
      <ClaimInfoSection
        control={control}
        errors={errors}
        policyOptions={policyOptions}
        policyLoading={policyLoading}
      />
      {/* IN_REVIEW -> SUBMITTED phase fields */}
      <SubmissionSection control={control} errors={errors} />
      {/* SUBMITTED -> SETTLED phase fields */}
      <SettlementSection control={control} errors={errors} />
    </form>
  );
}

// =============================================================================
// ClaimEditModal
// =============================================================================

export interface ClaimEditModalProps {
  open: boolean;
  onClose: () => void;
  claim: ClaimDetail;
}

export function ClaimEditModal({ open, onClose, claim }: ClaimEditModalProps) {
  const form = useEditClaimForm(claim, open, onClose);
  const policyLookup = usePolicyLookup(claim.client.id);

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
        <Modal.Panel size="3xl">
          <Modal.Header>
            <Modal.Title>Editar Reclamo</Modal.Title>
            <Modal.Description>#{claim.claimNumber}</Modal.Description>
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

            <ClaimEditForm
              control={form.control}
              errors={form.errors}
              policyOptions={policyLookup.options}
              policyLoading={policyLookup.isLoading || policyLookup.isFetching}
              onSubmit={(e) => void form.handleSubmit(form.onSubmit)(e)}
            />
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="ghost"
              onClick={requestExit}
              disabled={form.isBusy}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="edit-claim-form"
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
              Tiene cambios sin guardar que se perderán.
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
