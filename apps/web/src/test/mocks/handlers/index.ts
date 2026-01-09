import { authHandlers } from "./auth";
import { claimsHandlers } from "./claims";

export const handlers = [...authHandlers, ...claimsHandlers];
