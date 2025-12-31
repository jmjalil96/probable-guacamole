import type { ScopeType } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        sessionId: string;
        role: {
          id: string;
          name: string;
          scopeType: ScopeType;
        };
      };
    }
  }
}

export {};
