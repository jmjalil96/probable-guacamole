import type { AffiliateDetail, AffiliateDependent } from "shared";
import { Link } from "@tanstack/react-router";
import { LoadingScreen, StatusBadge, FieldSection } from "@/components/ui";
import { DetailHeader } from "@/components/patterns";
import { formatDate } from "@/lib/formatting";
import {
  ACTIVE_STYLES,
  ACTIVE_LABELS,
  GENDER_LABELS,
  MARITAL_STATUS_LABELS,
  RELATIONSHIP_LABELS,
  AffiliateDetailError,
} from "../shared";
import { useAffiliateDetail } from "./hooks";
import type { AffiliateDetailLayoutProps } from "./types";

// =============================================================================
// Type Badge Styles (Titular vs Dependiente)
// =============================================================================

const TYPE_STYLES: Record<string, string> = {
  titular: "bg-blue-50 text-blue-700",
  dependiente: "bg-amber-50 text-amber-700",
};

const TYPE_LABELS: Record<string, string> = {
  titular: "Titular",
  dependiente: "Dependiente",
};

// =============================================================================
// DependentsList
// =============================================================================

interface DependentsListProps {
  dependents: AffiliateDependent[];
}

function DependentsList({ dependents }: DependentsListProps) {
  return (
    <div className="divide-y divide-border">
      {dependents.map((dep) => (
        <Link
          key={dep.id}
          to="/affiliates/$affiliateId"
          params={{ affiliateId: dep.id }}
          className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface-hover"
        >
          <div>
            <p className="font-medium text-primary">
              {dep.firstName} {dep.lastName}
            </p>
            <p className="text-sm text-text-muted">
              {dep.relationship
                ? RELATIONSHIP_LABELS[dep.relationship]
                : "Sin relación"}
              {dep.documentNumber && ` • ${dep.documentNumber}`}
            </p>
          </div>
          <StatusBadge
            status={String(dep.isActive)}
            styles={ACTIVE_STYLES}
            labels={ACTIVE_LABELS}
          />
        </Link>
      ))}
    </div>
  );
}

// =============================================================================
// AffiliateDetailHeader
// =============================================================================

export interface AffiliateDetailHeaderProps {
  affiliate: AffiliateDetail;
  onBack: () => void;
}

export function AffiliateDetailHeader({
  affiliate,
  onBack,
}: AffiliateDetailHeaderProps) {
  const isDependent = affiliate.primaryAffiliate !== null;

  return (
    <DetailHeader>
      <DetailHeader.TopBar onBack={onBack} backLabel="Volver a Afiliados" />

      <DetailHeader.Main
        title={`${affiliate.firstName} ${affiliate.lastName}`}
        badge={
          <StatusBadge
            status={String(affiliate.isActive)}
            styles={ACTIVE_STYLES}
            labels={ACTIVE_LABELS}
          />
        }
      >
        <DetailHeader.InfoItem
          label="Tipo"
          value={
            <StatusBadge
              status={isDependent ? "dependiente" : "titular"}
              styles={TYPE_STYLES}
              labels={TYPE_LABELS}
            />
          }
        />
        <DetailHeader.InfoItem label="Cliente" value={affiliate.client.name} />
        <DetailHeader.InfoItem
          label="Documento"
          value={affiliate.documentNumber ?? "—"}
        />
        {!isDependent && (
          <DetailHeader.InfoItem
            label="Dependientes"
            value={String(affiliate.dependentsCount)}
          />
        )}
      </DetailHeader.Main>
    </DetailHeader>
  );
}

// =============================================================================
// AffiliateMainTab
// =============================================================================

export interface AffiliateMainTabProps {
  affiliate: AffiliateDetail;
}

export function AffiliateMainTab({ affiliate }: AffiliateMainTabProps) {
  const isDependent = affiliate.primaryAffiliate !== null;

  return (
    <div className="space-y-6">
      {/* Section 0: Parent Affiliate (for dependents only) */}
      {isDependent && affiliate.primaryAffiliate && (
        <FieldSection
          title="Titular Principal"
          columns={2}
          fields={[
            {
              label: "Nombre",
              value: (
                <Link
                  to="/affiliates/$affiliateId"
                  params={{ affiliateId: affiliate.primaryAffiliate.id }}
                  className="font-medium text-primary hover:underline"
                >
                  {affiliate.primaryAffiliate.name}
                </Link>
              ),
            },
          ]}
        />
      )}

      {/* Section 1: Personal Information */}
      <FieldSection
        title="Información Personal"
        columns={3}
        fields={[
          { label: "Nombre", value: affiliate.firstName },
          { label: "Apellido", value: affiliate.lastName },
          { label: "Documento", value: affiliate.documentNumber ?? "—" },
          { label: "Tipo Documento", value: affiliate.documentType ?? "—" },
          {
            label: "Fecha Nacimiento",
            value: formatDate(affiliate.dateOfBirth),
          },
          {
            label: "Género",
            value: affiliate.gender
              ? GENDER_LABELS[affiliate.gender]
              : "—",
          },
          {
            label: "Estado Civil",
            value: affiliate.maritalStatus
              ? MARITAL_STATUS_LABELS[affiliate.maritalStatus]
              : "—",
          },
          { label: "Email", value: affiliate.email ?? "—" },
          { label: "Teléfono", value: affiliate.phone ?? "—" },
        ]}
      />

      {/* Section 2: Client & Portal Access */}
      <FieldSection
        title="Cliente y Acceso"
        columns={3}
        fields={[
          { label: "Cliente", value: affiliate.client.name },
          {
            label: "Acceso Portal",
            value: affiliate.hasPortalAccess ? "Sí" : "No",
          },
          {
            label: "Invitación Pendiente",
            value: affiliate.portalInvitationPending ? "Sí" : "No",
          },
        ]}
      />

      {/* Section 3: Dependents (for titulares only) */}
      {!isDependent && affiliate.dependentsCount > 0 && affiliate.dependents.length > 0 && (
        <section className="overflow-hidden rounded-lg border border-border bg-background">
          <header className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold tracking-[-0.01em] text-text">
              Dependientes ({affiliate.dependentsCount})
            </h3>
          </header>
          <DependentsList dependents={affiliate.dependents} />
        </section>
      )}

      {/* Section 4: Metadata */}
      <FieldSection
        title="Metadatos"
        columns={2}
        fields={[
          { label: "Fecha Creación", value: formatDate(affiliate.createdAt) },
          {
            label: "Última Actualización",
            value: formatDate(affiliate.updatedAt),
          },
        ]}
      />
    </div>
  );
}

// =============================================================================
// AffiliateDetailLayout
// =============================================================================

export function AffiliateDetailLayout({
  affiliate,
  onBack,
}: AffiliateDetailLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      <AffiliateDetailHeader affiliate={affiliate} onBack={onBack} />

      <div className="flex-1 overflow-y-auto p-6">
        <AffiliateMainTab affiliate={affiliate} />
      </div>
    </div>
  );
}

// =============================================================================
// AffiliateDetailView (Entry Point)
// =============================================================================

export interface AffiliateDetailViewProps {
  affiliateId: string;
}

export function AffiliateDetailView({ affiliateId }: AffiliateDetailViewProps) {
  const detail = useAffiliateDetail(affiliateId);

  if (detail.isLoading) {
    return <LoadingScreen />;
  }

  if (detail.isError || !detail.affiliate) {
    return <AffiliateDetailError error={detail.error} onBack={detail.navigateBack} />;
  }

  return (
    <AffiliateDetailLayout
      affiliate={detail.affiliate}
      onBack={detail.navigateBack}
    />
  );
}
