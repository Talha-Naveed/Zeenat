# Integration and API

Source: `src/shared/types.ts`, `src/react/Zeenat.tsx`, `src/vanilla/index.ts`,
`src/core/engine.ts`, `src/core/navbar.ts`, and `package.json` (0.3.2).

## Choose an entry

- **React:** `import { Zeenat, ZeenatScene } from "zeenat"`. React >=18.2 is a
  peer dependency. `Zeenat` accepts a preset; `ZeenatScene` accepts an effects
  array plus optional `id`/`name`, and omits `preset`, `flag`, `orientation`.
  See [react.tsx](../examples/react.tsx).
- **Next.js App Router:** the package's main entry preserves `"use client"`.
  A Server Component layout can render `<Zeenat preset="winter" />` directly.
  No `dynamic(..., { ssr: false })` workaround is needed for ordinary integration.
  Use a client wrapper for custom presets, effect arrays, refs, or controls;
  construct function-containing objects there. See
  [next-layout.tsx](../examples/next-layout.tsx) and
  [next-decoration.tsx](../examples/next-decoration.tsx).
- **Vanilla:** `import { zeenat } from "zeenat/vanilla"`; invoke after a browser
  document/body exists. Import itself is SSR-safe. `mount?: HTMLElement` chooses
  the root's parent, not a container-sized coordinate system: the overlay is
  still fixed to the viewport. See [vanilla.js](../examples/vanilla.js).
  The entry has no React runtime import, although package metadata declares React
  as a peer; account for the host package manager's peer handling.
- **Composition:** import `definePreset`, `defineEffect`, and validators from
  `zeenat/core` for framework-neutral code; they are also exported by `zeenat`.
  Use public subpaths, never `zeenat/src/...` or `zeenat/dist/...`.

No stylesheet import or external asset URL is required. Mount near the app root;
transformed ancestors can change fixed positioning. React renders a stable empty
root on the server and mounts effects after hydration. Keep custom objects at
module scope or memoize them on meaningful inputs to prevent unnecessary rebuilds.

## Shared options

| Option                      | Type / default                                         | Notes                                        |
| --------------------------- | ------------------------------------------------------ | -------------------------------------------- |
| `preset`                    | Built-in ID or `ZeenatPreset`; required                | No arbitrary preset strings                  |
| `flag`                      | `CountryFlag`; absent                                  | Only for string preset `bunting`             |
| `orientation`               | `"horizontal"` / `"vertical"`; horizontal              | Flag-bunting string presets only             |
| `navbar`                    | CSS selector, `"auto"`, or `false`; auto               | Top bunting only                             |
| `intensity`                 | `"low"`, `"medium"`, `"high"`; medium                  | Base density scaling                         |
| `duration`                  | Positive finite milliseconds or `"infinite"`; infinite | See scheduling                               |
| `zIndex`                    | Finite number; 1000                                    | Whole scene's stacking context               |
| `respectReducedMotion`      | Boolean; true                                          | Keep true for normal integration             |
| `motion`                    | `"system"`, `"full"`, `"reduced"`; system normally     | Explicit override; avoid forcing full motion |
| `enabled`                   | Boolean; true                                          | False prevents effect mounting               |
| `seed`                      | Number; randomly chosen if omitted                     | Fixed finite seed for reproducible previews  |
| `activeFrom`, `activeUntil` | Zoned date-time string or valid `Date`; absent         | Start inclusive, end exclusive               |
| `debug`                     | Boolean; false                                         | Debug DOM attributes; no visible panel       |

React and vanilla also accept `className`. React owns cleanup on unmount and
rebuilds the engine when scene props change. Vanilla returns a controller; call
`destroy()` at route/component teardown, before creating a replacement scene.
Vanilla has no generic `update()` or `setPreset()` method.

## Controller

React exposes the same controller through `ref` typed as `ZeenatHandle` from
`zeenat`. Vanilla returns `ZeenatController` from `zeenat/vanilla`:

- `state`: `idle | running | paused | stopped | destroyed`.
- `pause()`, `resume()`: pause/resume an active scene, not an expired/destroyed one.
- `restart()`: rebuild effects if enabled, not destroyed, and within the date window.
- `setIntensity(value)`: changing intensity rebuilds active effects.
- `destroy()`: idempotent final cleanup; create/remount a new scene to revive it.
- `getDiagnostics()`: preset/state/motion/viewport/seed, resource counts, effect errors.
- `subscribeDiagnostics(listener)`: immediately emits a snapshot and returns an
  unsubscribe function; call that when the observer is removed.

Use refs only after mount; diagnostics throw before the React engine exists.
Avoid conflicting declarative props and imperative settings for the same state.

## Layout, accessibility, and performance

The fixed overlay is clipped, `aria-hidden`, and pointer-inert. Keep interactive
controls and semantic occasion text outside it. Do not add focusable nodes or
pointer-enabled descendants. Click-through alone does not guarantee readability:
check text, form fields, menus, dialogs, and sticky navigation visually.

Auto navbar detection looks for plausible top-level `header`, `nav`, banner, or
navigation roles. For unusual geometry/nonsemantic markup use a selector such as
`navbar="#site-header"`. Multiple matches clear the lowest visible edge; missing
or hidden matches fall back to the viewport top. Only top bunting is repositioned;
use another composition or stacking choice for lights/lanterns over navigation.
Do not mutate the host header's styles to make detection work.

Effects reduce density below 640px and remount when crossing that breakpoint.
Preserve that behavior; test at a narrow phone width and desktop with a fixed
seed, then with reduced motion. Built-in high-motion effects disappear in reduced
mode; others become static/sparse. Page visibility pauses animation, and engines
without Web Animations retain static output. Avoid many simultaneous scenes and
very large caller-supplied counts. Disable optional effects with factory `false`
slots or omit them from compositions.

String preset IDs include the synchronous registry. Individual preset/effect
imports support tree shaking. Keep `debug` off unless inspecting a problem;
diagnostics help find failed mounts and growing resource counts.

For a truly new effect, inspect the installed `docs/creating-effects.md` first.
Mutate only `context.layer`; use seeded random helpers, `context.animate`, scoped
scheduler callbacks and `onResize`. Honor motion/intensity/viewport, bound resource
counts, and clean up direct external resources. Custom async flag renderers must
check `signal.aborted` after awaits. Never put scheduling or routing in an effect.
