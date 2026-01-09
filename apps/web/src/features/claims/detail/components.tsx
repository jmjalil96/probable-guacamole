import { useNavigate } from "@tanstack/react-router";
import { Pencil, ChevronDown } from "lucide-react";
import type { ClaimDetail, ClaimStatus } from "shared";
import { CLAIM_TRANSITIONS, CLAIM_TERMINAL_STATUSES } from "shared";
import {
  LoadingScreen,
  Button,
  StatusBadge,
  Tabs,
  type TabOption,
  FieldSection,
  Alert,
  Modal,
  FormField,
  Textarea,
} from "@/components/ui";
import {
  DetailHeader,
  WorkflowStepper,
  type WorkflowStep,
} from "@/components/patterns";
import { formatDate, formatCurrency } from "@/lib/formatting";
import { STATUS_STYLES, STATUS_LABELS, CARE_TYPE_LABELS } from "../shared";
import { useClaimDetail } from "./hooks";
import { ClaimEditModal } from "./claim-edit.components";
import { ClaimInvoicesTab } from "./invoices";
import { ClaimDocumentsTab } from "./documents";
import { ClaimAuditTab } from "./audit";
import { ClaimNotesTab } from "./notes";
import type {
  ClaimDetailTab,
  TabState,
  ModalState,
  TransitionState,
  TransitionHandlers,
  TransitionModalConfig,
  TransitionError,
} from "./types";

// =============================================================================
// TransitionModal
// =============================================================================

export interface TransitionModalProps {
  config: TransitionModalConfig | null;
  onConfirm: () => void;
  onClose: () => void;
  isBusy: boolean;
  /** If provided, shows a reason textarea */
  reason?: {
    value: string;
    onChange: (value: string) => void;
  };
}

export function TransitionModal({
  config,
  onConfirm,
  onClose,
  isBusy,
  reason,
}: TransitionModalProps) {
  const needsReason = !!reason;
  const canConfirm = needsReason ? reason.value.trim().length > 0 : true;

  return (
    <Modal open={!!config} onClose={onClose}>
      <Modal.Panel size="md">
        <Modal.Header>
          <Modal.Title>{config?.title}</Modal.Title>
          {config?.description && (
            <Modal.Description>{config.description}</Modal.Description>
          )}
        </Modal.Header>

        {needsReason && (
          <Modal.Body>
            <FormField label="Motivo" htmlFor="transition-reason">
              <Textarea
                id="transition-reason"
                value={reason.value}
                onChange={(e) => reason.onChange(e.target.value)}
                placeholder="Ingrese el motivo..."
                rows={4}
                autoFocus
              />
            </FormField>
          </Modal.Body>
        )}

        <Modal.Footer>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!canConfirm || isBusy}
            loading={isBusy}
            variant={
              config?.targetStatus === "CANCELLED" ? "destructive" : "primary"
            }
          >
            Confirmar
          </Button>
        </Modal.Footer>
      </Modal.Panel>
    </Modal>
  );
}

// =============================================================================
// ClaimWorkflowStepper
// =============================================================================

const WORKFLOW_STEPS: WorkflowStep<ClaimStatus>[] = [
  { id: "DRAFT", label: "Borrador" },
  { id: "IN_REVIEW", label: "En Revisión" },
  { id: "SUBMITTED", label: "Enviado" },
  { id: "SETTLED", label: "Liquidado" },
];

const TRANSITION_LABELS: Record<string, string> = {
  "DRAFT->IN_REVIEW": "Enviar a Revisión",
  "DRAFT->CANCELLED": "Cancelar Reclamo",
  "IN_REVIEW->SUBMITTED": "Enviar Reclamo",
  "IN_REVIEW->RETURNED": "Devolver",
  "IN_REVIEW->CANCELLED": "Cancelar Reclamo",
  "SUBMITTED->PENDING_INFO": "Solicitar Info",
  "SUBMITTED->SETTLED": "Liquidar",
  "SUBMITTED->CANCELLED": "Cancelar Reclamo",
  "PENDING_INFO->SUBMITTED": "Reenviar",
  "PENDING_INFO->CANCELLED": "Cancelar Reclamo",
};

