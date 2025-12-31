import type { CreateInvitationRequest } from "shared";
import { AppError } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import * as audit from "../../services/audit/audit.js";
import { enqueue } from "../../services/jobs/index.js";
import { hashPassword } from "../auth/utils.js";
import { SESSION_EXPIRY_DAYS } from "../auth/constants.js";
import { INVITATION_EXPIRY_DAYS } from "./constants.js";
import { generateInvitationToken, hashToken } from "./utils.js";
import { generateSessionToken } from "../auth/utils.js";
import * as repo from "./repository.js";
import type { ProfileInfo, ProfileRecord } from "./repository.js";

// =============================================================================
// Types
// =============================================================================

export interface CreateInvitationParams {
  request: CreateInvitationRequest;
  createdById: string;
  requestId?: string;
}

export interface CreateInvitationResult {
  invitationId: string;
  expiresAt: Date;
}

export interface ValidateInvitationResult {
  expiresAt: Date;
  role: { displayName: string };
}

export interface AcceptInvitationParams {
  token: string;
  password: string;
  ip: string | null;
  userAgent: string | null;
  requestId?: string;
}

export interface AcceptInvitationResult {
  sessionToken: string;
  expiresAt: Date;
}

export interface ResendInvitationParams {
  invitationId: string;
  requestId?: string;
}

export interface ResendInvitationResult {
  invitationId: string;
  expiresAt: Date;
}

// =============================================================================
// Helpers
// =============================================================================

function resolveProfileInfo(request: CreateInvitationRequest): ProfileInfo {
  if (request.employeeId) {
    return { type: "employee", id: request.employeeId, idField: "employeeId" };
  }
  if (request.agentId) {
    return { type: "agent", id: request.agentId, idField: "agentId" };
  }
  if (request.clientAdminId) {
    return {
      type: "clientAdmin",
      id: request.clientAdminId,
      idField: "clientAdminId",
    };
  }
  if (request.affiliateId) {
    return {
      type: "affiliate",
      id: request.affiliateId,
      idField: "affiliateId",
    };
  }

  // Schema validation should prevent this, but TypeScript needs it
  throw AppError.badRequest("Exactly one profile ID must be provided");
}

async function fetchProfile(
  profileInfo: ProfileInfo
): Promise<ProfileRecord | null> {
  switch (profileInfo.type) {
    case "employee":
      return repo.findEmployeeById(profileInfo.id);
    case "agent":
      return repo.findAgentById(profileInfo.id);
    case "clientAdmin":
      return repo.findClientAdminById(profileInfo.id);
    case "affiliate":
      return repo.findAffiliateById(profileInfo.id);
  }
}

function resolveInvitationEmail(
  request: CreateInvitationRequest,
  profile: ProfileRecord,
  profileInfo: ProfileInfo
): string {
  // Affiliates can have email override
  if (profileInfo.type === "affiliate") {
    const email = request.email ?? profile.email;
    if (!email) {
      throw AppError.badRequest(
        "Email is required for affiliates without a profile email"
      );
    }
    return email.toLowerCase();
  }

  // Non-affiliates must use profile email
  if (!profile.email) {
    throw AppError.badRequest("Profile does not have an email address");
  }

  // If email provided, must match profile email (case-insensitive)
  if (request.email && request.email.toLowerCase() !== profile.email.toLowerCase()) {
    throw AppError.badRequest("Email does not match profile email");
  }

  return profile.email.toLowerCase();
}

function getProfileIdFromInvitation(
  invitation: NonNullable<Awaited<ReturnType<typeof repo.findInvitationByTokenHash>>>
): ProfileInfo {
  if (invitation.employeeId) {
    return {
      type: "employee",
      id: invitation.employeeId,
      idField: "employeeId",
    };
  }
  if (invitation.agentId) {
    return { type: "agent", id: invitation.agentId, idField: "agentId" };
  }
  if (invitation.clientAdminId) {
    return {
      type: "clientAdmin",
      id: invitation.clientAdminId,
      idField: "clientAdminId",
    };
  }
  if (invitation.affiliateId) {
    return {
      type: "affiliate",
      id: invitation.affiliateId,
      idField: "affiliateId",
    };
  }

  throw new Error("Invitation has no profile ID - data integrity issue");
}

// =============================================================================
// Service Functions
// =============================================================================

