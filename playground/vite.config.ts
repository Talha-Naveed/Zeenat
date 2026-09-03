import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "zeenat/flags",
        replacement: fileURLToPath(
          new URL("../src/flags/index.ts", import.meta.url),
        ),
      },
      {
        find: "zeenat/effects",
        replacement: fileURLToPath(
          new URL("../src/effects/index.ts", import.meta.url),
        ),
      },
      {
        find: "zeenat",
        replacement: fileURLToPath(new URL("../src/index.ts", import.meta.url)),
      },
    ],
  },
  build: {
    outDir: fileURLToPath(new URL("../playground-dist", import.meta.url)),
    emptyOutDir: true,
  },
});
