import { useNavigate } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import type { Insurer } from "shared";
import {
  LoadingScreen,
  Button,
  StatusBadge,
  FieldSection,
} from "@/components/ui";
import { DetailHeader } from "@/components/patterns";
import { formatDate } from "@/lib/formatting";
import {
  TYPE_STYLES,
  TYPE_LABELS,
  ACTIVE_STYLES,
  ACTIVE_LABELS,
} from "../shared";
import { useInsurerDetail } from "./hooks";
import {
  InsurerEditModal,
  InsurerDeleteDialog,
} from "./insurer-edit.components";
import type { ModalState, DeleteState } from "./types";

// =============================================================================
// InsurerDetailHeader
// =============================================================================

export interface InsurerDetailHeaderProps {
  insurer: Insurer;
  onEdit: () => void;
  onDelete: () => void;
}

export function InsurerDetailHeader({
  insurer,
  onEdit,
  onDelete,
}: InsurerDetailHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    void navigate({ to: "/insurers" });
  };

  return (
    <DetailHeader>
      <DetailHeader.TopBar onBack={handleBack} backLabel="Volver a Aseguradoras">
        <Button variant="secondary" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
        <Button variant="destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
          Eliminar
        </Button>
      </DetailHeader.TopBar>

      <DetailHeader.Main
        title={insurer.name}
        badge={
          <StatusBadge
            status={insurer.type}
            styles={TYPE_STYLES}
            labels={TYPE_LABELS}
          />
        }
      >
        {insurer.code && (
          <DetailHeader.InfoItem label="Codigo" value={insurer.code} />
        )}
        <DetailHeader.InfoItem
          label="Estado"
          value={
            <StatusBadge
              status={String(insurer.isActive)}
              styles={ACTIVE_STYLES}
              labels={ACTIVE_LABELS}
            />
          }
        />
      </DetailHeader.Main>
    </DetailHeader>
  );
}

// =============================================================================
// InsurerInfoSection (single section, no tabs needed)
// =============================================================================

export interface InsurerInfoSectionProps {
  insurer: Insurer;
}

export function InsurerInfoSection({ insurer }: InsurerInfoSectionProps) {
  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <FieldSection
        title="Informacion de Contacto"
        columns={2}
        fields={[
          { label: "Email", value: insurer.email ?? "—" },
          { label: "Telefono", value: insurer.phone ?? "—" },
          {
            label: "Sitio Web",
            value: insurer.website ? (
              <a
                href={insurer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {insurer.website}
              </a>
            ) : (
              "—"
            ),
            span: "full",
          },
        ]}
      />

      {/* Metadata */}
      <FieldSection
        title="Metadatos"
        columns={2}
        fields={[
          { label: "Fecha de Creacion", value: formatDate(insurer.createdAt) },
          {
            label: "Ultima Actualizacion",
            value: formatDate(insurer.updatedAt),
          },
        ]}
      />
    </div>
  );
}

// =============================================================================
// InsurerDetailLayout
// =============================================================================

export interface InsurerDetailLayoutProps {
  insurer: Insurer;
  modalState: ModalState;
  deleteState: DeleteState;
  deleteHandlers: {
    openDelete: () => void;
    confirmDelete: () => void;
    cancelDelete: () => void;
  };
}

export function InsurerDetailLayout({
  insurer,
  modalState,
  deleteState,
  deleteHandlers,
}: InsurerDetailLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      <InsurerDetailHeader
        insurer={insurer}
        onEdit={modalState.editModal.onOpen}
        onDelete={deleteHandlers.openDelete}
      />

      {/* No tabs - single content area */}
      <div className="flex-1 overflow-y-auto p-6">
        <InsurerInfoSection insurer={insurer} />
      </div>

      <InsurerEditModal
        key={modalState.editModal.key}
        open={modalState.editModal.open}
        onClose={modalState.editModal.onClose}
        insurer={insurer}
      />

      <InsurerDeleteDialog
        open={deleteState.open}
        insurer={insurer}
        isDeleting={deleteState.isDeleting}
        onConfirm={deleteHandlers.confirmDelete}
        onCancel={deleteHandlers.cancelDelete}
      />
    </div>
  );
}

// =============================================================================
// InsurerDetailView (Entry Point)
// =============================================================================

function InsurerDetailError({ error }: { error: Error | null }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-text">
          Error al cargar la aseguradora
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          {error?.message ?? "No se encontro la aseguradora solicitada."}
        </p>
      </div>
    </div>
  );
}

export interface InsurerDetailViewProps {
  insurerId: string;
}

export function InsurerDetailView({ insurerId }: InsurerDetailViewProps) {
  const detail = useInsurerDetail(insurerId);

  if (detail.isLoading) {
    return <LoadingScreen />;
  }

  if (detail.isError || !detail.insurer) {
    return <InsurerDetailError error={detail.error} />;
  }

  return (
    <InsurerDetailLayout
      insurer={detail.insurer}
      modalState={detail.modalState}
      deleteState={detail.deleteState}
      deleteHandlers={detail.deleteHandlers}
    />
  );
}
