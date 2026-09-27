---
name: zeenat
description: Add or customize Zeenat website decorations in React, Next.js, or vanilla JavaScript. Use for seasonal or occasion effects, flag bunting, reusable effect compositions, and scheduled decorations using Zeenat.
---

# Zeenat

Add a decorative layer to an existing website using the installed Zeenat API.
Prefer an existing preset, then a typed preset factory, then a composition of
existing effects. Write a new effect only when the requested visual cannot be
expressed with those building blocks. Preserve the host application's design.

## Workflow

1. Inspect the host framework, package manifest/lockfile, existing decoration
   mounts, header, and client/server boundaries. Install `zeenat` with the host's
   package manager if absent. These references describe **0.3.2**; check the
   installed declarations before using them with another version.
2. Select from [effects and presets](references/effects.md). Do not infer an API
   from a holiday name. For exact factory options, search the generated
   [option signatures](references/options.md) for the chosen factory. The
   generated [catalog](references/catalog.json) supplies structured preset
   metadata, effect IDs, and public import paths when machine-readable data helps.
3. Follow [integration and API](references/integration.md), reading only the
   applicable example: [React](examples/react.tsx), [Next.js layout](examples/next-layout.tsx),
   [Next.js custom client scene](examples/next-decoration.tsx), or
   [vanilla](examples/vanilla.js). Keep presets/effect arrays stable across React
   renders; mount one scene at the appropriate application or route lifetime.
4. For dates or finite playback, read [scheduling](references/scheduling.md).
   Use explicit time zones, and distinguish calendar windows from milliseconds
   of playback. Preset names do not activate themselves on holidays.
5. Verify the host's typecheck/build, then inspect desktop and mobile rendering,
   reduced motion, header visibility, pointer/keyboard access, and route cleanup.
   Use [validation](references/validation.md) for diagnostics and maintainer checks.
   Report checks actually performed and any remaining browser verification.

## Constraints that matter

- Keep the overlay decorative: no meaningful text, controls, focusable children,
  pointer capture, or overriding `pointer-events: none` / `aria-hidden`.
- Honor system reduced motion by default. Start with low intensity for subtle
  requests. Counts scale with viewport/intensity and have effect-specific minima;
  `count: 0` is not a reliable way to disable an effect.
- Next.js string presets can be rendered from Server Components. Construct custom
  preset/effect objects inside a client module; their functions cannot cross the
  server-to-client serialization boundary.
- Keep top bunting clear of navigation with `navbar` (default `"auto"`, selector,
  or `false`). It does not reposition lights, lanterns, or other effects. Inspect
  stacking and readability even when clicks pass through.
- Do not invent a universal `options` prop, CSS import, confetti preset, cron
  service, or MCP requirement. Zeenat ships local assets and needs no service for
  the workflows in this Skill.
