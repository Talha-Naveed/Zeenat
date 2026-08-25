# Changelog

All notable changes follow [Semantic Versioning](https://semver.org/).

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
