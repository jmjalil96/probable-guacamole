import { env } from "./config/env.js";
import { db } from "./config/db.js";
import app from "./app.js";
import { logger } from "./lib/logger.js";

const start = () => {
  // Start HTTP server
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "server started");
  });

  return server;
};

const server = start();

let isShuttingDown = false;

const shutdown = async (signal: string) => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  logger.info({ signal }, "shutdown signal received");

  const forceExit = setTimeout(() => {
    logger.error("forced shutdown - connections did not close in time");
    process.exit(1);
  }, 10_000).unref();

  let exitCode = 0;

  try {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    logger.info("http server closed");
  } catch (err) {
    exitCode = 1;
    logger.error({ err }, "error closing http server");
  }

  try {
    await db.$disconnect();
    logger.info("database connection closed");
  } catch (err) {
    exitCode = 1;
    logger.error({ err }, "error disconnecting database");
  }

  clearTimeout(forceExit);
  process.exit(exitCode);
};

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "unhandled rejection");
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaught exception");
  process.exit(1);
});
