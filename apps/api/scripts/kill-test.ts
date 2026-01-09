/**
 * Kill test: Prove jobs survive worker death
 *
 * Strategy: Enqueue jobs FIRST, then start worker, then kill mid-flight
 */

import { Queue } from "bullmq";
import { spawn, execSync } from "child_process";
import { enqueue } from "../src/services/jobs/index.js";
import { connectionOptions } from "../src/services/jobs/connection.js";

const JOB_COUNT = 500;

const queue = new Queue("jobs", { connection: connectionOptions });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const getStats = async () => {
  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
  ]);
  return { waiting, active, completed, failed };
};

const main = async () => {
  // Kill any existing workers first
  try {
    execSync('pkill -f "tsx.*worker" 2>/dev/null || true', { stdio: "ignore" });
  } catch {}
  await sleep(500);

  // Clean slate
  await queue.obliterate({ force: true });
  console.log("\n🧪 KILL TEST: Proving job durability\n");

  // Enqueue jobs FIRST (before worker starts)
  console.log(`1️⃣  Enqueuing ${JOB_COUNT} jobs (worker not running yet)...`);
  const jobs = [];
  for (let i = 0; i < JOB_COUNT; i++) {
    jobs.push(
      enqueue("email:verification", {
        to: `kill${i}@test.com`,
        userId: `u${i}`,
        token: `t${i}`,
      })
    );
  }
  await Promise.all(jobs);

  let stats = await getStats();
  console.log(`   ✓ ${JOB_COUNT} jobs waiting in queue\n`);

  // Start worker
  console.log("2️⃣  Starting worker...");
  const worker = spawn("npx", ["tsx", "src/worker.ts"], {
    stdio: "ignore",
    detached: true,
  });
  worker.unref();

  // Wait just long enough to start processing, then kill
  await sleep(100);

  // Poll until we see some processing, then kill immediately
  let killAttempted = false;
  while (!killAttempted) {
    stats = await getStats();

    if (stats.completed > 10 && stats.waiting > 50) {
      // Sweet spot: some processed, some waiting
      console.log(`   Completed: ${stats.completed}, Waiting: ${stats.waiting}, Active: ${stats.active}`);
      console.log(`\n3️⃣  💀 KILLING WORKER NOW...`);

      try {
        process.kill(worker.pid!, "SIGKILL");
      } catch {}
      killAttempted = true;
    } else if (stats.waiting === 0 && stats.active === 0) {
      // Too late, all done
      console.log("   (Worker too fast, all jobs completed)");
      killAttempted = true;
    }

    await sleep(10);
  }

  await sleep(500);
  stats = await getStats();

  const completedBeforeRestart = stats.completed;
  const remainingJobs = JOB_COUNT - completedBeforeRestart;

  console.log(`\n   After kill:`);
  console.log(`   • Completed: ${completedBeforeRestart}`);
  console.log(`   • Waiting:   ${stats.waiting}`);
  console.log(`   • Failed:    ${stats.failed}`);
  console.log(`   • Active:    ${stats.active} (will be returned to queue)\n`);

  if (remainingJobs === 0) {
    console.log("   ℹ️  Worker processed all jobs before kill (too fast!)\n");
  } else {
    console.log(`   ⏳ ${remainingJobs} jobs need to complete after restart\n`);
  }

  // Restart worker
  console.log("4️⃣  Restarting worker...");
  const worker2 = spawn("npx", ["tsx", "src/worker.ts"], {
    stdio: "ignore",
    detached: true,
  });
  worker2.unref();

  // Wait for all to complete
  console.log("5️⃣  Waiting for all jobs to complete...\n");
  let stableCount = 0;
  let lastCompleted = 0;

  while (stableCount < 4) {
    await sleep(300);
    stats = await getStats();
    process.stdout.write(
      `\r   Progress: ${stats.completed}/${JOB_COUNT} completed | ${stats.failed} failed   `
    );

    if (stats.waiting === 0 && stats.active === 0) {
      if (stats.completed === lastCompleted) {
        stableCount++;
      } else {
        stableCount = 0;
        lastCompleted = stats.completed;
      }
    }
  }

  // Final stats
  stats = await getStats();
  console.log(`\n\n${"═".repeat(50)}`);
  console.log("📊 FINAL RESULTS:");
  console.log(`${"═".repeat(50)}`);
  console.log(`   Total jobs:        ${JOB_COUNT}`);
  console.log(`   Completed:         ${stats.completed}`);
  console.log(`   Failed:            ${stats.failed}`);
  console.log(`   Success rate:      ${((stats.completed / JOB_COUNT) * 100).toFixed(1)}%`);
  console.log(`${"═".repeat(50)}\n`);

  // Cleanup
  try {
    process.kill(worker2.pid!, "SIGTERM");
  } catch {}

  await queue.close();

  if (stats.completed === JOB_COUNT && stats.failed === 0) {
    console.log("✅ KILL TEST PASSED - All jobs completed despite worker death!\n");
    process.exit(0);
  } else if (stats.completed + stats.failed === JOB_COUNT) {
    console.log(`⚠️  TEST COMPLETED with ${stats.failed} failures\n`);
    process.exit(1);
  } else {
    console.log("❌ KILL TEST FAILED - Jobs lost!\n");
    process.exit(1);
  }
};

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
