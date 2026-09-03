import { gzipSync } from "node:zlib";
import { Console } from "node:console";
import { stderr, stdout } from "node:process";
import { build } from "esbuild";
import { resolve } from "node:path";

const logger = new Console({ stdout, stderr });

const entries = {
  react: { path: "src/index.ts", gzip: 20_000 },
  core: { path: "src/core/index.ts", gzip: 4_500 },
  vanilla: { path: "src/vanilla/index.ts", gzip: 19_000 },
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
    splitting: true,
    metafile: true,
    outdir: ".bundle-size-check",
    external: ["react", "react-dom", "react/jsx-runtime"],
    logLevel: "silent",
  });
  const outputs = result.metafile.outputs;
  const initial = new Set();
  function visit(path) {
    if (initial.has(path)) return;
    initial.add(path);
    for (const dependency of outputs[path].imports) {
      if (!dependency.external && dependency.kind !== "dynamic-import")
        visit(dependency.path);
    }
  }
  const main = Object.keys(outputs).find(
    (path) => outputs[path].entryPoint === entry.path,
  );
  if (!main) throw new Error(`Missing bundle entry for ${name}.`);
  visit(main);
  const files = result.outputFiles.filter((file) =>
    [...initial].some((path) => resolve(path) === file.path),
  );
  const bytes = files.reduce((sum, file) => sum + file.contents.byteLength, 0);
  const gzip = files.reduce(
    (sum, file) => sum + gzipSync(file.contents).byteLength,
    0,
  );
  const lazyFiles = result.outputFiles.filter((file) => !files.includes(file));
  if (lazyFiles.some((file) => gzipSync(file.contents).byteLength > 8_000))
    throw new Error("A lazy flag chunk exceeds 8 KB gzip.");
  rows.push({
    entry: name,
    raw: `${bytes} B`,
    gzip: `${gzip} B`,
    budget: `${entry.gzip} B`,
    lazyChunks: lazyFiles.length,
  });
  if (gzip > entry.gzip) failed = true;
}

logger.table(rows);
if (failed) throw new Error("One or more Zeenat bundle budgets were exceeded.");
