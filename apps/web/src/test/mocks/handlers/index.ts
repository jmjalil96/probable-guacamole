import { authHandlers } from "./auth";
import { claimsHandlers } from "./claims";
import { insurersHandlers } from "./insurers";

export const handlers = [...authHandlers, ...claimsHandlers, ...insurersHandlers];
