import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type FieldErrors,
} from "react-hook-form";
import { FilePlus, X, CircleCheck } from "lucide-react";
import {
  AlertDialog,
  Button,
  FormField,
  Textarea,
  SearchableSelect,
} from "@/components/ui";
import { LookupError } from "@/components/patterns";
import type { SelectOption } from "@/components/ui";
import { FileUploader } from "@/components/file-uploader";
import { cn } from "@/lib/utils";
import type { LookupState } from "../shared";
import { useNewClaimForm } from "./hooks";
import type {
  NewClaimLayoutProps,
  InsuredInfoCardProps,
  ClaimDetailsCardProps,
} from "./types";

// =============================================================================
// StepCard
// =============================================================================

export type StepCardVariant = "default" | "accent" | "success";

export interface StepCardProps {
  number: number;
  title: string;
  subtitle: string;
  variant?: StepCardVariant;
  headingLevel?: "h2" | "h3" | "h4";
  children: React.ReactNode;
  className?: string | undefined;
}

const headerGradients: Record<StepCardVariant, string> = {
  default: "from-primary/[0.03]",
  accent: "from-accent/[0.08]",
  success: "from-success/[0.05]",
};

export function StepCard({
  number,
  title,
  subtitle,
  variant = "default",
  headingLevel = "h2",
  children,
  className,
}: StepCardProps) {
  const Heading = headingLevel;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-white shadow-sm",
        className
      )}
    >
      <div
        className={cn(
          "border-b border-border/40 bg-gradient-to-r to-transparent px-4 py-3 sm:px-6 sm:py-4",
          headerGradients[variant]
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
            {number}
          </div>
          <div>
            <Heading className="text-base font-semibold text-text">
              {title}
            </Heading>
            <p className="text-xs text-text-muted">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}

// =============================================================================
// InfoItem
// =============================================================================

export interface InfoItemProps {
  number: number;
  title: string;
  description: string;
  as?: "div" | "li";
  className?: string | undefined;
}

export function InfoItem({
  number,
  title,
  description,
  as: Component = "div",
  className,
}: InfoItemProps) {
  return (
    <Component className={cn("flex gap-3", className)}>
      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {number}
      </div>
      <div>
        <p className="text-sm font-medium text-text">{title}</p>
        <p className="mt-0.5 text-xs text-text-muted">{description}</p>
      </div>
    </Component>
  );
}

// =============================================================================
// CascadingSelectField
// =============================================================================

export interface CascadingSelectFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  errors: FieldErrors<T>;
  label: string;
  options: SelectOption[];
  lookup: LookupState;
  required?: boolean;
  placeholder?: string;
  disabledPlaceholder?: string;
  disabled?: boolean;
  showError?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
}

export function CascadingSelectField<T extends FieldValues>({
  name,
  control,
  errors,
  label,
  options,
  lookup,
  required,
  placeholder = "Seleccionar...",
  disabledPlaceholder,
  disabled = false,
  showError = true,
  errorMessage = "Error al cargar datos",
  emptyMessage = "No hay opciones disponibles",
}: CascadingSelectFieldProps<T>) {
  const fieldError = errors[name];

  return (
    <FormField
      label={label}
      required={required ?? false}
      error={fieldError?.message as string | undefined}
    >
      {lookup.isError && showError ? (
        <LookupError
          message={errorMessage}
          onRetry={lookup.refetch}
          isFetching={lookup.isFetching}
        />
      ) : (
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <SearchableSelect
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              options={options}
              placeholder={
                disabled && disabledPlaceholder
                  ? disabledPlaceholder
                  : placeholder
              }
              disabled={disabled}
              loading={lookup.isLoading || lookup.isFetching}
              error={!!fieldError}
              emptyMessage={emptyMessage}
            />
          )}
        />
      )}
    </FormField>
  );
}

// =============================================================================
// ImportantInfoPanel
// =============================================================================

export interface ImportantInfoPanelProps {
  className?: string;
}

export function ImportantInfoPanel({ className }: ImportantInfoPanelProps) {
  return (
    <StepCard
      number={3}
      title="Información Importante"
      subtitle="Antes de continuar, tenga en cuenta"
      variant="success"
      className={className}
    >
      <div className="space-y-4">
        <InfoItem
          number={1}
          title="Documentos requeridos"
          description="Asegúrese de adjuntar facturas, recetas médicas y cualquier documento de respaldo."
        />
        <InfoItem
          number={2}
          title="Tiempo de procesamiento"
          description="Los reclamos son procesados en un plazo de 5 a 10 días hábiles."
        />
        <InfoItem
          number={3}
          title="Estado del reclamo"
          description="Podrá consultar el estado de su reclamo en cualquier momento desde el panel principal."
        />
      </div>
    </StepCard>
  );
}

// =============================================================================
// ClaimDetailsCard
// =============================================================================

export function ClaimDetailsCard({
  formState,
  fileUpload,
  isBusy,
}: ClaimDetailsCardProps) {
  const { control, errors } = formState;

  return (
    <StepCard
      number={2}
      title="Detalles del Reclamo"
      subtitle="Describa el motivo y adjunte documentos"
      variant="accent"
      className="h-full"
    >
      <div className="flex h-full flex-col gap-5">
        <FormField
          label="Descripción"
          required
          error={errors.description?.message}
        >
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                rows={5}
                placeholder="Describe el motivo del reclamo, incluyendo detalles relevantes como fecha de la consulta, tipo de atención recibida, y cualquier información adicional que facilite el proceso..."
                error={!!errors.description}
              />
            )}
          />
        </FormField>

        <fieldset className="flex flex-1 flex-col gap-3">
          <legend className="text-sm font-medium text-text">
            Documentos Adjuntos
          </legend>
          <FileUploader
            files={fileUpload.files}
            onAddFiles={fileUpload.addFiles}
            onRemoveFile={fileUpload.removeFile}
            onRetryFile={fileUpload.retryFile}
            selectedCategory={fileUpload.selectedCategory}
            onCategoryChange={fileUpload.setSelectedCategory}
            categories={fileUpload.categories}
            categoryIcons={fileUpload.categoryIcons}
            maxFiles={fileUpload.maxFiles}
            disabled={isBusy}
          />
        </fieldset>
      </div>
    </StepCard>
  );
}

