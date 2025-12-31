import { Queue, Worker, type Processor } from "bullmq";
import { connectionOptions } from "./connection.js";
import { handleEmailJob } from "./handlers/email.js";
import type { JobData, JobType } from "./types.js";
import { createJobLogger, logger } from "../../lib/logger.js";
import { normalizeError } from "../../lib/normalize-error.js";

const queueName = "jobs";

export const queue = new Queue<JobData, void, JobType>(queueName, {
  connection: connectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: {
      age: 60 * 60 * 24,
    },
    removeOnFail: {
      age: 60 * 60 * 24 * 7,
    },
  },
});

const processor: Processor<JobData, void, JobType> = async (job) => {
  if (job.name.startsWith("email:")) {
    await handleEmailJob(job);
    return;
  }

  throw new Error(`Unknown job type: ${job.name}`);
};

export const createWorker = () => {
  const worker = new Worker<JobData, void, JobType>(queueName, processor, {
    connection: connectionOptions,
    concurrency: 5,
  });

  worker.on("active", (job) => {
    const jobLogger = createJobLogger(job.id ?? "unknown", job.name);
    jobLogger.info({ attempt: job.attemptsMade }, "job started");
  });

  worker.on("completed", (job) => {
    const jobLogger = createJobLogger(job.id ?? "unknown", job.name);
    const durationMs =
      job.processedOn != null && job.finishedOn != null
        ? job.finishedOn - job.processedOn
        : undefined;
    jobLogger.info(
      { attempt: job.attemptsMade, durationMs },
      "job completed"
    );
  });

  worker.on("failed", (job, err) => {
    const jobLogger = job
      ? createJobLogger(job.id ?? "unknown", job.name)
      : logger;
    const normalized = normalizeError(err);
    jobLogger.error(
      { err, code: normalized.code, attempt: job?.attemptsMade },
      "job failed"
    );
  });

  worker.on("error", (err) => {
    logger.error({ err }, "worker error");
  });

  return worker;
};
