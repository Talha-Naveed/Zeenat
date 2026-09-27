# Zeenat.js

> **Zeenat.js — Adorn the web.**

[Documentation](https://zeenat.xinuty.com) · [GitHub](https://github.com/Talha-Naveed/Zeenat)

Zeenat (زینت) means adornment, decoration, or beautification. Zeenat.js adds a
tasteful, occasion-aware decorative layer to an existing website with one component
or function call. It is a TypeScript-first effect engine—not another bag of confetti
components.

```bash
npm install zeenat
```

```tsx
import { Zeenat } from "zeenat";

<Zeenat preset="pakistan-defence-day" />;
```

That is the complete integration. The overlay is fixed, clipped, pointer-inert,
`aria-hidden`, responsive, reduced-motion aware, and fully cleaned up on unmount.

## React

```tsx
import { Zeenat } from "zeenat";

export function App() {
  return (
    <>
      <Zeenat preset="winter" intensity="medium" duration={8_000} />
      <main>Your existing application</main>
    </>
  );
}
```

Animations run outside React's render cycle. Scene-level prop changes rebuild owned
effect layers with deterministic cleanup.

## Next.js App Router

`Zeenat` contains its own client boundary, so `app/layout.tsx` remains a Server
Component:

```tsx
import { Zeenat } from "zeenat";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Zeenat preset="pakistan-defence-day" />
        {children}
      </body>
    </html>
  );
}
```

Server output is a stable empty decoration root. Zeenat accesses no `window`,
`document`, `navigator`, or `matchMedia` during module evaluation.

## Vanilla JavaScript

```js
import { zeenat } from "zeenat/vanilla";

const decoration = zeenat({
  preset: "us-independence-day",
  intensity: "medium",
});

decoration.pause();
decoration.resume();
decoration.setIntensity("low");
decoration.restart();
decoration.destroy();
```

Importing the entry during SSR is safe; call `zeenat()` only in a browser.
`destroy()` is idempotent.

## Built-in presets

For just country flags, without an occasion or extra effects:

```tsx
<Zeenat preset="bunting" flag="pakistan" />
<Zeenat preset="bunting" flag="pakistan" orientation="vertical" />
<Zeenat preset="bunting" flag="JP" orientation="horizontal" />
```

Use an English country slug or two-letter code. The [249-entry catalog](docs/flags-catalog.md)
contains all ISO countries/territories except Israel, plus Kosovo. `horizontal`
is the default; `vertical` rotates the artwork 90° clockwise, preserving proportions.
This is decorative portrait hanging, not a country-specific ceremonial vertical variant.
Existing occasion IDs remain supported; all three national presets also accept `orientation`.

The same options work in vanilla:

```js
zeenat({ preset: "bunting", flag: "pakistan", orientation: "vertical" });
```

### Keeping navigation clear

Top bunting automatically starts below the visible bottom edge of common site
headers and navbars. It stays below fixed/sticky navigation, moves up as a header
scrolls or slides away, and returns below it when the header reappears. Flag opacity
and the site's own styles stay unchanged; no space is inserted into the page.

For a custom header, supply its CSS selector in React or vanilla:

```tsx
<Zeenat preset="bunting" flag="pakistan" navbar="#site-header" />
```

```js
zeenat({ preset: "bunting", flag: "pakistan", navbar: "#site-header" });
```

`navbar="auto"` (the default) looks for `header`, `nav`, `[role="banner"]`, and
`[role="navigation"]` elements near the viewport top. Detection considers wide,
short header regions and excludes elements inside main content, sections, sidebars,
footers, and dialogs. Use a selector for non-semantic markup, unusually tall or
narrow headers, or layouts outside those assumptions. A selector may match several
header regions; bunting clears the lowest visible edge. Missing or hidden matches
use the viewport top, and late-mounted/replaced matches are detected automatically.

Use `navbar={false}` in React or `navbar: false` in vanilla to keep the original
viewport-top placement. This setting affects top bunting in all built-in and custom
presets; bottom bunting and other effects retain their positions.

| Preset                      | Composition                                                        | Reduced-motion result             |
| --------------------------- | ------------------------------------------------------------------ | --------------------------------- |
| `bunting`                   | Country flag bunting; requires `flag`                              | Static flag bunting               |
| `pakistan-defence-day`      | Pakistani flag bunting, subtle accents, right-to-left fighter jets | Static bunting and sparse accents |
| `pakistan-independence-day` | Pakistani flag bunting, green/white accents, modest fireworks      | Static bunting and sparse accents |
| `us-independence-day`       | American flag bunting, stars, modest fireworks                     | Static bunting and sparse stars   |
| `winter`                    | Snow, cool sparkles, warm string lights                            | Sparse static snow and lights     |
| `autumn`                    | Falling leaves and amber accents                                   | Sparse static leaves and accents  |
| `spring`                    | Drifting petals and soft sparkles                                  | Sparse static petals and accents  |
| `festive-lights`            | Generic lanterns, string lights, gold accents                      | Static lanterns and lights        |

Effects and Pakistan/US flag geometry are original CSS/SVG. Other flag artwork is
adapted from the MIT-licensed [country-flag-icons](https://github.com/catamphetamine/country-flag-icons)
collection and packaged locally; there are no third-party runtime image requests.
These are simplified 3:2 decorative icons, not exact official construction drawings.
See [asset attribution](THIRD_PARTY_NOTICES.md).

## Reusable effects

| Factory         | Strategy                                            | Default layer |
| --------------- | --------------------------------------------------- | ------------- |
| `bunting`       | Responsive SVG cable with country flags or pennants | `top`         |
| `aircraft`      | Original SVG silhouette with WAAPI flyover          | `foreground`  |
| `sparkles`      | Bounded CSS geometry with WAAPI shimmer             | `ambient`     |
| `fireworks`     | Small DOM bursts with transform animation           | `background`  |
| `snow`          | Bounded CSS flakes with fall/drift animation        | `ambient`     |
| `petals`        | CSS petal forms with drift and rotation             | `ambient`     |
| `fallingLeaves` | CSS leaf forms with vein detail                     | `ambient`     |
| `lanterns`      | Generic inline SVG lanterns with optional sway      | `top`         |
| `stringLights`  | Responsive SVG cable/bulbs with optional twinkle    | `top`         |

Use the aggregate entry or the smallest explicit subpath:

```ts
import { snow } from "zeenat/effects";
// or
import { snow } from "zeenat/effects/snow";
```

### Country-flag and classic bunting

National presets use reusable flag artwork by default. The cord, flag anchors,
and proportions recalculate with the viewport:

```ts
import { bunting, pakistanFlag } from "zeenat/effects/bunting";

const flags = bunting({
  flags: [pakistanFlag],
  count: 14,
});
```

`unitedStatesFlag` is also included. For any catalog flag:

```ts
import { countryFlag, flagCatalog } from "zeenat/flags";

const internationalBunting = bunting({
  flags: [countryFlag("pakistan"), countryFlag("japan")],
  orientation: "vertical",
});
// flagCatalog supplies { code, name, slug } entries for your own country picker.
```

Community effects can implement the exported
`BuntingFlagDesign` contract to supply original SVG flag artwork. The earlier
decorative mode remains available:

```ts
const pennants = bunting({
  colors: ["#01411c", "#ffffff"],
  shape: "pennant", // or "swallowtail"
});
```

## Configuration

```ts
type ZeenatProps = {
  preset: BuiltInPresetName | ZeenatPreset;
  flag?: CountryFlag; // required for preset="bunting"; invalid on other presets
  orientation?: "horizontal" | "vertical"; // horizontal; flag-bunting presets only
  navbar?: string | false; // "auto"; CSS selector override or false to opt out
  intensity?: "low" | "medium" | "high"; // medium
  duration?: number | "infinite"; // infinite
  zIndex?: number; // 1000
  respectReducedMotion?: boolean; // true
  motion?: "system" | "full" | "reduced"; // system
  className?: string;
  enabled?: boolean; // true
  seed?: number;
  activeFrom?: string | Date;
  activeUntil?: string | Date;
  debug?: boolean; // false
};
```

`seed` stabilizes generated positions and timing. Counts scale by intensity, viewport,
and motion preference. `motion` is intended for preview tools or an application-level
override; normal applications should use the system default.

### Scheduling

```tsx
<Zeenat
  preset="pakistan-defence-day"
  activeFrom="2026-09-05T00:00:00+05:00"
  activeUntil="2026-09-07T00:00:00+05:00"
/>
```

Strings require `Z` or an explicit UTC offset, preventing server/browser timezone
differences. Long activation and duration timers are safely chunked around browser
timer limits.

## Typed preset customization

Simple consumers use a string. Advanced consumers import a typed factory:

```tsx
import { Zeenat } from "zeenat";
import { createWinterPreset } from "zeenat/presets/winter";

const quietWinter = createWinterPreset({
  snow: { count: 14, speed: "slow", drift: 20 },
  sparkles: false,
});

<Zeenat preset={quietWinter} />;
```

This avoids a weak universal options bag and lets TypeScript know the settings for
each preset.

## Custom presets and effects

```tsx
import { definePreset, Zeenat } from "zeenat";
import { bunting, sparkles } from "zeenat/effects";

const companyAnniversary = definePreset({
  id: "company-anniversary",
  name: "Company anniversary",
  description: "Brand-colored bunting and restrained accents.",
  tags: ["company", "anniversary"],
  effects: [
    sparkles({ colors: ["#eab308", "#f8fafc"], count: 12 }),
    bunting({ colors: ["#172554", "#f8fafc"] }),
  ],
});

<Zeenat preset={companyAnniversary} intensity="low" />;
```

Effects are framework-neutral factories. The engine gives each effect a scoped
scheduler, animation registry, abort signal, seeded RNG, resize hook, semantic layer,
and failure boundary. See [creating effects](docs/creating-effects.md) and
[creating presets](docs/creating-presets.md).

## Diagnostics

Enable debug DOM state and inspect a controller snapshot:

```tsx
const ref = useRef<ZeenatHandle>(null);

<Zeenat ref={ref} preset="spring" debug />;

const snapshot = ref.current?.getDiagnostics();
const unsubscribe = ref.current?.subscribeDiagnostics(console.log);
```

Snapshots include preset, state, intensity, effective motion, viewport, seed, DOM
nodes, animations, timers, RAF loops, mounted effects, semantic layers, and isolated
errors. Debug mode does not render a production panel; the development playground
provides one.

## Accessibility

The root, layers, and generated decoration are outside the accessibility tree and
cannot receive pointer or keyboard input. `prefers-reduced-motion: reduce` is honored
by default: high-motion effects disappear or become sparse static compositions.

Never put meaningful content or controls inside a custom effect. Render semantic
occasion content in the host application.

## Performance and tree shaking

- zero runtime dependencies; React and React DOM are external peers;
- bounded DOM/SVG counts, transforms/opacity, Web Animations, and one shared RAF
  scheduler;
- per-effect cleanup scopes and automatic finite-animation release;
- visibility pausing, small-screen density, and breakpoint-aware rebuilding;
- explicit bundle-size budgets and browser performance checks;
- `sideEffects: false`, split subpath output, individual effect/preset entries, and
  automated consumer fixtures.

Using a built-in string ID includes the intentionally small synchronous registry.
The country metadata is synchronous, but the artwork index and selected flag geometry
are lazy-loaded local JS chunks on mount. Pakistan and US artwork is inline. Disabled
or server-rendered scenes request no flag chunks. Keep the whole generated `dist`
directory when deploying; a bundler may emit many small optional assets, but browsers
load only the requested country's artwork. Bundlers without code splitting may inline
these assets; prefer ESM with splitting enabled.
Applications building larger catalogs should import preset objects individually.
See [performance details and the canvas assessment](docs/performance.md).

## CSP

Zeenat injects no script or stylesheet, uses no eval/data URL/remote asset, and is
tested under strict `script-src 'self'; style-src 'self'` enforcement. A nonce prop is
therefore unnecessary. See the [CSP guide](docs/csp.md).

## Browser support

Zeenat targets modern evergreen browsers with ES2020, SVG, CSS transforms,
`requestAnimationFrame`, `AbortController`, and Web Animations. If
`Element.animate` is unavailable, effects keep a static DOM/SVG state. Internet
Explorer is not supported. Functional coverage runs in Chromium, Firefox, and
WebKit.

## Agent Skill

The portable [Zeenat Skill](skills/zeenat/SKILL.md) teaches coding agents to use
existing presets/effects, integrate React/Next.js/vanilla scenes, and preserve
scheduling, accessibility, navigation, and cleanup behavior. Copy the complete
`skills/zeenat` folder into your agent's supported skill directory. The folder is
included in the npm package; installing Zeenat alone does not activate a Skill in
your agent. No MCP server or credentials are required.

It includes progressive references, checked examples, and generated factory
signatures and discovery metadata. Maintainers should run `npm run skill:generate`
after API changes and `npm run validate:skill` before shipping. See
[Skill validation](skills/zeenat/references/validation.md) for what these checks cover.
The catalog is discovery data, not a JSON scene schema: presets contain functions.
The existing TypeScript contracts and preset validators remain authoritative.

## Development

```bash
npm install
npx playwright install chromium firefox webkit
npm run dev
npm run check
```

The unpublished playground includes all presets/effects, a country picker, horizontal/
vertical flag controls, intensity, seed, motion,
device-window requests, pause/resume/restart/destroy/remount, and live diagnostics.

`npm run check` covers format, lint, strict TypeScript, unit/SSR tests, build and
exports, preset validation, tree shaking, bundle budgets, playground, React/Vite,
Next.js App Router, vanilla builds, and functional browser tests. Visual baselines
are reviewed separately with `npm run test:visual`. See [testing](docs/testing.md).

## Build strategy

tsup produces ESM, CJS, declarations, sourcemaps, and explicit split subpaths. It was
chosen for predictable multi-entry library output and declaration bundling; Vite is
reserved for the playground/examples. The main bundle preserves `"use client"` for
Next.js while framework-neutral entries do not carry that directive.

`country-flag-icons@1.6.20` is a pinned **development-only** asset source. Generated
SVG geometry and its license are checked in. `npm run flags:generate` regenerates
the catalog, typed lazy modules, and catalog docs; it does not run during installation.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md), the authoring guides, and the
[architecture](docs/architecture.md). New effects need bounded resources,
deterministic randomness, reduced-motion design, complete cleanup, real-browser
coverage, and original or license-compatible assets. Cultural review belongs at the
preset level.

## License

[MIT](LICENSE) © 2026 Zeenat.js contributors.
