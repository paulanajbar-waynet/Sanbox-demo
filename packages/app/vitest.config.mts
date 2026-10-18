import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // `server-only` throws outside React Server Components; tests run on the server anyway.
      "server-only": fileURLToPath(new URL("./test/stubs/server-only.ts", import.meta.url)),
      "@/": fileURLToPath(new URL("./src/", import.meta.url)),
    },
  },
  test: {
    env: { LOG_LEVEL: "silent" },
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
