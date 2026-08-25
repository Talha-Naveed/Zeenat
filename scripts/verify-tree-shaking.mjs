import { build } from "esbuild";
import { cwd, stdout } from "node:process";

async function bundle(source) {
  const result = await build({
    stdin: { contents: source, resolveDir: cwd(), loader: "js" },
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
  return result.outputFiles[0]?.text ?? "";
}

const snowBundle = await bundle(
  'import { snow } from "./dist/effects/index.js"; console.log(snow({ count: 1 }));',
);
for (const forbidden of [
  "aircraft",
  "fireworks",
  "lanterns",
  "bunting",
  "react/jsx-runtime",
]) {
  if (snowBundle.includes(forbidden)) {
    throw new Error(
      `The aggregate Snow fixture unexpectedly retained ${forbidden}.`,
    );
  }
}

const vanillaBundle = await bundle(
  'import { zeenat } from "./dist/vanilla/index.js"; console.log(zeenat);',
);
for (const forbidden of ["react/jsx-runtime", "useEffect", "forwardRef"]) {
  if (vanillaBundle.includes(forbidden)) {
    throw new Error(
      `The vanilla fixture unexpectedly retained React marker ${forbidden}.`,
    );
  }
}

stdout.write(
  `Tree shaking verified: Snow ${snowBundle.length} B minified; vanilla ${vanillaBundle.length} B minified; no forbidden modules retained.`,
);
