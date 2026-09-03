# Performance

Zeenat's first constraint is that the host application remains usable. Effects use
bounded DOM/SVG geometry and the Web Animations API, so continuous transforms run
outside React and normally stay on the compositor.

## Automated budgets

`npm run check:size` bundles and minifies the React, core, vanilla, aggregate, and
individual effect entries, then enforces gzip limits across the complete initial
static dependency graph. Current ceilings are 20 KB for
the React entry, 19 KB for vanilla, 14 KB for aggregate catalogs, 4.5 KB for core,
and 4.5 KB for each individual effect.

v0.3 raises the React/vanilla ceilings from 18/16 KB to account for country names,
aliases, and orientation/lifecycle handling. The optional flag loader table and
247 country geometry modules are code-split; each optional chunk has an independent
8 KB gzip ceiling. The size check prints both initial bytes and optional chunk count.
Pakistan/US original geometry stays inline. A browser test checks that selecting
Japan loads Japan's local artwork, not all countries. No running flag scene requires
third-party image traffic or additional animation frameworks.

The Chromium performance test enforces a representative scene budget of at most
180 DOM nodes, 100 animations, 10 timers, and two RAF loops. It repeatedly
mounts/unmounts the scene, verifies a single root remains, confirms final cleanup,
and samples 30 animation frames with a conservative 50 ms average ceiling. These
are regression tripwires, not synthetic benchmark claims.

## Runtime safeguards

- one scene scheduler multiplexes RAF work and pause-aware timers;
- each effect receives a scoped scheduler and animation registry;
- finished animations leave the registry automatically;
- visibility pauses scheduler work without losing a manual pause;
- small-screen and reduced-motion density are independently limited;
- breakpoint crossings rebuild with the same deterministic seed;
- destroy, React unmount, navigation, and failed mounts release owned resources;
- the overlay is fixed and clipped, so it does not create layout or overflow work.

## Canvas renderer assessment

v0.2 intentionally stays with DOM/SVG. The highest built-in scene is comfortably
inside the browser budgets, DOM shapes make static reduced-motion fallbacks simple,
and WAAPI provides lifecycle visibility that diagnostics can count. A shared canvas
renderer would add DPR resizing, hitless draw scheduling, state serialization, and a
second authoring contract without a measured benefit at current densities.

Revisit canvas when one effect genuinely needs roughly 150+ simultaneously moving
particles or profiles show DOM/style overhead dominating. Fireworks, confetti, and
very dense snow are the likely candidates. The engine's scoped scheduler and abort
signal can own a future renderer without changing preset definitions.

## Memory

Browser tests use repeated mount/unmount and resource counters as stable leak
proxies. Cross-browser heap measurements are not sufficiently portable for a hard CI
threshold. When investigating a suspected leak, run the performance test with a
Chromium trace and compare heap snapshots before and after repeated remounts.
