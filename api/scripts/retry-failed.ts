/**
 * Retry all failed jobs
 */

import { Queue } from "bullmq";
import { connectionOptions } from "../src/services/jobs/connection.js";

const queue = new Queue("jobs", { connection: connectionOptions });

const main = async () => {
  const failed = await queue.getFailed();

  if (failed.length === 0) {
    console.log("No failed jobs to retry");
    await queue.close();
    process.exit(0);
  }

  console.log(`\n🔄 Retrying ${failed.length} failed jobs...\n`);

  for (const job of failed) {
    await job.retry();
    console.log(`  ✓ Retried job ${job.id} (${job.name})`);
  }

  console.log(`\n✅ All failed jobs queued for retry\n`);

  await queue.close();
  process.exit(0);
};

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
