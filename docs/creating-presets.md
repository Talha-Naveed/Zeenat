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

## Flag bunting

Country flags are reusable artwork passed to the culturally neutral `bunting`
layout effect. This keeps cord layout, responsive sizing, animation, and cleanup
separate from occasion-specific artwork:

```ts
import { definePreset } from "zeenat/core";
import { bunting, pakistanFlag } from "zeenat/effects/bunting";

const nationalDecoration = definePreset({
  id: "national-decoration",
  name: "National decoration",
  effects: [bunting({ flags: [pakistanFlag], count: 14 })],
});
```

Use `unitedStatesFlag` for American flag bunting. Custom artwork implements
`BuntingFlagDesign` and draws into the normalized SVG symbol supplied by the
render context. Prefer original geometry, keep DOM complexity bounded, and verify
the artwork at mobile and desktop widths. Decorative triangle and swallowtail
bunting remains available through `colors` and `shape`.

`countryFlag("japan")` from `zeenat/flags` supplies catalog artwork. It resolves
synchronously without browser globals and loads local geometry only on mount.
Pass `orientation: "vertical"` to `bunting()` for 90° clockwise portrait hanging.
Country-specific ceremonial vertical variants are not represented.

`BuntingFlagRenderContext` includes `signal`. A design may return a `Promise<void>`;
after awaiting work it must check `signal.aborted` before adding geometry to its symbol.
The effect catches rejected renders, marks the symbol `data-zeenat-flag-status="failed"`,
and reports a console error without breaking other effects. Successful symbols are
marked `ready`; in-flight ones are `loading`. Use the supplied document and prefix
internal SVG IDs with `container.id` to avoid collisions between multiple scenes.

`createBuntingPreset({ flag: "PK", orientation: "vertical" })` is available from
`zeenat/presets/bunting`. The generic preset requires a flag and is resolved separately
from `builtInPresets`, which contains only ready-to-use occasion/season preset objects.

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
