import { beforeAll, afterAll, afterEach } from "vitest";
import { db } from "../config/db.js";

beforeAll(async () => {
  // Verify database connection
  await db.$queryRaw`SELECT 1`;
});

afterEach(async () => {
  // Small delay to allow connection pool to settle
  await new Promise((resolve) => setTimeout(resolve, 50));
});

afterAll(async () => {
  await db.$disconnect();
});
