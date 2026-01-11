import type { ListUsersQuery, ListUsersResponse, UserListItem } from "shared";
import { logger } from "../../lib/logger.js";
import * as repo from "./repository.js";
import {
  mapEmployeeToUserListItem,
  mapAgentToUserListItem,
  mapClientAdminToUserListItem,
  mapAffiliateToUserListItem,
} from "./utils.js";

// =============================================================================
// Types
// =============================================================================

export interface ListUsersParams {
  query: ListUsersQuery;
  user: { id: string };
  requestId?: string;
}

// =============================================================================
// List Users
// =============================================================================

export async function listUsers(params: ListUsersParams): Promise<ListUsersResponse> {
  const { query, user, requestId } = params;
  const log = logger.child({ module: "users", requestId });

  log.debug({ userId: user.id, query }, "list users started");

  const { page, limit, sortBy, sortOrder, search, type, isActive, hasAccount, clientId } =
    query;

  const whereParams: repo.FindProfilesParams = {
    where: {
      ...(search !== undefined && { search }),
      ...(isActive !== undefined && { isActive }),
      ...(hasAccount !== undefined && { hasAccount }),
      ...(clientId !== undefined && { clientId }),
    },
  };

  let allUsers: UserListItem[] = [];
  let total = 0;

  // If type filter provided, query only that table
  if (type === "employee") {
    const [employees, count] = await Promise.all([
      repo.findEmployees(whereParams),
      repo.countEmployees(whereParams),
    ]);
    allUsers = employees.map(mapEmployeeToUserListItem);
    total = count;
  } else if (type === "agent") {
    const [agents, count] = await Promise.all([
      repo.findAgents(whereParams),
      repo.countAgents(whereParams),
    ]);
    allUsers = agents.map(mapAgentToUserListItem);
    total = count;
  } else if (type === "client_admin") {
    const [admins, count] = await Promise.all([
      repo.findClientAdmins(whereParams),
      repo.countClientAdmins(whereParams),
    ]);
    allUsers = admins.map(mapClientAdminToUserListItem);
    total = count;
  } else if (type === "affiliate") {
    const [affiliates, count] = await Promise.all([
      repo.findAffiliates(whereParams),
      repo.countAffiliates(whereParams),
    ]);
    allUsers = affiliates.map(mapAffiliateToUserListItem);
    total = count;
  } else {
    // No type filter - query all tables in parallel
    // Skip employees if filtering by clientId (employees don't have clients)
    const skipEmployees = !!clientId;

    const [employees, agents, admins, affiliates] = await Promise.all([
      skipEmployees ? Promise.resolve([]) : repo.findEmployees(whereParams),
      repo.findAgents(whereParams),
      repo.findClientAdmins(whereParams),
      repo.findAffiliates(whereParams),
    ]);

    const [empCount, agentCount, adminCount, affCount] = await Promise.all([
      skipEmployees ? Promise.resolve(0) : repo.countEmployees(whereParams),
      repo.countAgents(whereParams),
      repo.countClientAdmins(whereParams),
      repo.countAffiliates(whereParams),
    ]);

    allUsers = [
      ...employees.map(mapEmployeeToUserListItem),
      ...agents.map(mapAgentToUserListItem),
      ...admins.map(mapClientAdminToUserListItem),
      ...affiliates.map(mapAffiliateToUserListItem),
    ];
    total = empCount + agentCount + adminCount + affCount;
  }

  // Sort in memory
  allUsers.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "name":
        comparison = `${a.lastName} ${a.firstName}`.localeCompare(
          `${b.lastName} ${b.firstName}`
        );
        break;
      case "email":
        comparison = (a.email ?? "").localeCompare(b.email ?? "");
        break;
      case "type":
        comparison = a.type.localeCompare(b.type);
        break;
      case "createdAt":
        comparison = a.createdAt.localeCompare(b.createdAt);
        break;
    }
    return sortOrder === "desc" ? -comparison : comparison;
  });

  // Paginate in memory
  const skip = (page - 1) * limit;
  const paginatedUsers = allUsers.slice(skip, skip + limit);
  const totalPages = Math.ceil(total / limit);

  log.debug({ count: paginatedUsers.length, total }, "list users completed");

  return {
    data: paginatedUsers,
    pagination: { page, limit, total, totalPages },
  };
}
