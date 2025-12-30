import { createWorker } from "./services/jobs/index.js";
import { verifySmtpConnection } from "./services/email/transport.js";
import { logger } from "./lib/logger.js";

let isShuttingDown = false;

const start = async () => {
  // Verify SMTP connection before accepting jobs
  try {
    await verifySmtpConnection();
    logger.info("SMTP connection verified");
  } catch (err) {
    logger.fatal({ err }, "SMTP connection failed - worker cannot start");
    process.exit(1);
  }

  const worker = createWorker();
  logger.info("worker started");

  return worker;
};

const worker = await start();

const shutdown = async (signal: string) => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  logger.info({ signal }, "shutdown signal received");

  const forceExit = setTimeout(() => {
    logger.error("forced shutdown - worker did not close in time");
    process.exit(1);
  }, 10_000).unref();

  let exitCode = 0;

  try {
    await worker.close();
    logger.info("worker closed");
  } catch (err) {
    exitCode = 1;
    logger.error({ err }, "error closing worker");
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
