import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      // layout.tsx is framework wiring (fonts + <html>); types.ts has no runtime code.
      exclude: ["src/app/layout.tsx", "src/lib/types.ts"],
      reporter: ["text", "html", "json-summary"],
      thresholds: { lines: 90, statements: 90, functions: 90, branches: 90 },
    },
  },
});
