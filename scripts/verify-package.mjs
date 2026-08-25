import { access, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { stdout } from "node:process";
import { URL, fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
const manifest = JSON.parse(
  await readFile(resolve(root, "package.json"), "utf8"),
);

const targets = new Set();
for (const definition of Object.values(manifest.exports)) {
  if (typeof definition === "string") continue;
  for (const target of Object.values(definition)) targets.add(target);
}

for (const target of targets) await access(resolve(root, target));

const reactEntry = await readFile(resolve(root, "dist/index.js"), "utf8");
if (!reactEntry.startsWith('"use client";')) {
  throw new Error('dist/index.js must preserve the "use client" directive.');
}

for (const definition of Object.values(manifest.exports)) {
  if (typeof definition === "string" || !definition.import) continue;
  await import(pathToFileURL(resolve(root, definition.import)).href);
  if (definition.require) require(resolve(root, definition.require));
}

stdout.write(
  `Verified ${targets.size} export targets, the React client boundary, and SSR-safe ESM imports.\n`,
);
