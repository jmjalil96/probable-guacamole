import type { Insurer } from "shared";
import type { findInsurers } from "./repository.js";

type InsurerData = Awaited<ReturnType<typeof findInsurers>>[number];

export function mapInsurerToResponse(insurer: InsurerData): Insurer {
  return {
    id: insurer.id,
    name: insurer.name,
    code: insurer.code,
    email: insurer.email,
    phone: insurer.phone,
    website: insurer.website,
    type: insurer.type,
    isActive: insurer.isActive,
    createdAt: insurer.createdAt.toISOString(),
    updatedAt: insurer.updatedAt.toISOString(),
  };
}
