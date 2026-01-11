import type { UserListItem, UserType } from "shared";
import type {
  findEmployees,
  findAgents,
  findClientAdmins,
  findAffiliates,
} from "./repository.js";

// =============================================================================
// Types
// =============================================================================

type EmployeeData = Awaited<ReturnType<typeof findEmployees>>[number];
type AgentData = Awaited<ReturnType<typeof findAgents>>[number];
type ClientAdminData = Awaited<ReturnType<typeof findClientAdmins>>[number];
type AffiliateData = Awaited<ReturnType<typeof findAffiliates>>[number];

// =============================================================================
// Mapping Functions
// =============================================================================

export function mapEmployeeToUserListItem(employee: EmployeeData): UserListItem {
  return {
    id: employee.id,
    type: "employee" as UserType,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone,
    isActive: employee.isActive,
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
    hasAccount: employee.user !== null,
    hasPendingInvitation:
      employee.invitation !== null && employee.invitation.acceptedAt === null,
    accountIsActive: employee.user?.isActive ?? null,
    department: employee.department,
  };
}

export function mapAgentToUserListItem(agent: AgentData): UserListItem {
  return {
    id: agent.id,
    type: "agent" as UserType,
    firstName: agent.firstName,
    lastName: agent.lastName,
    email: agent.email,
    phone: agent.phone,
    isActive: agent.isActive,
    createdAt: agent.createdAt.toISOString(),
    updatedAt: agent.updatedAt.toISOString(),
    hasAccount: agent.user !== null,
    hasPendingInvitation:
      agent.invitation !== null && agent.invitation.acceptedAt === null,
    accountIsActive: agent.user?.isActive ?? null,
    licenseNumber: agent.licenseNumber,
    agencyName: agent.agencyName,
    clients: agent.clients.map((ac) => ({ id: ac.client.id, name: ac.client.name })),
  };
}

export function mapClientAdminToUserListItem(admin: ClientAdminData): UserListItem {
  return {
    id: admin.id,
    type: "client_admin" as UserType,
    firstName: admin.firstName,
    lastName: admin.lastName,
    email: admin.email,
    phone: admin.phone,
    isActive: admin.isActive,
    createdAt: admin.createdAt.toISOString(),
    updatedAt: admin.updatedAt.toISOString(),
    hasAccount: admin.user !== null,
    hasPendingInvitation:
      admin.invitation !== null && admin.invitation.acceptedAt === null,
    accountIsActive: admin.user?.isActive ?? null,
    jobTitle: admin.jobTitle,
    clients: admin.clients.map((cac) => ({ id: cac.client.id, name: cac.client.name })),
  };
}

export function mapAffiliateToUserListItem(affiliate: AffiliateData): UserListItem {
  return {
    id: affiliate.id,
    type: "affiliate" as UserType,
    firstName: affiliate.firstName,
    lastName: affiliate.lastName,
    email: affiliate.email,
    phone: affiliate.phone,
    isActive: affiliate.isActive,
    createdAt: affiliate.createdAt.toISOString(),
    updatedAt: affiliate.updatedAt.toISOString(),
    hasAccount: affiliate.user !== null,
    hasPendingInvitation:
      affiliate.invitation !== null && affiliate.invitation.acceptedAt === null,
    accountIsActive: affiliate.user?.isActive ?? null,
    documentType: affiliate.documentType,
    documentNumber: affiliate.documentNumber,
    client: affiliate.client
      ? { id: affiliate.client.id, name: affiliate.client.name }
      : null,
  };
}
