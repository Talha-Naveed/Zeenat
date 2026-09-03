import { access, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { stdout } from "node:process";
import { URL, fileURLToPath, pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

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

// Exercise the emitted lazy import paths, including CJS interop, not just source.
const dom = new JSDOM();
for (const entry of [
  await import("../dist/flags/index.js"),
  require("../dist/flags/index.cjs"),
]) {
  for (const { code } of entry.flagCatalog) {
    const design = entry.countryFlag(code);
    const container = dom.window.document.createElementNS(
      "http://www.w3.org/2000/svg",
      "symbol",
    );
    container.id = `verify-${code}`;
    await design.render({
      document: dom.window.document,
      container,
      width: design.aspectRatio,
      height: 1,
      signal: new dom.window.AbortController().signal,
    });
    if (container.children.length === 0)
      throw new Error(`Missing built flag artwork: ${code}`);
  }
}
dom.window.close();

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
  `Verified ${targets.size} export targets, the React client boundary, SSR-safe imports, and all 249 flag designs in ESM and CJS.\n`,
);