const TERMINAL_VARIANTS: Record<ClaimStatus, "success" | "warning" | "error"> =
  {
    SETTLED: "success",
    RETURNED: "warning",
    CANCELLED: "error",
    DRAFT: "success",
    IN_REVIEW: "success",
    SUBMITTED: "success",
    PENDING_INFO: "success",
  };

const OFF_PATH_DISPLAY: Partial<Record<ClaimStatus, { label: string }>> = {
  PENDING_INFO: { label: "Info Pendiente" },
};

export interface ClaimWorkflowStepperProps {
  status: ClaimStatus;
  onTransition?: ((to: ClaimStatus) => void) | undefined;
  isBusy?: boolean | undefined;
  className?: string | undefined;
}

export function ClaimWorkflowStepper({
  status,
  onTransition,
  isBusy,
  className,
}: ClaimWorkflowStepperProps) {
  return (
    <WorkflowStepper<ClaimStatus>
      steps={WORKFLOW_STEPS}
      currentStatus={status}
      transitions={CLAIM_TRANSITIONS as Record<ClaimStatus, ClaimStatus[]>}
      terminalStates={[...CLAIM_TERMINAL_STATUSES]}
      onTransition={onTransition}
      isBusy={isBusy}
      statusLabels={STATUS_LABELS}
      transitionLabels={TRANSITION_LABELS}
      terminalVariants={TERMINAL_VARIANTS}
      offPathDisplay={OFF_PATH_DISPLAY}
      cancelStatus="CANCELLED"
      className={className}
    />
  );
}

// =============================================================================
// ClaimGeneralTab
// =============================================================================

export interface ClaimGeneralTabProps {
  claim: ClaimDetail;
  onTransition?: ((to: ClaimStatus) => void) | undefined;
  isBusy?: boolean | undefined;
  transitionError?: TransitionError | null;
  onDismissError?: () => void;
}

export function ClaimGeneralTab({
  claim,
  onTransition,
  isBusy,
  transitionError,
  onDismissError,
}: ClaimGeneralTabProps) {
  return (
    <div className="space-y-6">
      <ClaimWorkflowStepper
        status={claim.status}
        onTransition={onTransition}
        isBusy={isBusy}
      />

      {transitionError && (
        <Alert
          variant="error"
          title={transitionError.title}
          description={transitionError.description}
          items={
            transitionError.items.length > 0 ? transitionError.items : undefined
          }
          onDismiss={onDismissError}
        />
      )}

      {/* Section 1: Relationships */}
      <FieldSection
        title="Relaciones"
        columns={3}
        fields={[
          { label: "Cliente", value: claim.client.name },
          { label: "Afiliado", value: claim.affiliate.name },
          { label: "Paciente", value: claim.patient.name },
        ]}
      />

      {/* Section 2: Claim Information (DRAFT/IN_REVIEW phase) */}
      <FieldSection
        title="Información del Reclamo"
        columns={2}
        fields={[
          { label: "Número de Póliza", value: claim.policy?.number ?? "—" },
          {
            label: "Tipo de Atención",
            value: claim.careType ? CARE_TYPE_LABELS[claim.careType] : "—",
          },
          { label: "Diagnóstico", value: claim.diagnosis ?? "—" },
          {
            label: "Fecha de Incidente",
            value: formatDate(claim.incidentDate),
          },
          { label: "Descripción", value: claim.description, span: "full" },
        ]}
      />

      {/* Section 3: Submission (IN_REVIEW -> SUBMITTED phase) */}
      <FieldSection
        title="Envío"
        columns={2}
        fields={[
          {
            label: "Monto Enviado",
            value: formatCurrency(claim.amountSubmitted),
          },
          { label: "Fecha de Envío", value: formatDate(claim.submittedDate) },
        ]}
      />

      {/* Section 4: Settlement (SUBMITTED -> SETTLED phase) */}
      <FieldSection
        title="Liquidación"
        columns={3}
        fields={[
          {
            label: "Monto Aprobado",
            value: formatCurrency(claim.amountApproved),
          },
          {
            label: "Monto Rechazado",
            value: formatCurrency(claim.amountDenied),
          },
          {
            label: "Sin Procesar",
            value: formatCurrency(claim.amountUnprocessed),
          },
          {
            label: "Deducible",
            value: formatCurrency(claim.deductibleApplied),
          },
          { label: "Copago", value: formatCurrency(claim.copayApplied) },
          {
            label: "Fecha de Liquidación",
            value: formatDate(claim.settlementDate),
          },
          {
            label: "Número de Liquidación",
            value: claim.settlementNumber ?? "—",
          },
          {
            label: "Días Hábiles",
            value: claim.businessDays?.toString() ?? "—",
          },
          {
            label: "Notas de Liquidación",
            value: claim.settlementNotes ?? "—",
            span: "full",
          },
        ]}
      />

      {/* Section 5: Audit Trail */}
      <FieldSection
        title="Metadatos"
        columns={2}
        fields={[
          { label: "Creado Por", value: claim.createdBy.name },
          { label: "Fecha de Creación", value: formatDate(claim.createdAt) },
          { label: "Actualizado Por", value: claim.updatedBy?.name ?? "—" },
          { label: "Última Actualización", value: formatDate(claim.updatedAt) },
        ]}
      />
    </div>
  );
}

