import type { ClientAdmin } from "shared";
import type { findClientAdmins } from "./repository.js";

type ClientAdminData = Awaited<ReturnType<typeof findClientAdmins>>[number];

export function mapClientAdminToResponse(clientAdmin: ClientAdminData): ClientAdmin {
  return {
    id: clientAdmin.id,
    firstName: clientAdmin.firstName,
    lastName: clientAdmin.lastName,
    email: clientAdmin.email,
    phone: clientAdmin.phone,
    jobTitle: clientAdmin.jobTitle,
    isActive: clientAdmin.isActive,
    hasAccount: clientAdmin.userId !== null,
    clientCount: clientAdmin._count.clients,
    createdAt: clientAdmin.createdAt.toISOString(),
    updatedAt: clientAdmin.updatedAt.toISOString(),
  };
}