export async function createInvitation(
  params: CreateInvitationParams,
  context: audit.AuditContext
): Promise<CreateInvitationResult> {
  const { request, createdById, requestId } = params;
  const log = logger.child({ module: "invitation", requestId });

  log.debug({ roleId: request.roleId }, "create invitation started");

  // 1. Validate role exists
  const role = await repo.findRoleById(request.roleId);
  if (!role) {
    log.debug({ roleId: request.roleId }, "role not found");
    throw AppError.notFound("Role");
  }

  // 2. Resolve profile info
  const profileInfo = resolveProfileInfo(request);
  log.debug(
    { profileType: profileInfo.type, profileId: profileInfo.id },
    "resolved profile info"
  );

  // 3. Fetch profile
  const profile = await fetchProfile(profileInfo);
  if (!profile) {
    log.debug({ profileInfo }, "profile not found");
    throw AppError.notFound("Profile");
  }

  // 4. Check profile is active
  if (!profile.isActive) {
    log.debug({ profileId: profile.id }, "profile is inactive");
    throw AppError.badRequest("Profile is inactive");
  }

  // 5. Check profile not already linked to a user
  if (profile.userId !== null) {
    log.debug({ profileId: profile.id }, "profile already has user account");
    throw AppError.conflict("Profile already has a user account");
  }

  // 6. Resolve and validate email
  const email = resolveInvitationEmail(request, profile, profileInfo);
  log.debug({ email }, "resolved invitation email");

  // 7. Check email not in use
  const existingUser = await repo.findUserByEmail(email);
  if (existingUser) {
    log.debug({ email }, "email already in use");
    throw AppError.conflict("Email already in use");
  }

  // 8. Generate token and hash
  const token = generateInvitationToken();
  const tokenHash = hashToken(token);

  // 9. Calculate expiration
  const expiresAt = new Date(
    Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  // 10. Upsert invitation
  const invitation = await repo.upsertInvitation({
    tokenHash,
    email,
    roleId: role.id,
    expiresAt,
    createdById,
    profileInfo,
  });

  log.info(
    { invitationId: invitation.id, profileType: profileInfo.type },
    "invitation created"
  );

  // 11. Enqueue email (fire-and-forget)
  enqueue("email:invitation", {
    to: email,
    token,
    roleName: role.displayName,
    expiresAt: expiresAt.toISOString(),
  }).catch((err) => {
    log.error({ err, invitationId: invitation.id }, "failed to queue invitation email");
  });

  // 12. Audit log
  audit.log(
    {
      action: audit.AuditActions.INVITATION_SENT,
      resource: "Invitation",
      resourceId: invitation.id,
      metadata: {
        profileType: profileInfo.type,
        profileId: profileInfo.id,
        roleId: role.id,
        email,
        resent: false,
      },
    },
    context
  );

  return { invitationId: invitation.id, expiresAt };
}

export async function validateInvitation(
  token: string
): Promise<ValidateInvitationResult> {
  const log = logger.child({ module: "invitation" });

  // 1. Hash token
  const tokenHash = hashToken(token);

  // 2. Find invitation
  const invitation = await repo.findInvitationByTokenHash(tokenHash);

  // Use same 404 for all failure cases to prevent enumeration
  if (!invitation) {
    log.debug("invitation not found");
    throw AppError.notFound("Invalid or expired invitation", {
      code: "INVITATION_NOT_FOUND",
    });
  }

  // 3. Check not accepted
  if (invitation.acceptedAt !== null) {
    log.debug({ invitationId: invitation.id }, "invitation already accepted");
    throw AppError.notFound("Invalid or expired invitation", {
      code: "INVITATION_NOT_FOUND",
    });
  }

  // 4. Check not expired
  if (invitation.expiresAt < new Date()) {
    log.debug({ invitationId: invitation.id }, "invitation expired");
    throw AppError.notFound("Invalid or expired invitation", {
      code: "INVITATION_NOT_FOUND",
    });
  }

  log.debug({ invitationId: invitation.id }, "invitation validated");

  return {
    expiresAt: invitation.expiresAt,
    role: { displayName: invitation.role.displayName },
  };
}

export async function acceptInvitation(
  params: AcceptInvitationParams,
  context: audit.AuditContext
): Promise<AcceptInvitationResult> {
  const { token, password, ip, userAgent, requestId } = params;
  const log = logger.child({ module: "invitation", requestId });

  log.debug("accept invitation started");

  // 1. Hash token and find invitation
  const tokenHash = hashToken(token);
  const invitation = await repo.findInvitationByTokenHash(tokenHash);

  if (!invitation) {
    log.debug("invitation not found");
    throw AppError.notFound("Invalid or expired invitation", {
      code: "INVITATION_NOT_FOUND",
    });
  }

  if (invitation.acceptedAt !== null) {
    log.debug({ invitationId: invitation.id }, "invitation already accepted");
    throw AppError.notFound("Invalid or expired invitation", {
      code: "INVITATION_NOT_FOUND",
    });
  }

  if (invitation.expiresAt < new Date()) {
    log.debug({ invitationId: invitation.id }, "invitation expired");
    throw AppError.notFound("Invalid or expired invitation", {
      code: "INVITATION_NOT_FOUND",
    });
  }

  // 2. Check email not in use (race condition check)
  const existingUser = await repo.findUserByEmail(invitation.email);
  if (existingUser) {
    log.debug({ email: invitation.email }, "email already in use");
    throw AppError.conflict("Email already in use");
  }

  // 3. Get profile info and validate profile state
  const profileInfo = getProfileIdFromInvitation(invitation);
  const profile = await fetchProfile(profileInfo);

  if (!profile) {
    log.debug({ profileInfo }, "profile not found");
    throw AppError.notFound("Profile");
  }

  if (!profile.isActive) {
    log.debug({ profileInfo }, "profile is no longer active");
    throw AppError.badRequest("Profile is no longer active");
  }

  if (profile.userId !== null) {
    log.debug({ profileInfo }, "profile already linked");
    throw AppError.conflict("Profile already has a user account");
  }

  // 4. Hash password
  const passwordHash = await hashPassword(password);

  // 5. Generate session token
  const sessionToken = generateSessionToken();
  const sessionTokenHash = hashToken(sessionToken);
  const sessionExpiresAt = new Date(
    Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  // 6. Execute transaction
  const { user } = await repo.db.$transaction(async (tx) => {
    // Mark invitation accepted (conditional)
    const acceptedInvitation = await repo.markInvitationAccepted(
      tx,
      invitation.id
    );
    if (!acceptedInvitation) {
      throw AppError.notFound("Invalid or expired invitation", {
        code: "INVITATION_NOT_FOUND",
      });
    }

    // Create user
    const newUser = await repo.createUser(tx, {
      email: invitation.email,
      passwordHash,
      roleId: invitation.roleId,
    });

    // Link profile (conditional)
    const linkedProfile = await repo.linkProfileToUser(
      tx,
      profileInfo,
      newUser.id
    );
    if (!linkedProfile) {
      throw AppError.conflict("Profile already has a user account");
    }

    // Create session
    const newSession = await repo.createSession(tx, {
      userId: newUser.id,
      tokenHash: sessionTokenHash,
      expiresAt: sessionExpiresAt,
      ipAddress: ip,
      userAgent,
    });

    // Audit within transaction
    await audit.logInTransaction(
      tx,
      {
        action: audit.AuditActions.INVITATION_ACCEPTED,
        resource: "Invitation",
        resourceId: invitation.id,
        metadata: {
          userId: newUser.id,
          profileType: profileInfo.type,
          profileId: profileInfo.id,
          roleId: invitation.roleId,
        },
      },
      { ...context, userId: newUser.id, sessionId: newSession.id }
    );

    return { user: newUser, session: newSession };
  });

  log.info(
    { userId: user.id, invitationId: invitation.id },
    "invitation accepted"
  );

  return { sessionToken, expiresAt: sessionExpiresAt };
}

export async function resendInvitation(
  params: ResendInvitationParams,
  context: audit.AuditContext
): Promise<ResendInvitationResult> {
  const { invitationId, requestId } = params;
  const log = logger.child({ module: "invitation", requestId });

  log.debug({ invitationId }, "resend invitation started");

  // 1. Find invitation
  const invitation = await repo.findInvitationById(invitationId);
  if (!invitation) {
    log.debug({ invitationId }, "invitation not found");
    throw AppError.notFound("Invitation");
  }

  // 2. Check not accepted
  if (invitation.acceptedAt !== null) {
    log.debug({ invitationId }, "invitation already accepted");
    throw AppError.conflict("Invitation already accepted");
  }

  // 3. Generate new token
  const token = generateInvitationToken();
  const tokenHash = hashToken(token);

  // 4. Calculate new expiration
  const expiresAt = new Date(
    Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  // 5. Update invitation (conditional for race safety)
  const updated = await repo.regenerateInvitationToken(
    invitationId,
    tokenHash,
    expiresAt
  );

  if (!updated) {
    log.debug({ invitationId }, "invitation was accepted during resend");
    throw AppError.conflict("Invitation already accepted");
  }

  log.info({ invitationId }, "invitation token regenerated");

  // 6. Enqueue email (fire-and-forget)
  enqueue("email:invitation", {
    to: updated.email,
    token,
    roleName: invitation.role.displayName,
    expiresAt: expiresAt.toISOString(),
  }).catch((err) => {
    log.error({ err, invitationId }, "failed to queue invitation email");
  });

  // 7. Audit log
  audit.log(
    {
      action: audit.AuditActions.INVITATION_SENT,
      resource: "Invitation",
      resourceId: invitationId,
      metadata: {
        email: updated.email,
        roleId: updated.roleId,
        resent: true,
      },
    },
    context
  );

  return { invitationId, expiresAt };
}
