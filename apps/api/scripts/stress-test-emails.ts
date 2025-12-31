/**
 * Stress test: 100 concurrent email jobs
 */

import { enqueue } from "../src/services/jobs/index.js";

const EMAIL_COUNT = 100;

const jobTypes = [
  "email:verification",
  "email:password-reset",
  "email:welcome",
] as const;

const main = async () => {
  console.log(`\n🔥 STRESS TEST: Enqueuing ${EMAIL_COUNT} email jobs...\n`);

  const jobs = [];
  for (let i = 0; i < EMAIL_COUNT; i++) {
    const type = jobTypes[i % jobTypes.length];
    const email = `stress${i + 1}@example.com`;
    const userId = `user_${i + 1}`;

    switch (type) {
      case "email:verification":
        jobs.push({ type, data: { to: email, userId, token: `vtoken_${i}` } });
        break;
      case "email:password-reset":
        jobs.push({ type, data: { to: email, userId, token: `rtoken_${i}` } });
        break;
      case "email:welcome":
        jobs.push({ type, data: { to: email, userId } });
        break;
    }
  }

  const start = performance.now();

  // Fire all at once
  await Promise.all(
    jobs.map((job) => enqueue(job.type, job.data as never))
  );

  const enqueueTime = Math.round(performance.now() - start);
  console.log(`✅ ${EMAIL_COUNT} jobs enqueued in ${enqueueTime}ms\n`);

  // Poll for completion
  console.log("⏳ Waiting for jobs to complete...\n");

  const { Queue } = await import("bullmq");
  const { connectionOptions } = await import("../src/services/jobs/connection.js");
  const queue = new Queue("jobs", { connection: connectionOptions });

  let lastCompleted = 0;
  let stableCount = 0;

  while (true) {
    await new Promise((r) => setTimeout(r, 500));

    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);

    process.stdout.write(
      `\r  Waiting: ${waiting} | Active: ${active} | Completed: ${completed} | Failed: ${failed}   `
    );

    if (waiting === 0 && active === 0) {
      if (completed === lastCompleted) {
        stableCount++;
        if (stableCount >= 2) break;
      } else {
        stableCount = 0;
        lastCompleted = completed;
      }
    }
  }

  const [completed, failed] = await Promise.all([
    queue.getCompletedCount(),
    queue.getFailedCount(),
  ]);

  const totalTime = Math.round(performance.now() - start);

  console.log(`\n\n📊 RESULTS:`);
  console.log(`  Total jobs:     ${EMAIL_COUNT}`);
  console.log(`  Completed:      ${completed}`);
  console.log(`  Failed:         ${failed}`);
  console.log(`  Success rate:   ${((completed / EMAIL_COUNT) * 100).toFixed(1)}%`);
  console.log(`  Total time:     ${totalTime}ms`);
  console.log(`  Throughput:     ${(EMAIL_COUNT / (totalTime / 1000)).toFixed(1)} jobs/sec\n`);

  await queue.close();

  if (failed > 0) {
    console.log("❌ STRESS TEST FAILED\n");
    process.exit(1);
  } else {
    console.log("✅ STRESS TEST PASSED\n");
    process.exit(0);
  }
};

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
