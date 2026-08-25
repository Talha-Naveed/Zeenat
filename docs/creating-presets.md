# Creating presets

A preset composes reusable effects. It must not copy animation implementations.

```ts
import { definePreset } from "zeenat/core";
import { bunting } from "zeenat/effects/bunting";
import { sparkles } from "zeenat/effects/sparkles";

export default definePreset({
  id: "company-anniversary",
  name: "Company anniversary",
  description: "Brand-colored bunting with restrained gold accents.",
  tags: ["company", "anniversary"],
  author: "Example team",
  effects: [
    sparkles({ colors: ["#d6a84b", "#ffffff"], count: 12 }),
    bunting({ colors: ["#173f5f", "#ffffff"] }),
  ],
});
```

IDs are lowercase kebab case. Built-in contributions require `description` and at
least one tag. `region`, `occasion`, `season`, and `author` are optional. Cultural
metadata should be specific only when it is accurate and useful.

## Typed customization

Do not add an arbitrary `options` bag to `<Zeenat>`. Export a typed factory:

```ts
import { createWinterPreset } from "zeenat/presets/winter";

const quietWinter = createWinterPreset({
  snow: { count: 14, speed: "slow", drift: 20 },
  sparkles: false,
});
```

Simple consumers still use `<Zeenat preset="winter" />`; advanced consumers pass
the returned preset object.

## Validation

Build and validate the built-in catalog:

```bash
npm run validate:preset
```

Validate an ESM module exporting a default preset, named presets, or a `presets`
array:

```bash
node scripts/validate-presets.mjs ./path/to/presets.mjs
```

Validation checks IDs, metadata, effect definitions, empty catalogs, repeated
effect IDs, and duplicate preset IDs. Factory-level option validation handles
effect-specific colors and ranges. Cleanup behavior remains a runtime property and
must be covered by lifecycle tests.

## Review checklist

- Keep compositions to two or three complementary effects where possible.
- Test light and dark hosts, all intensities, four standard viewports, and reduced
  motion.
- Supply fixed-seed screenshots and confirm the preset remains readable behind host
  content.
- Avoid stereotypes, contested imagery, copied emblems, and assumptions about a
  visitor's identity.
- Do not put dates in a preset. Scheduling belongs to the caller.
