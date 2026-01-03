import type { ScopeType } from "@prisma/client";
import type {
  LookupClientsResponse,
  LookupAffiliatesResponse,
  LookupPatientsResponse,
  LookupPoliciesResponse,
  ClientLookupItem,
  AffiliateLookupItem,
  PatientLookupItem,
  PolicyLookupItem,
} from "shared";
import { logger } from "../../../lib/logger.js";
import { AppError } from "../../../lib/errors.js";
import { resolveUserScope, type ScopeFilter } from "../../../lib/scope.js";
import * as repo from "./repository.js";

// =============================================================================
// Types
// =============================================================================

interface UserContext {
  id: string;
  role: { scopeType: ScopeType };
}

export interface LookupClientsParams {
  user: UserContext;
  requestId?: string;
}

export interface LookupAffiliatesParams {
  clientId: string;
  user: UserContext;
  requestId?: string;
}

export interface LookupPatientsParams {
  affiliateId: string;
  user: UserContext;
  requestId?: string;
}

export interface LookupPoliciesParams {
  clientId: string;
  user: UserContext;
  requestId?: string;
}

// =============================================================================
// Scope Validation Helpers
// =============================================================================

function validateClientAccess(scope: ScopeFilter, clientId: string): void {
  switch (scope.type) {
    case "unlimited":
      return;
    case "client":
      if (!scope.clientIds.includes(clientId)) {
        throw AppError.forbidden("Access denied to this client");
      }
      return;
    case "self":
      // Will be validated when we check if affiliate belongs to client
      return;
  }
}

function validateAffiliateAccess(
  scope: ScopeFilter,
  affiliateId: string
): void {
  if (scope.type === "self" && scope.affiliateId !== affiliateId) {
    throw AppError.forbidden("Access denied to this affiliate");
  }
}

// =============================================================================
// Mappers
// =============================================================================

function mapClient(client: { id: string; name: string }): ClientLookupItem {
  return { id: client.id, name: client.name };
}

function mapAffiliate(affiliate: {
  id: string;
  firstName: string;
  lastName: string;
}): AffiliateLookupItem {
  return {
    id: affiliate.id,
    firstName: affiliate.firstName,
    lastName: affiliate.lastName,
    name: `${affiliate.firstName} ${affiliate.lastName}`,
  };
}

function mapPatient(
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    relationship: string | null;
    primaryAffiliateId: string | null;
  },
  primaryAffiliateId: string
): PatientLookupItem {
  const isSelf =
    patient.id === primaryAffiliateId || patient.primaryAffiliateId === null;
  return {
    id: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    name: `${patient.firstName} ${patient.lastName}`,
    relationship: isSelf
      ? "SELF"
      : (patient.relationship as PatientLookupItem["relationship"]),
  };
}

function mapPolicy(policy: {
  id: string;
  policyNumber: string;
  status: string;
  insurer: { name: string };
}): PolicyLookupItem {
  return {
    id: policy.id,
    policyNumber: policy.policyNumber,
    insurerName: policy.insurer.name,
    status: policy.status,
  };
}

// =============================================================================
// Lookup Clients
// =============================================================================

export async function lookupClients(
  params: LookupClientsParams
): Promise<LookupClientsResponse> {
  const { user, requestId } = params;
  const log = logger.child({ module: "claims/lookups", requestId });

  log.debug({ userId: user.id }, "lookup clients started");

  const scope = await resolveUserScope(user.id, user.role.scopeType);

  let clients: Array<{ id: string; name: string }>;

  switch (scope.type) {
    case "unlimited":
      clients = await repo.findAllClients();
      break;
    case "client":
      clients = await repo.findClientsByIds(scope.clientIds);
      break;
    case "self": {
      // SELF scope: find the client that the user's affiliate belongs to
      if (!scope.affiliateId) {
        clients = [];
        break;
      }
      const affiliate = await repo.findAffiliateById(scope.affiliateId);
      if (!affiliate) {
        clients = [];
        break;
      }
      const client = await repo.findClientById(affiliate.clientId);
      clients = client ? [client] : [];
      break;
    }
  }

  log.debug({ count: clients.length }, "lookup clients completed");

  return { data: clients.map(mapClient) };
}

// =============================================================================
// Lookup Affiliates
// =============================================================================

export async function lookupAffiliates(
  params: LookupAffiliatesParams
): Promise<LookupAffiliatesResponse> {
  const { clientId, user, requestId } = params;
  const log = logger.child({ module: "claims/lookups", requestId });

  log.debug({ userId: user.id, clientId }, "lookup affiliates started");

  const scope = await resolveUserScope(user.id, user.role.scopeType);

  // Validate client access
  validateClientAccess(scope, clientId);

  // For SELF scope, only return the user's own affiliate if it matches the client
  if (scope.type === "self") {
    if (!scope.affiliateId) {
      log.debug(
        { clientId },
        "lookup affiliates completed (self scope, no affiliate)"
      );
      return { data: [] };
    }

    const affiliate = await repo.findAffiliateById(scope.affiliateId);
    if (!affiliate || affiliate.clientId !== clientId) {
      log.debug(
        { clientId },
        "lookup affiliates completed (self scope, affiliate not in client)"
      );
      return { data: [] };
    }

    log.debug({ count: 1 }, "lookup affiliates completed");
    return { data: [mapAffiliate(affiliate)] };
  }

  // For UNLIMITED and CLIENT scopes, return all affiliates for the client
  const affiliates = await repo.findAffiliatesByClientId(clientId);

  log.debug({ count: affiliates.length }, "lookup affiliates completed");

  return { data: affiliates.map(mapAffiliate) };
}

// =============================================================================
// Lookup Patients
// =============================================================================

export async function lookupPatients(
  params: LookupPatientsParams
): Promise<LookupPatientsResponse> {
  const { affiliateId, user, requestId } = params;
  const log = logger.child({ module: "claims/lookups", requestId });

  log.debug({ userId: user.id, affiliateId }, "lookup patients started");

  // 1. Fetch the affiliate to get clientId
  const affiliate = await repo.findAffiliateById(affiliateId);
  if (!affiliate) {
    log.debug({ affiliateId }, "affiliate not found");
    throw AppError.notFound("Affiliate");
  }

  // 2. Resolve scope and validate access
  const scope = await resolveUserScope(user.id, user.role.scopeType);

  // Validate client access
  validateClientAccess(scope, affiliate.clientId);

  // Validate affiliate access for SELF scope
  validateAffiliateAccess(scope, affiliateId);

  // 3. Fetch affiliate + their dependents
  const patients = await repo.findPatientsByAffiliateId(affiliateId);

  log.debug({ count: patients.length }, "lookup patients completed");

  return {
    data: patients.map((p) => mapPatient(p, affiliateId)),
  };
}

// =============================================================================
// Lookup Policies (UNLIMITED scope only - enforced by middleware)
// =============================================================================

export async function lookupPolicies(
  params: LookupPoliciesParams
): Promise<LookupPoliciesResponse> {
  const { clientId, user, requestId } = params;
  const log = logger.child({ module: "claims/lookups", requestId });

  log.debug({ userId: user.id, clientId }, "lookup policies started");

  // Note: UNLIMITED scope is enforced by requireScope middleware in routes
  // No additional scope validation needed here

  const policies = await repo.findPoliciesByClientId(clientId);

  log.debug({ count: policies.length }, "lookup policies completed");

  return { data: policies.map(mapPolicy) };
}
