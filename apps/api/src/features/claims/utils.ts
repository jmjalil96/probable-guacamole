import type { ClaimListItem, ClaimDetail } from "shared";
import type { findClaims, findClaimById } from "./repository.js";

type ClaimListData = Awaited<ReturnType<typeof findClaims>>[number];
type ClaimDetailData = NonNullable<Awaited<ReturnType<typeof findClaimById>>>;

function resolveUserName(
  user: ClaimListData["createdBy"] | ClaimListData["updatedBy"]
): string {
  const profile =
    user?.employee ?? user?.agent ?? user?.clientAdmin ?? user?.affiliate;
  return profile ? `${profile.firstName} ${profile.lastName}` : "Unknown";
}

export function mapClaimToListItem(claim: ClaimListData): ClaimListItem {
  return {
    id: claim.id,
    claimNumber: claim.claimNumber,
    status: claim.status,
    description: claim.description,
    careType: claim.careType,
    diagnosis: claim.diagnosis,
    amountSubmitted: claim.amountSubmitted?.toString() ?? null,
    amountApproved: claim.amountApproved?.toString() ?? null,
    amountDenied: claim.amountDenied?.toString() ?? null,
    amountUnprocessed: claim.amountUnprocessed?.toString() ?? null,
    deductibleApplied: claim.deductibleApplied?.toString() ?? null,
    copayApplied: claim.copayApplied?.toString() ?? null,
    incidentDate: claim.incidentDate?.toISOString() ?? null,
    submittedDate: claim.submittedDate?.toISOString() ?? null,
    settlementDate: claim.settlementDate?.toISOString() ?? null,
    businessDays: claim.businessDays,
    settlementNumber: claim.settlementNumber,
    settlementNotes: claim.settlementNotes,
    createdAt: claim.createdAt.toISOString(),
    updatedAt: claim.updatedAt.toISOString(),
    patient: {
      id: claim.patient.id,
      name: `${claim.patient.firstName} ${claim.patient.lastName}`,
    },
    affiliate: {
      id: claim.affiliate.id,
      name: `${claim.affiliate.firstName} ${claim.affiliate.lastName}`,
    },
    client: {
      id: claim.client.id,
      name: claim.client.name,
    },
    policy: claim.policy
      ? { id: claim.policy.id, number: claim.policy.policyNumber }
      : null,
    createdBy: {
      id: claim.createdBy.id,
      name: resolveUserName(claim.createdBy),
    },
    updatedBy: claim.updatedBy
      ? { id: claim.updatedBy.id, name: resolveUserName(claim.updatedBy) }
      : null,
  };
}

export function mapClaimToDetail(claim: ClaimDetailData): ClaimDetail {
  return {
    id: claim.id,
    claimNumber: claim.claimNumber,
    status: claim.status,
    description: claim.description,
    careType: claim.careType,
    diagnosis: claim.diagnosis,
    amountSubmitted: claim.amountSubmitted?.toString() ?? null,
    amountApproved: claim.amountApproved?.toString() ?? null,
    amountDenied: claim.amountDenied?.toString() ?? null,
    amountUnprocessed: claim.amountUnprocessed?.toString() ?? null,
    deductibleApplied: claim.deductibleApplied?.toString() ?? null,
    copayApplied: claim.copayApplied?.toString() ?? null,
    incidentDate: claim.incidentDate?.toISOString() ?? null,
    submittedDate: claim.submittedDate?.toISOString() ?? null,
    settlementDate: claim.settlementDate?.toISOString() ?? null,
    businessDays: claim.businessDays,
    settlementNumber: claim.settlementNumber,
    settlementNotes: claim.settlementNotes,
    createdAt: claim.createdAt.toISOString(),
    updatedAt: claim.updatedAt.toISOString(),
    patient: {
      id: claim.patient.id,
      name: `${claim.patient.firstName} ${claim.patient.lastName}`,
    },
    affiliate: {
      id: claim.affiliate.id,
      name: `${claim.affiliate.firstName} ${claim.affiliate.lastName}`,
    },
    client: {
      id: claim.client.id,
      name: claim.client.name,
    },
    policy: claim.policy
      ? { id: claim.policy.id, number: claim.policy.policyNumber }
      : null,
    createdBy: {
      id: claim.createdBy.id,
      name: resolveUserName(claim.createdBy),
    },
    updatedBy: claim.updatedBy
      ? { id: claim.updatedBy.id, name: resolveUserName(claim.updatedBy) }
      : null,
  };
}
