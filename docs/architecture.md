# Zeenat.js architecture

## Runtime shape

```text
React <Zeenat> ─┐
                ├─ SceneEngine ─ fixed inert root ─ semantic effect layers
vanilla zeenat ─┘       │
                       ├─ RuntimeScheduler (one RAF + pause-aware timers)
                       ├─ EffectRuntimeScope × N
                       │    ├─ scoped scheduler
                       │    ├─ animation registry
                       │    ├─ AbortController
                       │    └─ cleanup/disposer ownership
                       ├─ visibility / resize / motion observers
                       └─ synchronous preset resolver
```

React and vanilla are adapters over one framework-neutral engine. React
server-renders an empty root and configures it in a client effect. Vanilla lets the
engine create a root under `document.body` or a provided mount target. No browser
global is accessed at module evaluation time.

## Lifecycle and isolation

`idle` mounts into `running`; pause sources move it to `paused`; duration or schedule
moves it to `stopped`; destroy is terminal and idempotent. Manual and
document-visibility pauses are independent.

Each effect receives a dedicated DOM layer and `EffectRuntimeScope`. A mount failure
aborts that scope, cancels its scheduler work and animations, removes its layer,
records diagnostics, and reports a prefixed console error. Healthy effects continue.
Runtime timer, RAF, animation, resize, cleanup, and diagnostics-listener failures are
also isolated.

The scene has one shared RAF scheduler; scopes are ownership façades rather than
independent loops. This keeps scheduling efficient while making rollback exact.

## Layer model

Effects select `background`, `ambient`, `foreground`, or `top`. Each semantic band
receives an internal z-index range; `order` resolves positions within a band. The
root's public `zIndex` remains the only relationship with the host application.

The root and layers are fixed/absolute, clipped, pointer-inert, `aria-hidden`, and
layout-contained. Zeenat changes no host class, stylesheet, custom property, or
layout node.

## Determinism and responsiveness

One normalized scene seed derives a stable RNG stream per preset effect index. A
restart replays the same geometry. Density is scaled by intensity, small-screen
status, and motion preference. Resize callbacks receive live snapshots; crossing the
small-screen breakpoint rebuilds the scene so count-based effects adapt.

## Public boundaries

| Entry              | Responsibility                                         |
| ------------------ | ------------------------------------------------------ |
| `zeenat`           | React component, `ZeenatScene`, core definitions/types |
| `zeenat/core`      | Framework-neutral authoring and validation contracts   |
| `zeenat/vanilla`   | Browser controller API without React                   |
| `zeenat/effects`   | Aggregate neutral effects for bundler tree shaking     |
| `zeenat/effects/*` | Smallest explicit effect imports                       |
| `zeenat/presets`   | Aggregate built-in presets and registry                |
| `zeenat/presets/*` | Individually importable, configurable preset factories |

The synchronous string registry stays small for the one-line API. New catalogs can
ship as explicit imports or future external packages without making preset
resolution asynchronous.

## Build decisions

TypeScript source is built with tsup to ESM and CJS, declarations, and sourcemaps.
Subpath builds split shared chunks; React and React DOM remain peers. ESM is preferred
and `sideEffects: false` enables dead-code elimination. CJS is retained for v0.x
compatibility and should be reassessed before 1.0.

DOM/SVG plus WAAPI remains the renderer at v0.2 densities. See
[`performance.md`](performance.md) for the canvas assessment and enforced budgets.
