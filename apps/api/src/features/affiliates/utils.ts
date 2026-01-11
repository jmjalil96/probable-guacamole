import type { AffiliateListItem, AffiliateDetail, AffiliateDependent } from "shared";
import type { findPrimaryAffiliates, findAffiliateById } from "./repository.js";

type AffiliateListData = Awaited<ReturnType<typeof findPrimaryAffiliates>>[number];
type AffiliateDetailData = NonNullable<Awaited<ReturnType<typeof findAffiliateById>>>;
type DependentData = AffiliateListData["dependents"][number];

function mapDependent(dep: DependentData): AffiliateDependent {
  return {
    id: dep.id,
    firstName: dep.firstName,
    lastName: dep.lastName,
    documentType: dep.documentType,
    documentNumber: dep.documentNumber,
    relationship: dep.relationship,
    isActive: dep.isActive,
  };
}

export function mapAffiliateToListItem(affiliate: AffiliateListData): AffiliateListItem {
  return {
    id: affiliate.id,
    firstName: affiliate.firstName,
    lastName: affiliate.lastName,
    documentType: affiliate.documentType,
    documentNumber: affiliate.documentNumber,
    email: affiliate.email,
    phone: affiliate.phone,
    dateOfBirth: affiliate.dateOfBirth?.toISOString() ?? null,
    gender: affiliate.gender,
    maritalStatus: affiliate.maritalStatus,
    isActive: affiliate.isActive,
    createdAt: affiliate.createdAt.toISOString(),
    updatedAt: affiliate.updatedAt.toISOString(),

    client: {
      id: affiliate.client.id,
      name: affiliate.client.name,
    },

    hasPortalAccess: affiliate.user !== null,
    portalInvitationPending:
      affiliate.invitation !== null && affiliate.invitation.acceptedAt === null,

    dependentsCount: affiliate._count.dependents,
    dependents: affiliate.dependents.map(mapDependent),
  };
}

export function mapAffiliateToDetail(affiliate: AffiliateDetailData): AffiliateDetail {
  return {
    ...mapAffiliateToListItem(affiliate),
    primaryAffiliate: affiliate.primaryAffiliate
      ? {
          id: affiliate.primaryAffiliate.id,
          name: `${affiliate.primaryAffiliate.firstName} ${affiliate.primaryAffiliate.lastName}`,
        }
      : null,
  };
}
