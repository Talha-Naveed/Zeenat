# Contributing to Zeenat.js

Thank you for helping make celebration design reusable, respectful, and safe for
production websites.

## Setup

```bash
npm install
npx playwright install chromium firefox webkit
npm run check
npm run dev
```

Use a currently supported Node.js release (Node 20.19 or newer is required by the
package metadata and the Vite development toolchain). The playground opens every
built-in preset and individual effect with lifecycle, motion, seed, device-window,
and diagnostics controls.

## Project layout

```text
src/core/       lifecycle, scheduling, animation ownership, validation
src/effects/    culturally neutral effect factories
src/presets/    compositions and built-in registry
src/react/      React client adapter
src/vanilla/    framework-independent adapter
src/shared/     types and pure utilities
tests/          unit, SSR, browser, performance, CSP, and visual tests
playground/     unpublished Vite development application
examples/       minimal integration examples
docs/           architecture and authoring contracts
```

Read the effect and preset authoring guides before adding either. Keep pull requests
focused. New runtime dependencies require an architecture rationale and bundle-size
impact; the default expectation is no runtime dependency.

## Verification

`npm run check` runs formatting, ESLint, TypeScript, Vitest, package and example
builds, export/preset/tree-shaking/bundle checks, and Playwright in Chromium,
Firefox, and WebKit. Visual baselines use `npm run test:visual` and must be reviewed
before `npm run test:visual:update`. Add tests at the lowest useful layer.

## Accessibility and cultural care

Every effect is decoration only and must provide a reduced-motion policy. Presets
that represent a cultural, national, or religious occasion require respectful review
and replaceable composition. Do not add political advocacy, contested imagery, or
unlicensed logos/assets.

## License

By contributing, you agree that your contribution is licensed under the project's
MIT License and that you have the right to submit any included assets.
