import { readFile, writeFile, access, readdir } from "node:fs/promises";
import { dirname, resolve, relative } from "node:path";
import { URL, fileURLToPath, pathToFileURL } from "node:url";
import process from "node:process";
import ts from "typescript";
import prettier from "prettier";

const root = fileURLToPath(new URL("..", import.meta.url));
const skill = resolve(root, "skills/zeenat");
const manifest = JSON.parse(
  await readFile(resolve(root, "package.json"), "utf8"),
);
const write = process.argv.includes("--write");
const sourceProgram = ts.createProgram([resolve(root, "src/index.ts")], {
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
});
const checker = sourceProgram.getTypeChecker();
const publicEntries = Object.entries(manifest.exports).filter(([key]) =>
  /^\.\/(effects|presets)\/[^/]+$/.test(key),
);
const effects = [];
const presets = [];
const sections = [];

for (const [key, definition] of publicEntries) {
  const sourcePath = `src/${key.slice(2)}.ts`;
  const source = sourceProgram.getSourceFile(resolve(root, sourcePath));
  if (!source) throw new Error(`Missing source: ${sourcePath}`);
  const declarations = [];
  const factories = [];
  for (const node of source.statements) {
    const exported = node.modifiers?.some(
      (m) => m.kind === ts.SyntaxKind.ExportKeyword,
    );
    if (
      (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) &&
      (exported || node.name.text === "BuntingBaseOptions")
    ) {
      declarations.push(node.getText(source));
    }
    if (exported && ts.isFunctionDeclaration(node) && node.name) {
      const signature = checker.getSignatureFromDeclaration(node);
      declarations.push(
        `export function ${node.name.text}${checker.signatureToString(
          signature,
          node,
          ts.TypeFormatFlags.NoTruncation |
            ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope,
        )};`,
      );
      factories.push(node.name.text);
    }
  }
  const importPath = `zeenat${key.slice(1)}`;
  sections.push(
    `## ${importPath}\n\nSource: \`${sourcePath}\`.\n\n\`\`\`ts\n${declarations.join("\n\n")}\n\`\`\``,
  );
  if (key.startsWith("./effects/")) {
    effects.push({ importPath, factories });
  } else {
    const entry = await import(
      pathToFileURL(resolve(root, definition.import)).href
    );
    // Bunting is parameterized and absent from builtInPresets. Use one supported
    // flag to derive its metadata; never serialize artwork or mount functions.
    const preset =
      key === "./presets/bunting"
        ? entry.createBuntingPreset({ flag: "PK" })
        : Object.values(entry).find(
            (value) => value && Array.isArray(value.effects),
          );
    if (!preset) throw new Error(`No preset metadata found for ${key}`);
    const { effects: presetEffects, ...metadata } = preset;
    presets.push({
      ...metadata,
      importPath,
      factories,
      ...(key === "./presets/bunting"
        ? { exampleFactoryOptions: { flag: "PK" } }
        : {}),
      effectIds: presetEffects.map((effect) => effect.id),
    });
  }
}

const placementSource = sourceProgram.getSourceFile(
  resolve(root, "src/effects/utils.ts"),
);
const placement = placementSource.statements.find(
  (node) =>
    ts.isInterfaceDeclaration(node) &&
    node.name.text === "EffectPlacementOptions",
);
const options = `# Generated factory options\n\nGenerated for Zeenat ${manifest.version} by \`npm run skill:generate\`. Do not edit.\nRead only the section for the chosen effect/preset. Signatures omit implementation;\noptional arguments correspond to factory defaults. Imports are listed by heading.\nReferenced shared types such as \`ZeenatEffect\`, \`ZeenatPreset\`, and \`ZeenatLayer\`\nare exported from \`zeenat/core\`; \`CountryFlag\` comes from \`zeenat/flags\`.\nEffect option types are declared under their effect subpath; preset option types under their preset subpath.\n\`FlagOrientation\` and flag-design types come from \`zeenat/effects/bunting\`.\n\`BuntingBaseOptions\` is an internal base shown for completeness, not an import.\n\n## Shared placement\n\n\`EffectPlacementOptions\` is exported from \`zeenat/effects\`.\n\n\`\`\`ts\n${placement.getText(placementSource)}\n\`\`\`\n\n${sections.join("\n\n")}\n`;
const catalog = {
  schemaVersion: 1,
  library: manifest.name,
  libraryVersion: manifest.version,
  description:
    "Discovery metadata, not a serialized scene or configuration schema. Bunting metadata uses the example factory options shown.",
  presets,
  effects,
};

for (const [name, content, parser] of [
  ["options.md", options, "markdown"],
  ["catalog.json", JSON.stringify(catalog), "json"],
]) {
  const target = resolve(skill, "references", name);
  const config = await prettier.resolveConfig(target);
  const formatted = await prettier.format(content, { ...config, parser });
  if (
    formatted.includes(root.replaceAll("\\", "/")) ||
    formatted.includes(root)
  ) {
    throw new Error(`Generated ${name} contains an absolute workspace path.`);
  }
  if (write) await writeFile(target, formatted);
  else if (
    (await readFile(target, "utf8")).replaceAll("\r\n", "\n") !==
    formatted.replaceAll("\r\n", "\n")
  ) {
    throw new Error(`${name} is stale. Run npm run skill:generate.`);
  }
}

if (!write) {
  async function inspectLinks(folder) {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const file = resolve(folder, entry.name);
      if (entry.isDirectory()) await inspectLinks(file);
      else if (entry.name.endsWith(".md")) {
        const content = await readFile(file, "utf8");
        for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
          const target = match[1].split("#")[0];
          if (!target || /^[a-z]+:/i.test(target)) continue;
          const destination = resolve(dirname(file), target);
          if (relative(skill, destination).startsWith("..")) {
            throw new Error(`Skill resource must be self-contained: ${target}`);
          }
          await access(destination);
        }
      }
    }
  }
  await inspectLinks(skill);
  const examples = (await readdir(resolve(skill, "examples")))
    .filter((name) => /\.(tsx?|js)$/.test(name))
    .map((name) => resolve(skill, "examples", name));
  // No source aliases: resolve package self-imports through its published exports.
  const program = ts.createProgram(examples, {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    exactOptionalPropertyTypes: true,
    allowJs: true,
    checkJs: true,
    noEmit: true,
    skipLibCheck: true,
    types: [],
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) {
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCurrentDirectory: () => root,
        getCanonicalFileName: (file) => file,
        getNewLine: () => "\n",
      }),
    );
  }
  process.stdout.write(
    `Validated Skill links, generated references, and ${examples.length} public-API examples.\n`,
  );
} else {
  process.stdout.write(
    `Generated Skill references for Zeenat ${manifest.version}.\n`,
  );
}
