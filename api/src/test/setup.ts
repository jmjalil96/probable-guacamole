import { vi } from "vitest";

// Mock the job queue globally - fire-and-forget, don't need real Redis
vi.mock("../services/jobs/index.js", () => ({
  enqueue: vi.fn().mockResolvedValue({ id: "mock-job-id" }),
  createWorker: vi.fn(),
}));

// Silence logger in tests (LOG_LEVEL=silent in .env.test handles most, but mock child loggers)
vi.mock("../lib/logger.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../lib/logger.js")>();

  const noopLogger = {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(() => noopLogger),
  };

  return {
    ...actual,
    logger: noopLogger,
    createRequestLogger: vi.fn(() => noopLogger),
    createJobLogger: vi.fn(() => noopLogger),
  };
});