// =============================================================================
// InsuredInfoCard
// =============================================================================

export function InsuredInfoCard({
  formState,
  selectsState,
}: InsuredInfoCardProps) {
  const { control, errors } = formState;
  const {
    clientId,
    affiliateId,
    clientOptions,
    affiliateOptions,
    patientOptions,
    clients,
    affiliates,
    patients,
  } = selectsState;

  return (
    <StepCard
      number={1}
      title="Información del Asegurado"
      subtitle="Seleccione el cliente, afiliado y paciente"
    >
      <div className="space-y-5">
        <CascadingSelectField
          name="clientId"
          control={control}
          errors={errors}
          label="Cliente"
          required
          options={clientOptions}
          lookup={clients}
          placeholder="Seleccionar cliente..."
          errorMessage="Error al cargar clientes"
          emptyMessage="No hay clientes disponibles"
        />

        <CascadingSelectField
          name="affiliateId"
          control={control}
          errors={errors}
          label="Afiliado"
          required
          options={affiliateOptions}
          lookup={affiliates}
          disabled={!clientId}
          showError={!!clientId}
          placeholder="Seleccionar afiliado..."
          disabledPlaceholder="Primero seleccione un cliente"
          errorMessage="Error al cargar afiliados"
          emptyMessage="No hay afiliados disponibles"
        />

        <CascadingSelectField
          name="patientId"
          control={control}
          errors={errors}
          label="Paciente"
          required
          options={patientOptions}
          lookup={patients}
          disabled={!affiliateId}
          showError={!!affiliateId}
          placeholder="Seleccionar paciente..."
          disabledPlaceholder="Primero seleccione un afiliado"
          errorMessage="Error al cargar pacientes"
          emptyMessage="No hay pacientes disponibles"
        />
      </div>
    </StepCard>
  );
}

// =============================================================================
// NewClaimHeader
// =============================================================================

export interface NewClaimHeaderProps {
  isBusy: boolean;
  canSubmit: boolean;
  onCancel: () => void;
}

export function NewClaimHeader({
  isBusy,
  canSubmit,
  onCancel,
}: NewClaimHeaderProps) {
  const cancelButtonProps = {
    type: "button" as const,
    variant: "secondary" as const,
    onClick: onCancel,
    disabled: isBusy,
  };

  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-primary/10 sm:flex">
            <FilePlus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-text sm:text-xl">
              Nuevo Reclamo
            </h1>
            <p className="hidden text-sm text-text-muted sm:block">
              Complete la información para registrar un nuevo reclamo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            {...cancelButtonProps}
            size="icon"
            className="sm:hidden"
            aria-label="Cancelar"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button {...cancelButtonProps} className="hidden sm:inline-flex">
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isBusy}
            disabled={!canSubmit}
          >
            <CircleCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Crear Reclamo</span>
            <span className="sm:hidden">Crear</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

// =============================================================================
// NewClaimLayout
// =============================================================================

export function NewClaimLayout({
  formState,
  headerState,
  headerHandlers,
  selectsState,
  fileUpload,
  exitDialog,
  onSubmit,
}: NewClaimLayoutProps) {
  return (
    <>
      <form
        onSubmit={(e) => void formState.handleSubmit(onSubmit)(e)}
        className="flex h-full flex-col"
      >
        <NewClaimHeader
          isBusy={headerState.isBusy}
          canSubmit={headerState.canSubmit}
          onCancel={headerHandlers.onCancel}
        />

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto grid max-w-screen-xl grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="order-1 flex flex-col gap-6">
              <InsuredInfoCard
                formState={formState}
                selectsState={selectsState}
              />
              <ImportantInfoPanel className="hidden flex-1 lg:flex lg:flex-col" />
            </div>

            <div className="order-2">
              <ClaimDetailsCard
                formState={formState}
                fileUpload={fileUpload}
                isBusy={headerState.isBusy}
              />
            </div>

            <ImportantInfoPanel className="order-3 lg:hidden" />
          </div>
        </div>
      </form>

      <AlertDialog open={exitDialog.open} onClose={exitDialog.onClose}>
        <AlertDialog.Panel>
          <AlertDialog.Icon variant="warning" />
          <AlertDialog.Title>Cambios sin guardar</AlertDialog.Title>
          <AlertDialog.Description>
            Tiene cambios sin guardar. ¿Está seguro que desea salir?
          </AlertDialog.Description>
          <AlertDialog.Actions>
            <Button variant="secondary" onClick={exitDialog.onClose}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={exitDialog.onConfirm}>
              Salir sin guardar
            </Button>
          </AlertDialog.Actions>
        </AlertDialog.Panel>
      </AlertDialog>
    </>
  );
}

// =============================================================================
// NewClaimView (Entry Point)
// =============================================================================

export function NewClaimView() {
  const claim = useNewClaimForm();

  return (
    <NewClaimLayout
      formState={claim.formState}
      headerState={claim.headerState}
      headerHandlers={claim.headerHandlers}
      selectsState={claim.selectsState}
      fileUpload={claim.fileUpload}
      exitDialog={claim.exitDialog}
      onSubmit={claim.onSubmit}
    />
  );
}
