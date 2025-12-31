import type { JobsOptions } from "bullmq";
import { queue, createWorker } from "./queue.js";
import type { JobDataByType, JobType } from "./types.js";

export const enqueue = <T extends JobType>(
  type: T,
  data: JobDataByType<T>,
  options?: JobsOptions
) => queue.add(type, data, options);

export { createWorker };
export type { JobType, JobDataByType } from "./types.js";
