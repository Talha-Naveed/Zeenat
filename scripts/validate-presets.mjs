import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { Console } from "node:console";
import process, { argv, stderr, stdout } from "node:process";
import { builtInPresets } from "../dist/presets/index.js";
import { validatePresetCollection } from "../dist/core/index.js";

const logger = new Console({ stdout, stderr });

let presets = Object.values(builtInPresets);
const modulePath = argv[2];
if (modulePath) {
  const imported = await import(pathToFileURL(resolve(modulePath)).href);
  const candidates = imported.presets ?? [
    imported.default,
    ...Object.values(imported),
  ];
  presets = candidates.filter(
    (candidate) =>
      candidate &&
      typeof candidate.id === "string" &&
      Array.isArray(candidate.effects),
  );
}

const result = validatePresetCollection(presets, { requireMetadata: true });
for (const issue of result.issues) {
  const output = `${issue.level.toUpperCase()} ${issue.path}: ${issue.message}`;
  (issue.level === "error" ? logger.error : logger.warn)(output);
}
if (!result.valid) process.exitCode = 1;
else logger.log(`Validated ${presets.length} Zeenat preset(s).`);
