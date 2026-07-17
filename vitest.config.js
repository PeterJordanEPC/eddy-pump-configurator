import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.js"],
    exclude: ["e2e/**", "node_modules/**"],
    css: true,
    restoreMocks: true,
  },
});
