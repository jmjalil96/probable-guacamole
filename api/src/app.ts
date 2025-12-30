import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { requestLogger } from "./middleware/request-logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { AppError } from "./lib/errors.js";

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
app.use(express.json({ limit: "100kb" }));

app.get("/", (_req, res) => {
  res.json({ message: "Hello from Express v5!" });
});

app.use((req, _res, next) => {
  next(AppError.notFound(`${req.method} ${req.path}`));
});

// Error handler must be last
app.use(errorHandler);

export default app;
