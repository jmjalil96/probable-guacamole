import type { Prisma, ScopeType } from "@prisma/client";
import { db } from "../config/db.js";
import { AppError } from "./errors.js";

// =============================================================================
// Types
// =============================================================================

export type ScopeFilter =
  | { type: "unlimited" }
  | { type: "client"; clientIds: string[] }
  | { type: "self"; affiliateId: string | null };

// =============================================================================
// Scope Resolution
// =============================================================================

export async function resolveUserScope(
  userId: string,
  scopeType: ScopeType
): Promise<ScopeFilter> {
  switch (scopeType) {
    case "UNLIMITED":
      return { type: "unlimited" };

    case "CLIENT": {
      // Try agent first
      const agent = await db.agent.findUnique({
        where: { userId },
        select: { clients: { select: { clientId: true } } },
      });
      if (agent) {
        return { type: "client", clientIds: agent.clients.map((c) => c.clientId) };
      }

      // Try client admin
      const clientAdmin = await db.clientAdmin.findUnique({
        where: { userId },
        select: { clients: { select: { clientId: true } } },
      });
      if (clientAdmin) {
        return { type: "client", clientIds: clientAdmin.clients.map((c) => c.clientId) };
      }

      return { type: "client", clientIds: [] };
    }

    case "SELF": {
      const affiliate = await db.affiliate.findUnique({
        where: { userId },
        select: { id: true },
      });
      return { type: "self", affiliateId: affiliate?.id ?? null };
    }
  }
}

// =============================================================================
// Scope to Where Clause Converters
// =============================================================================

export function scopeToClaimWhere(scope: ScopeFilter): Prisma.ClaimWhereInput {
  switch (scope.type) {
    case "unlimited":
      return {};
    case "client":
      return { clientId: { in: scope.clientIds } };
    case "self":
      return scope.affiliateId
        ? { affiliateId: scope.affiliateId }
        : { affiliateId: { in: [] } };
  }
}

export function scopeToAffiliateWhere(scope: ScopeFilter): Prisma.AffiliateWhereInput {
  switch (scope.type) {
    case "unlimited":
      return {};
    case "client":
      return { clientId: { in: scope.clientIds } };
    case "self":
      // SELF scope: see own affiliate + dependents where they are the primary
      return scope.affiliateId
        ? {
            OR: [
              { id: scope.affiliateId },
              { primaryAffiliateId: scope.affiliateId },
            ],
          }
        : { id: { in: [] } }; // No access if no affiliate
  }
}

// =============================================================================
// Scope Validation for Create Operations
// =============================================================================

export interface ScopeCreateValidationOptions {
  clientId: string;
  affiliateId: string;
}

/**
 * Validates that a user's scope allows creating a resource for the given client/affiliate.
 * - UNLIMITED: any client, any affiliate
 * - CLIENT: clientId must be in user's assigned clients
 * - SELF: affiliateId must equal user's own affiliate ID
 *
 * @throws AppError.forbidden if access denied
 */
export function validateScopeForCreate(
  scope: ScopeFilter,
  options: ScopeCreateValidationOptions
): void {
  switch (scope.type) {
    case "unlimited":
      return;
    case "client":
      if (!scope.clientIds.includes(options.clientId)) {
        throw AppError.forbidden("Access denied to this client");
      }
      return;
    case "self":
      if (scope.affiliateId !== options.affiliateId) {
        throw AppError.forbidden("You can only create claims for yourself");
      }
      return;
  }
}
