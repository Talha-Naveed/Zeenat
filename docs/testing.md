# Testing

## Main verification

```bash
npm run check
```

The command verifies formatting, ESLint, strict TypeScript, Vitest tests,
ESM/CJS/declarations/sourcemaps, every package export, SSR imports, preset schema,
tree shaking, bundle budgets, the playground, three runnable examples, and
functional Playwright coverage in Chromium, Firefox, and WebKit.

Navbar regressions cover fixed/sticky and scrolling headers, partial visibility,
CSS hide/reveal transitions, mobile resizing, selector overrides, late/replaced
headers, opt-out, unchanged host layout, and observer cleanup.

Install browsers once on a new machine:

```bash
npx playwright install chromium firefox webkit
```

## Focused commands

```bash
npm test                 # jsdom + node/SSR tests
npm run test:browser     # functional and performance browser tests
npm run test:visual      # compare Chromium screenshots
npm run check:size       # bundle gzip budgets
npm run test:tree-shaking
npm run validate:preset
npm pack --dry-run
```

## Visual baselines

Visual tests use seed `12345`, pause every Web Animation, and set a common animation
time before capture. This makes generated geometry and animation phase stable.
Snapshots cover the two original presets, each v0.2 effect, mobile winter, and a
reduced-motion scene.

Review diffs visually before updating:

```bash
npm run test:visual:update
```

Snapshots are committed under `tests/browser/__snapshots__`. Functional browser
tests run in normal CI; visual comparison remains a separate reviewed command to
avoid accepting platform rasterization changes automatically.

## Adding coverage

Use pure tests for definitions and scaling, jsdom for lifecycle ownership and React
unmount, real browsers for layout/CSP/WAAPI/interaction, and screenshots only for a
meaningful visual contract. Never loosen a budget or remove an assertion merely to
make a regression pass.
