import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { requestLogger } from "./middleware/request-logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { AppError } from "./lib/errors.js";
import { authRouter } from "./features/auth/index.js";
import { claimFilesRouter } from "./features/claims/files/index.js";
import { claimsRouter } from "./features/claims/index.js";
import { clientsRouter } from "./features/clients/index.js";
import { insurersRouter } from "./features/insurers/index.js";
import { invitationRouter } from "./features/invitation/index.js";

const app = express();

app.set("trust proxy", 1);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(AppError.tooManyRequests());
    },
  })
);

app.use(requestLogger);
app.use(cookieParser());
app.use(express.json({ limit: "100kb" }));

app.get("/", (_req, res) => {
  res.json({ message: "Hello from Express v5!" });
});

app.use("/auth", authRouter);
app.use("/auth/invitations", invitationRouter);
app.use("/claims", claimsRouter);
app.use("/claims/files", claimFilesRouter);
app.use("/clients", clientsRouter);
app.use("/insurers", insurersRouter);

app.use((req, _res, next) => {
  next(AppError.notFound(`${req.method} ${req.path}`));
});

// Error handler must be last
app.use(errorHandler);

export default app;
