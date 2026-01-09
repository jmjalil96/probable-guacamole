import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: "happy-dom",
      include: ["src/**/*.test.{ts,tsx}"],
      exclude: ["node_modules", "dist", "e2e"],
      setupFiles: ["./src/test/setup.ts"],
      testTimeout: 10000,
      env: {
        NODE_ENV: "test",
      },
      coverage: {
        provider: "v8",
        reporter: ["text", "html", "lcov"],
        include: [
          "src/lib/**/*.{ts,tsx}",
          "src/components/**/*.{ts,tsx}",
          "src/features/**/*.{ts,tsx}",
        ],
        exclude: [
          "**/*.test.{ts,tsx}",
          "**/index.ts",
          "src/test/**",
          "src/routeTree.gen.ts",
          "**/*.d.ts",
        ],
        thresholds: {
          statements: 70,
          branches: 65,
          functions: 70,
          lines: 70,
        },
      },
    },
  })
);
