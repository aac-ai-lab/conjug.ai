import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["vendors/conjugai-core/**/*.test.ts"],
    globals: false,
  },
});