// =============================================================================
// ClaimDetailTabs
// =============================================================================

const TAB_LABELS: Record<ClaimDetailTab, string> = {
  general: "General",
  documents: "Documentos",
  invoices: "Facturas",
  notes: "Notas",
  audit: "Historial",
};

export interface ClaimDetailTabsProps {
  value: ClaimDetailTab;
  onChange: (value: ClaimDetailTab) => void;
  documentsCount?: number;
  invoicesCount?: number;
  notesCount?: number;
  auditCount?: number;
  className?: string;
}

export function ClaimDetailTabs({
  value,
  onChange,
  documentsCount,
  invoicesCount,
  notesCount,
  auditCount,
  className,
}: ClaimDetailTabsProps) {
  const options: TabOption<ClaimDetailTab>[] = [
    { value: "general", label: TAB_LABELS.general },
    { value: "documents", label: TAB_LABELS.documents, count: documentsCount },
    { value: "invoices", label: TAB_LABELS.invoices, count: invoicesCount },
    { value: "notes", label: TAB_LABELS.notes, count: notesCount },
    { value: "audit", label: TAB_LABELS.audit, count: auditCount },
  ];

  return (
    <Tabs<ClaimDetailTab>
      value={value}
      onChange={onChange}
      options={options}
      className={className}
    />
  );
}

// =============================================================================
// ClaimDetailHeader
// =============================================================================

export interface ClaimDetailHeaderProps {
  claim: ClaimDetail;
  canEdit?: boolean;
  onEdit?: () => void;
  onStatusChange?: () => void;
}

