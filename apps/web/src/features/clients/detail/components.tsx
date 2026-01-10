import { useNavigate } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import type { Client } from "shared";
import {
  LoadingScreen,
  Button,
  StatusBadge,
  FieldSection,
} from "@/components/ui";
import { DetailHeader } from "@/components/patterns";
import { formatDate } from "@/lib/formatting";
import { ACTIVE_STYLES, ACTIVE_LABELS } from "../shared";
import { useClientDetail } from "./hooks";
import {
  ClientEditModal,
  ClientDeleteDialog,
} from "./client-edit.components";
import type { ModalState, DeleteState } from "./types";

// =============================================================================
// ClientDetailHeader
// =============================================================================

export interface ClientDetailHeaderProps {
  client: Client;
  onEdit: () => void;
  onDelete: () => void;
}

export function ClientDetailHeader({
  client,
  onEdit,
  onDelete,
}: ClientDetailHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    void navigate({ to: "/clients" });
  };

  return (
    <DetailHeader>
      <DetailHeader.TopBar onBack={handleBack} backLabel="Volver a Clientes">
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
        title={client.name}
        badge={
          <StatusBadge
            status={String(client.isActive)}
            styles={ACTIVE_STYLES}
            labels={ACTIVE_LABELS}
          />
        }
      />
    </DetailHeader>
  );
}

// =============================================================================
// ClientInfoSection (single section, no contact info - just metadata)
// =============================================================================

export interface ClientInfoSectionProps {
  client: Client;
}

export function ClientInfoSection({ client }: ClientInfoSectionProps) {
  return (
    <div className="space-y-6">
      {/* Metadata */}
      <FieldSection
        title="Metadatos"
        columns={2}
        fields={[
          { label: "Fecha de Creacion", value: formatDate(client.createdAt) },
          {
            label: "Ultima Actualizacion",
            value: formatDate(client.updatedAt),
          },
        ]}
      />
    </div>
  );
}

// =============================================================================
// ClientDetailLayout
// =============================================================================

export interface ClientDetailLayoutProps {
  client: Client;
  modalState: ModalState;
  deleteState: DeleteState;
  deleteHandlers: {
    openDelete: () => void;
    confirmDelete: () => void;
    cancelDelete: () => void;
  };
}

export function ClientDetailLayout({
  client,
  modalState,
  deleteState,
  deleteHandlers,
}: ClientDetailLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      <ClientDetailHeader
        client={client}
        onEdit={modalState.editModal.onOpen}
        onDelete={deleteHandlers.openDelete}
      />

      {/* No tabs - single content area */}
      <div className="flex-1 overflow-y-auto p-6">
        <ClientInfoSection client={client} />
      </div>

      <ClientEditModal
        key={modalState.editModal.key}
        open={modalState.editModal.open}
        onClose={modalState.editModal.onClose}
        client={client}
      />

      <ClientDeleteDialog
        open={deleteState.open}
        client={client}
        isDeleting={deleteState.isDeleting}
        onConfirm={deleteHandlers.confirmDelete}
        onCancel={deleteHandlers.cancelDelete}
      />
    </div>
  );
}

// =============================================================================
// ClientDetailView (Entry Point)
// =============================================================================

function ClientDetailError({ error }: { error: Error | null }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-text">
          Error al cargar el cliente
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          {error?.message ?? "No se encontro el cliente solicitado."}
        </p>
      </div>
    </div>
  );
}

export interface ClientDetailViewProps {
  clientId: string;
}

export function ClientDetailView({ clientId }: ClientDetailViewProps) {
  const detail = useClientDetail(clientId);

  if (detail.isLoading) {
    return <LoadingScreen />;
  }

  if (detail.isError || !detail.client) {
    return <ClientDetailError error={detail.error} />;
  }

  return (
    <ClientDetailLayout
      client={detail.client}
      modalState={detail.modalState}
      deleteState={detail.deleteState}
      deleteHandlers={detail.deleteHandlers}
    />
  );
}
