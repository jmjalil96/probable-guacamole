import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import { authRouter } from "../../features/auth/index.js";
import { claimsRouter } from "../../features/claims/index.js";
import { insurersRouter } from "../../features/insurers/index.js";
import { invitationRouter } from "../../features/invitation/index.js";
import { errorHandler } from "../../middleware/error-handler.js";

/**
 * Creates a minimal Express app for testing auth routes.
 * Excludes rate limiting, helmet, cors and other middleware not relevant to auth tests.
 */
export function createTestApp(): Express {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  // Health check for verifying app is running
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Mount auth routes
  app.use("/auth", authRouter);
  app.use("/auth/invitations", invitationRouter);

  // Mount feature routes
  app.use("/claims", claimsRouter);
  app.use("/insurers", insurersRouter);

  // Error handler must be last
  app.use(errorHandler);

  return app;
}
