import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "core/index": "src/core/index.ts",
    "vanilla/index": "src/vanilla/index.ts",
    "effects/index": "src/effects/index.ts",
    "effects/aircraft": "src/effects/aircraft.ts",
    "effects/bunting": "src/effects/bunting.ts",
    "effects/falling-leaves": "src/effects/falling-leaves.ts",
    "effects/fireworks": "src/effects/fireworks.ts",
    "effects/lanterns": "src/effects/lanterns.ts",
    "effects/petals": "src/effects/petals.ts",
    "effects/snow": "src/effects/snow.ts",
    "effects/sparkles": "src/effects/sparkles.ts",
    "effects/string-lights": "src/effects/string-lights.ts",
    "presets/index": "src/presets/index.ts",
    "presets/autumn": "src/presets/autumn.ts",
    "presets/festive-lights": "src/presets/festive-lights.ts",
    "presets/pakistan-defence-day": "src/presets/pakistan-defence-day.ts",
    "presets/spring": "src/presets/spring.ts",
    "presets/us-independence-day": "src/presets/us-independence-day.ts",
    "presets/winter": "src/presets/winter.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: false,
  minify: false,
  splitting: true,
  treeshake: true,
  external: ["react", "react-dom"],
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".js" };
  },
});
