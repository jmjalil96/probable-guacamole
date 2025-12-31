/**
 * Check queue status for failed/waiting jobs
 */

import { Queue } from "bullmq";
import { connectionOptions } from "../src/services/jobs/connection.js";

const queue = new Queue("jobs", { connection: connectionOptions });

const main = async () => {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaiting(),
    queue.getActive(),
    queue.getCompleted(),
    queue.getFailed(),
    queue.getDelayed(),
  ]);

  console.log("\n📊 Queue Status:");
  console.log(`  Waiting:   ${waiting.length}`);
  console.log(`  Active:    ${active.length}`);
  console.log(`  Completed: ${completed.length}`);
  console.log(`  Failed:    ${failed.length}`);
  console.log(`  Delayed:   ${delayed.length}`);

  if (failed.length > 0) {
    console.log("\n❌ Failed Jobs:");
    for (const job of failed) {
      console.log(`\n  Job ID: ${job.id}`);
      console.log(`  Type: ${job.name}`);
      console.log(`  Data: ${JSON.stringify(job.data)}`);
      console.log(`  Error: ${job.failedReason}`);
      console.log(`  Attempts: ${job.attemptsMade}`);
    }
  }

  if (delayed.length > 0) {
    console.log("\n⏳ Delayed Jobs (pending retry):");
    for (const job of delayed) {
      console.log(`\n  Job ID: ${job.id}`);
      console.log(`  Type: ${job.name}`);
      console.log(`  Attempts: ${job.attemptsMade}`);
    }
  }

  await queue.close();
  process.exit(0);
};

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
