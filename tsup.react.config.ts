import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  splitting: false,
  // tsup's optional Rollup pass strips module directives. Esbuild still performs
  // dead-code elimination, while disabling that pass preserves the Next.js boundary.
  treeshake: false,
  external: ["react", "react-dom"],
  banner: { js: '"use client";' },
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".js" };
  },
});
