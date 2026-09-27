# Choosing effects and presets

Source: `src/presets/registry.ts`, `src/presets/*.ts`, `src/effects/*.ts` in
Zeenat 0.3.2. [catalog.json](catalog.json) is generated from the built package;
[options.md](options.md) is generated from its source declarations.

## Presets

| Request                   | Preset ID                   | Composition                                             |
| ------------------------- | --------------------------- | ------------------------------------------------------- |
| Country flags only        | `bunting`                   | Flag bunting; requires `flag`                           |
| Pakistan Defence Day      | `pakistan-defence-day`      | Pakistani bunting, sparkles, right-to-left fighter jets |
| Pakistan Independence Day | `pakistan-independence-day` | Pakistani bunting, sparkles, fireworks                  |
| US Independence Day       | `us-independence-day`       | US bunting, star sparkles, fireworks                    |
| Winter                    | `winter`                    | Snow, sparkles, string lights                           |
| Autumn                    | `autumn`                    | Falling leaves, sparkles                                |
| Spring/floral drift       | `spring`                    | Petals, sparkles                                        |
| General festive lighting  | `festive-lights`            | Lanterns, string lights, sparkles                       |

Use flags alone for a restrained national decoration. For an occasion without a
built-in preset, compose existing effects and describe it as a custom preset.
Generic lanterns are not evidence of a holiday-specific built-in preset. Do not
choose cultural or national imagery based on an assumed visitor identity.

## Effect factories

Import each factory from `zeenat/effects/<subpath>` or the `zeenat/effects` aggregate.
Factories return effects; pass them in `definePreset({ id, name, effects })` or
React's `ZeenatScene` `effects` prop. They are not React components.

| Factory         | Subpath          | Required options        | Default layer | Reduced motion        |
| --------------- | ---------------- | ----------------------- | ------------- | --------------------- |
| `bunting`       | `bunting`        | `flags` **or** `colors` | `top`         | Static bunting        |
| `aircraft`      | `aircraft`       | None                    | `foreground`  | Absent                |
| `sparkles`      | `sparkles`       | `colors`                | `ambient`     | Sparse static accents |
| `fireworks`     | `fireworks`      | `colors`                | `background`  | Absent                |
| `snow`          | `snow`           | None                    | `ambient`     | Sparse static flakes  |
| `petals`        | `petals`         | None                    | `ambient`     | Sparse static petals  |
| `fallingLeaves` | `falling-leaves` | None                    | `ambient`     | Sparse static leaves  |
| `lanterns`      | `lanterns`       | None                    | `top`         | Static lanterns       |
| `stringLights`  | `string-lights`  | None                    | `top`         | Static lights         |

Colors are nonempty arrays of CSS color strings. Use modest positive counts;
the library scales counts but does not impose a universal maximum on caller
input. Shared `layer`/`order` control ordering within the scene; `background`
does not mean behind the host page. `maxY` and aircraft `altitude` use viewport
height fractions. Sizes, drift, bunting height, light spacing/depth use CSS pixels.
Petal/leaf `fallSpeed` is a duration multiplier (below 1 is faster); snow uses
`speed: "slow" | "medium" | "fast"` instead.

## Customization

Use the exact factory from [options.md](options.md), imported from
`zeenat/presets/<preset-id>`. Winter exposes `snow`, `lights`, `sparkles`;
spring exposes `petals`, `accents`; autumn exposes `leaves`, `accents`;
festive lights exposes `lights`, `lanterns`, `accents`. These slots accept their
effect options or `false`. Keep at least one effect enabled. National factories
only expose `orientation`; to change their composition, use `definePreset` with
existing effect factories. See [next-decoration.tsx](../examples/next-decoration.tsx).

## Flags

`preset="bunting"` requires a supported code or slug, e.g. `flag="PK"` or
`flag="pakistan"`. The top-level `flag` is invalid on every other preset,
including custom objects. Top-level `orientation` is supported only with the
string IDs `bunting` and the three national presets. For preset objects, set it
when constructing the preset or its `bunting()` effect.

For mixed flags, import `countryFlag` from `zeenat/flags` and use
`bunting({ flags: [countryFlag("PK"), countryFlag("JP")] })`.
Use `resolveFlag(userInput)` to validate dynamic strings and obtain the typed
`.code`; it throws for unsupported input. `flagCatalog` supplies `{ code, name,
slug }` records. Consult the actual catalog rather than guessing country coverage.
Vertical orientation rotates artwork 90 degrees clockwise, not a ceremonial variant.
For colored pennants use `colors` and optional `shape`, never combine them with `flags`.

Country artwork loads as local JS chunks on mount. Keep generated assets in the
host build output; do not replace these with remote flag images. Prefer ESM/code
splitting. Pakistan and US artwork is inline.
