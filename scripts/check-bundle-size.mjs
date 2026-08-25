import { gzipSync } from "node:zlib";
import { Console } from "node:console";
import { stderr, stdout } from "node:process";
import { build } from "esbuild";

const logger = new Console({ stdout, stderr });

const entries = {
  react: { path: "src/index.ts", gzip: 18_000 },
  core: { path: "src/core/index.ts", gzip: 4_500 },
  vanilla: { path: "src/vanilla/index.ts", gzip: 16_000 },
  effects: { path: "src/effects/index.ts", gzip: 14_000 },
  presets: { path: "src/presets/index.ts", gzip: 14_000 },
  aircraft: { path: "src/effects/aircraft.ts", gzip: 4_500 },
  bunting: { path: "src/effects/bunting.ts", gzip: 4_500 },
  "falling-leaves": { path: "src/effects/falling-leaves.ts", gzip: 4_500 },
  fireworks: { path: "src/effects/fireworks.ts", gzip: 4_500 },
  lanterns: { path: "src/effects/lanterns.ts", gzip: 4_500 },
  petals: { path: "src/effects/petals.ts", gzip: 4_500 },
  snow: { path: "src/effects/snow.ts", gzip: 4_500 },
  sparkles: { path: "src/effects/sparkles.ts", gzip: 4_500 },
  "string-lights": { path: "src/effects/string-lights.ts", gzip: 4_500 },
};

let failed = false;
const rows = [];
for (const [name, entry] of Object.entries(entries)) {
  const result = await build({
    entryPoints: [entry.path],
    bundle: true,
    minify: true,
    platform: "browser",
    format: "esm",
    target: "es2020",
    treeShaking: true,
    write: false,
    external: ["react", "react-dom", "react/jsx-runtime"],
    logLevel: "silent",
  });
  const bytes = result.outputFiles[0]?.contents.byteLength ?? 0;
  const gzip = gzipSync(
    result.outputFiles[0]?.contents ?? new Uint8Array(),
  ).byteLength;
  rows.push({
    entry: name,
    raw: `${bytes} B`,
    gzip: `${gzip} B`,
    budget: `${entry.gzip} B`,
  });
  if (gzip > entry.gzip) failed = true;
}

logger.table(rows);
if (failed) throw new Error("One or more Zeenat bundle budgets were exceeded.");
