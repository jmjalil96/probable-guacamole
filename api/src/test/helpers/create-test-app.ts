import express, { type Express } from "express";
import { authRouter } from "../../features/auth/index.js";
import { errorHandler } from "../../middleware/error-handler.js";

/**
 * Creates a minimal Express app for testing auth routes.
 * Excludes rate limiting, helmet, cors and other middleware not relevant to auth tests.
 */
export function createTestApp(): Express {
  const app = express();

  app.use(express.json());

  // Health check for verifying app is running
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Mount auth routes
  app.use("/auth", authRouter);

  // Error handler must be last
  app.use(errorHandler);

  return app;
}
