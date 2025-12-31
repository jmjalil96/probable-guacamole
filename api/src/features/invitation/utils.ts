import { randomBytes } from "node:crypto";
import { INVITATION_TOKEN_BYTES } from "./constants.js";

export function generateInvitationToken(): string {
  return randomBytes(INVITATION_TOKEN_BYTES).toString("hex");
}

// Re-export hashToken from auth utils for consistency
export { hashToken } from "../auth/utils.js";
