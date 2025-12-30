/**
 * Clean the queue - remove all jobs
 */

import { Queue } from "bullmq";
import { connectionOptions } from "../src/services/jobs/connection.js";

const queue = new Queue("jobs", { connection: connectionOptions });

const main = async () => {
  console.log("\n🧹 Cleaning queue...\n");

  await queue.obliterate({ force: true });

  console.log("✅ Queue cleaned\n");

  await queue.close();
  process.exit(0);
};

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