export function ClaimDetailHeader({
  claim,
  canEdit = true,
  onEdit,
  onStatusChange,
}: ClaimDetailHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    void navigate({ to: "/claims" });
  };

  return (
    <DetailHeader>
      <DetailHeader.TopBar onBack={handleBack} backLabel="Volver a Reclamos">
        {canEdit && onEdit && (
          <Button variant="secondary" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        )}
        {onStatusChange && (
          <Button variant="primary" onClick={onStatusChange}>
            Cambiar Estado
            <ChevronDown className="h-4 w-4" />
          </Button>
        )}
      </DetailHeader.TopBar>

      <DetailHeader.Main
        title={`#${claim.claimNumber}`}
        badge={
          <StatusBadge
            status={claim.status}
            styles={STATUS_STYLES}
            labels={STATUS_LABELS}
          />
        }
      >
        <DetailHeader.InfoItem value={claim.patient.name} />

        {claim.submittedDate && (
          <DetailHeader.InfoItem
            label="Enviado"
            value={formatDate(claim.submittedDate)}
          />
        )}

        {claim.amountSubmitted && (
          <DetailHeader.InfoItem
            value={formatCurrency(claim.amountSubmitted)}
          />
        )}

        <DetailHeader.InfoItem label="Cliente" value={claim.client.name} />
      </DetailHeader.Main>
    </DetailHeader>
  );
}

// =============================================================================
// ClaimDetailLayout
// =============================================================================

export interface ClaimDetailLayoutProps {
  claim: ClaimDetail;
  tabState: TabState;
  modalState: ModalState;
  transitionState: TransitionState;
  transitionHandlers: TransitionHandlers;
}

export function ClaimDetailLayout({
  claim,
  tabState,
  modalState,
  transitionState,
  transitionHandlers,
}: ClaimDetailLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      <ClaimDetailHeader claim={claim} onEdit={modalState.editModal.onOpen} />

      <ClaimDetailTabs
        value={tabState.activeTab}
        onChange={tabState.setActiveTab}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {tabState.activeTab === "general" && (
          <ClaimGeneralTab
            claim={claim}
            onTransition={transitionHandlers.handleTransition}
            isBusy={transitionState.isTransitioning}
            transitionError={transitionState.transitionError}
            onDismissError={transitionHandlers.dismissError}
          />
        )}

        {tabState.activeTab === "documents" && (
          <ClaimDocumentsTab claimId={claim.id} />
        )}
        {tabState.activeTab === "invoices" && (
          <ClaimInvoicesTab claimId={claim.id} />
        )}
        {tabState.activeTab === "notes" && <ClaimNotesTab claimId={claim.id} />}
        {tabState.activeTab === "audit" && <ClaimAuditTab claimId={claim.id} />}
      </div>

      <TransitionModal
        config={transitionState.reasonModal}
        onConfirm={transitionHandlers.handleReasonModalConfirm}
        onClose={transitionHandlers.handleReasonModalClose}
        isBusy={transitionState.isTransitioning}
        reason={{
          value: transitionState.reason,
          onChange: transitionHandlers.setReason,
        }}
      />

      <TransitionModal
        config={transitionState.confirmModal}
        onConfirm={transitionHandlers.handleConfirmModalConfirm}
        onClose={transitionHandlers.handleConfirmModalClose}
        isBusy={transitionState.isTransitioning}
      />

      <ClaimEditModal
        key={modalState.editModal.key}
        open={modalState.editModal.open}
        onClose={modalState.editModal.onClose}
        claim={claim}
      />
    </div>
  );
}

// =============================================================================
// ClaimDetailView (Entry Point)
// =============================================================================

function ClaimDetailError({ error }: { error: Error | null }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-text">
          Error al cargar el reclamo
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          {error?.message ?? "No se encontró el reclamo solicitado."}
        </p>
      </div>
    </div>
  );
}

export interface ClaimDetailViewProps {
  claimId: string;
}

export function ClaimDetailView({ claimId }: ClaimDetailViewProps) {
  const detail = useClaimDetail(claimId);

  if (detail.isLoading) {
    return <LoadingScreen />;
  }

  if (detail.isError || !detail.claim) {
    return <ClaimDetailError error={detail.error} />;
  }

  return (
    <ClaimDetailLayout
      claim={detail.claim}
      tabState={detail.tabState}
      modalState={detail.modalState}
      transitionState={detail.transitionState}
      transitionHandlers={detail.transitionHandlers}
    />
  );
}
