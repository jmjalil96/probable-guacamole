import { authHandlers } from "./auth";
import { claimsHandlers } from "./claims";
import { insurersHandlers } from "./insurers";
import { employeesHandlers } from "./employees";
import { agentsHandlers } from "./agents";
import { clientAdminsHandlers } from "./client-admins";

export const handlers = [
  ...authHandlers,
  ...claimsHandlers,
  ...insurersHandlers,
  ...employeesHandlers,
  ...agentsHandlers,
  ...clientAdminsHandlers,
];
