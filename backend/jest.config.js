import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/tests/**/*.test.ts", "**/src/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      include: ["src/controllers/**/*.ts", "src/services/**/*.ts"],
      exclude: ["src/types/**"],
    },
  },
});
