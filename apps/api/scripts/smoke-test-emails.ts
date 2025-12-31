/**
 * Smoke test: Enqueue 20 simultaneous email jobs
 *
 * Usage:
 *   npx tsx scripts/smoke-test-emails.ts
 *
 * Prerequisites:
 *   - Redis running (docker compose up -d)
 *   - Worker running (npm run dev:worker)
 *   - Inbucket running (check http://localhost:9000)
 */

import { enqueue } from "../src/services/jobs/index.js";

const EMAIL_COUNT = 20;

const jobTypes = [
  "email:verification",
  "email:password-reset",
  "email:welcome",
] as const;

const generateJobs = () => {
  const jobs = [];

  for (let i = 0; i < EMAIL_COUNT; i++) {
    const type = jobTypes[i % jobTypes.length];
    const email = `test${i + 1}@example.com`;
    const userId = `user_${i + 1}`;

    switch (type) {
      case "email:verification":
        jobs.push({
          type,
          data: { to: email, userId, token: `verify_token_${i + 1}` },
        });
        break;
      case "email:password-reset":
        jobs.push({
          type,
          data: { to: email, userId, token: `reset_token_${i + 1}` },
        });
        break;
      case "email:welcome":
        jobs.push({
          type,
          data: { to: email, userId },
        });
        break;
    }
  }

  return jobs;
};

const main = async () => {
  console.log(`\n🚀 Enqueuing ${EMAIL_COUNT} email jobs...\n`);

  const jobs = generateJobs();
  const start = performance.now();

  // Enqueue all jobs simultaneously
  const results = await Promise.all(
    jobs.map(async (job, index) => {
      const queued = await enqueue(job.type, job.data as never);
      console.log(`  ✓ [${index + 1}/${EMAIL_COUNT}] ${job.type} → ${job.data.to}`);
      return queued;
    })
  );

  const duration = Math.round(performance.now() - start);

  console.log(`\n✅ All ${results.length} jobs enqueued in ${duration}ms`);
  console.log(`\n📬 Check Inbucket UI: http://localhost:9000\n`);

  // Give time for logs to flush
  await new Promise((r) => setTimeout(r, 100));
  process.exit(0);
};

main().catch((err) => {
  console.error("❌ Smoke test failed:", err);
  process.exit(1);
});
