import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
    setupFiles: ["./src/test/setup.ts", "./src/test/setup-integration.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
        isolate: true,
      },
    },
    sequence: {
      hooks: "list",
    },
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/features/**/*.ts", "src/services/**/*.ts"],
      exclude: ["**/*.test.ts", "**/index.ts"],
    },
  },
});
