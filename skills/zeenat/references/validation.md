# Validation

## In a consuming application

Run its existing typecheck/build after integration. This catches wrong imports,
option names, and prop types, but not date-window validity, missing required flags
on string presets, RSC serialization, or visual regressions. Factories and the
engine also validate at runtime; TypeScript types are not a complete runtime schema.

For a custom preset, use `validatePresetDefinition(preset)` from `zeenat/core`.
Inspect `.valid` and `.issues`; `{ requireMetadata: true }` also requires a
description and tags. This accepts a real preset with effect functions, not JSON.
It checks definition structure and duplicate effect IDs, not resource cleanup or
every numeric factory option. Treat dynamic caller configuration accordingly.

Inspect the result at phone and desktop widths and with reduced motion. Verify
links/buttons, scrolling, tab order, menus/dialogs, header clearance, and readable
content on the host background. Navigate away/back and ensure scenes do not
accumulate. For scheduled effects check the boundaries in
[scheduling.md](scheduling.md). Inspect controller diagnostics for failed effects
and growing resources; unsubscribe observers when removed.

If browser tools are unavailable, report build/type validation separately and
leave visual, interaction, and device acceptance explicitly unverified.

## In the Zeenat repository

After `npm ci`:

```sh
npm run skill:generate
npm run validate:skill
```

`skill:generate` builds the library, then refreshes `references/options.md` from
the TypeScript source and `references/catalog.json` from built preset metadata
and public exports. Do not edit those generated files by hand. `validate:skill`
builds first, verifies generated files are current, checks local Skill links,
and typechecks all examples against the package's **built public declarations**
(including vanilla JavaScript with `checkJs`). It also executes the custom preset
example and checks vanilla mount/cleanup in jsdom. These are local smoke checks,
not a real-browser or Next.js production acceptance test.

`npm run check` includes `validate:skill:built` after its build. When API behavior
changes, update the handwritten guidance/examples as well as regenerating the
reference and the version noted in `SKILL.md`. The runtime's normal test suite owns timing, motion, and layout
regressions; do not duplicate it in a documentation-only config validator.

For a skill release, also inspect `npm pack --dry-run` to ensure the complete
`skills/zeenat` directory is present. Copy the entire folder into an agent's
supported skill directory; copying only `SKILL.md` breaks progressive disclosure.

Useful manual exercises: add subtle scheduled Pakistan flag bunting to a Next.js
layout; customize winter in React without lights; integrate and tear down vanilla
bunting; respond to an unsupported effect request by composing existing primitives
or explaining the gap. Confirm the produced code follows the actual declarations
and does not replace the user's page or introduce a service.
