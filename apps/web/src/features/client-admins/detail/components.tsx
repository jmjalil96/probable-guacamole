import { useNavigate } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import type { ClientAdmin } from "shared";
import {
  LoadingScreen,
  Button,
  StatusBadge,
  Tabs,
  type TabOption,
  FieldSection,
} from "@/components/ui";
import { DetailHeader } from "@/components/patterns";
import { formatDate } from "@/lib/formatting";
import { ACTIVE_STYLES, ACTIVE_LABELS } from "../shared";
import { useClientAdminDetail } from "./hooks";
import { ClientAdminEditModal } from "./client-admin-edit.components";
import { ClientAdminClientsTab } from "./clients";
import type { ClientAdminDetailTab, TabState, ModalState } from "./types";

// =============================================================================
// ClientAdminDetailTabs
// =============================================================================

const TAB_LABELS: Record<ClientAdminDetailTab, string> = {
  general: "General",
  clients: "Clientes",
};

export interface ClientAdminDetailTabsProps {
  value: ClientAdminDetailTab;
  onChange: (value: ClientAdminDetailTab) => void;
  clientsCount?: number;
  className?: string;
}

export function ClientAdminDetailTabs({
  value,
  onChange,
  clientsCount,
  className,
}: ClientAdminDetailTabsProps) {
  const options: TabOption<ClientAdminDetailTab>[] = [
    { value: "general", label: TAB_LABELS.general },
    { value: "clients", label: TAB_LABELS.clients, count: clientsCount },
  ];

  return (
    <Tabs<ClientAdminDetailTab>
      value={value}
      onChange={onChange}
      options={options}
      className={className}
    />
  );
}

// =============================================================================
// ClientAdminDetailHeader
// =============================================================================

export interface ClientAdminDetailHeaderProps {
  clientAdmin: ClientAdmin;
  onEdit: () => void;
}

export function ClientAdminDetailHeader({
  clientAdmin,
  onEdit,
}: ClientAdminDetailHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    void navigate({ to: "/users" });
  };

  return (
    <DetailHeader>
      <DetailHeader.TopBar
        onBack={handleBack}
        backLabel="Volver a Usuarios"
      >
        <Button variant="secondary" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
      </DetailHeader.TopBar>

      <DetailHeader.Main
        title={`${clientAdmin.firstName} ${clientAdmin.lastName}`}
        badge={
          <StatusBadge
            status={String(clientAdmin.isActive)}
            styles={ACTIVE_STYLES}
            labels={ACTIVE_LABELS}
          />
        }
      >
        <DetailHeader.InfoItem value={clientAdmin.email} />
        {clientAdmin.jobTitle && (
          <DetailHeader.InfoItem label="Cargo" value={clientAdmin.jobTitle} />
        )}
      </DetailHeader.Main>
    </DetailHeader>
  );
}

// =============================================================================
// ClientAdminGeneralTab
// =============================================================================

export interface ClientAdminGeneralTabProps {
  clientAdmin: ClientAdmin;
}

export function ClientAdminGeneralTab({ clientAdmin }: ClientAdminGeneralTabProps) {
  return (
    <div className="space-y-6">
      <FieldSection
        title="Informacion Personal"
        columns={2}
        fields={[
          { label: "Nombre", value: clientAdmin.firstName },
          { label: "Apellido", value: clientAdmin.lastName },
          { label: "Correo Electronico", value: clientAdmin.email },
          { label: "Telefono", value: clientAdmin.phone ?? "—" },
        ]}
      />

      <FieldSection
        title="Informacion Laboral"
        columns={2}
        fields={[
          { label: "Cargo", value: clientAdmin.jobTitle ?? "—" },
          { label: "Tiene Cuenta", value: clientAdmin.hasAccount ? "Si" : "No" },
        ]}
      />

      <FieldSection
        title="Estadisticas"
        columns={2}
        fields={[
          { label: "Clientes Asignados", value: clientAdmin.clientCount.toString() },
        ]}
      />

      <FieldSection
        title="Metadatos"
        columns={2}
        fields={[
          { label: "Fecha de Creacion", value: formatDate(clientAdmin.createdAt) },
          {
            label: "Ultima Actualizacion",
            value: formatDate(clientAdmin.updatedAt),
          },
        ]}
      />
    </div>
  );
}

// =============================================================================
// ClientAdminDetailLayout
// =============================================================================

export interface ClientAdminDetailLayoutProps {
  clientAdmin: ClientAdmin;
  tabState: TabState;
  modalState: ModalState;
}

export function ClientAdminDetailLayout({
  clientAdmin,
  tabState,
  modalState,
}: ClientAdminDetailLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      <ClientAdminDetailHeader
        clientAdmin={clientAdmin}
        onEdit={modalState.editModal.onOpen}
      />

      <ClientAdminDetailTabs
        value={tabState.activeTab}
        onChange={tabState.setActiveTab}
        clientsCount={clientAdmin.clientCount}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {tabState.activeTab === "general" && (
          <ClientAdminGeneralTab clientAdmin={clientAdmin} />
        )}
        {tabState.activeTab === "clients" && (
          <ClientAdminClientsTab clientAdminId={clientAdmin.id} />
        )}
      </div>

      <ClientAdminEditModal
        key={modalState.editModal.key}
        open={modalState.editModal.open}
        onClose={modalState.editModal.onClose}
        clientAdmin={clientAdmin}
      />
    </div>
  );
}

// =============================================================================
// ClientAdminDetailView (Entry Point)
// =============================================================================

function ClientAdminDetailError({ error }: { error: Error | null }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-text">
          Error al cargar el administrador
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          {error?.message ?? "No se encontro el administrador solicitado."}
        </p>
      </div>
    </div>
  );
}

export interface ClientAdminDetailViewProps {
  clientAdminId: string;
}

export function ClientAdminDetailView({ clientAdminId }: ClientAdminDetailViewProps) {
  const detail = useClientAdminDetail(clientAdminId);

  if (detail.isLoading) {
    return <LoadingScreen />;
  }

  if (detail.isError || !detail.clientAdmin) {
    return <ClientAdminDetailError error={detail.error} />;
  }

  return (
    <ClientAdminDetailLayout
      clientAdmin={detail.clientAdmin}
      tabState={detail.tabState}
      modalState={detail.modalState}
    />
  );
}
