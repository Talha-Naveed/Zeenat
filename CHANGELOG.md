# Changelog

All notable changes follow [Semantic Versioning](https://semver.org/).

## 0.3.0 - Unreleased

### Added

- Occasion-independent `preset="bunting"` with `flag="pakistan"` or country codes.
- A locally packaged 249-entry country/territory catalog (excluding IL, plus XK),
  lazy SVG geometry, `zeenat/flags`, and `createBuntingPreset`.
- Horizontal and vertical flag orientation in the primitive, simple React/vanilla
  API, national preset factories, and playground controls.

- Reusable Pakistani and United States flag designs for responsive flag bunting.
- Public `BuntingFlagDesign` and `BuntingFlagRenderContext` contracts for custom
  flag artwork.
- A `pakistan-independence-day` preset for 14 August with Pakistani flag bunting
  and restrained green-and-white celebration effects.

### Changed

- Defence Day now uses original, correctly oriented fighter jets flying right to left.
- Documentation homepage is https://zeenat.xinuty.com.
- ESM and CJS builds split optional flag geometry into on-demand chunks; flag artwork
  licensing and a reproducible development-only generator are included.

- Pakistan Defence Day and US Independence Day now use country-flag bunting;
  classic pennant and swallowtail bunting remain available for custom scenes.

### Fixed

- Aircraft flight endpoints now follow same-breakpoint viewport resizing.
- Late flag loads cannot repopulate destroyed or replaced scenes; failed chunk loads
  are handled without an unhandled rejection.

- Bunting items now sit directly on the quadratic cord instead of using an
  incorrect doubled sag calculation.
- Bunting recalculates in viewport pixels on resize, keeps each item tangent to
  the cord, and preserves country-flag proportions across responsive screens.

## 0.2.1 - 2026-08-25

### Changed

- Updated the npm package author metadata to Talha.
- Expanded npm discovery keywords for website, holiday, and seasonal decorations.

## 0.2.0 - 2026-08-25

### Added

- Snow, Petals, Falling Leaves, Lanterns, and String Lights effects.
- Winter, Autumn, Spring, and Festive Lights presets with typed factory customization.
- Per-effect runtime scopes, semantic layers, diagnostics, debug mode, and preset validation.
- Individual effect/preset/core package entries and automated tree-shaking checks.
- Playwright functional, CSP, performance, and deterministic visual regression suites.
- Bundle-size budgets, runnable examples, upgraded playground, and CI configuration.

### Changed

- Effect failures now roll back only the failing effect while healthy siblings continue.
- Finite animations leave diagnostics when finished; timer and RAF callbacks are isolated.
- Responsive density rebuilds when crossing the mobile breakpoint.
- Long finite durations are chunked around browser timer limits.

### Compatibility

- Existing React, Next.js, vanilla, preset IDs, controller methods, `defineEffect`, and
  `definePreset` APIs remain supported.

## 0.1.0 - 2026-08-24

- Initial framework-neutral engine, React and vanilla adapters, deterministic
  scheduling, reduced motion, Bunting, Aircraft, Sparkles, Fireworks, Pakistan
  Defence Day, and US Independence Day.
