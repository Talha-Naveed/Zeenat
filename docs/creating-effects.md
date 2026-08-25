# Creating effects

An effect is a culturally neutral visual primitive. It knows how to mount into one
owned layer; it does not know about React, holidays, routing, analytics, or the host
application.

## Complete example

```ts
import { defineEffect } from "zeenat/core";

export interface FallingHeartsOptions {
  color: string;
  count?: number;
}

export function fallingHearts(options: FallingHeartsOptions) {
  if (!options.color.trim()) throw new TypeError("A color is required.");

  return defineEffect({
    id: "falling-hearts",
    layer: "ambient",
    mount(context) {
      const count = context.motion === "reduced" ? 3 : (options.count ?? 12);

      for (let index = 0; index < count; index += 1) {
        const heart = context.layer.ownerDocument.createElement("span");
        heart.textContent = "♥";
        heart.style.position = "absolute";
        heart.style.left = `${context.randomBetween(5, 95)}%`;
        heart.style.top =
          context.motion === "reduced" ? `${15 + index * 20}%` : "-24px";
        heart.style.color = options.color;
        context.layer.append(heart);

        if (context.motion === "full") {
          context.animate(
            heart,
            [
              { transform: "translate3d(0,-20px,0) rotate(0deg)", opacity: 0 },
              {
                transform: `translate3d(24px,${context.viewport.height + 40}px,0) rotate(300deg)`,
                opacity: 0.65,
              },
            ],
            {
              duration: context.randomBetween(7_000, 11_000),
              delay: context.randomBetween(-8_000, 0),
              iterations: Infinity,
            },
          );
        }
      }

      const removeResize = context.onResize((viewport) => {
        // Only register when CSS cannot handle the resize.
        context.layer.dataset.size = viewport.isSmall ? "small" : "large";
      });
      context.signal.addEventListener("abort", removeResize, { once: true });
    },
  });
}
```

The engine owns every node inside `context.layer`, animations created by
`context.animate`, registered animations, scheduler callbacks, resize callbacks,
and the abort signal. Return a cleanup function for any direct observer, worker, or
external resource you create.

## Context contract

- `layer`: the only DOM container an effect should mutate.
- `root`: the scene root; read it only when layer-local behavior is insufficient.
- `viewport`: a stable mount snapshot. Crossing the mobile breakpoint remounts the
  scene so density adapts.
- `intensity`: `low`, `medium`, or `high`.
- `motion`: `full` or `reduced`; every effect needs a deliberate fallback.
- `random()` / `randomBetween()`: seeded randomness. Never use `Math.random()`.
- `animate()`: creates and owns a Web Animation.
- `registerAnimation()`: adopts a Web Animation created by another API.
- `scheduler.frame()`, `delay()`, `every()`: pause-aware, scoped callbacks that are
  automatically cancelled.
- `onResize()`: isolated listener registration; one callback failure cannot stop
  sibling effects.
- `signal`: aborted before cleanup begins.

## Layers

Use `background`, `ambient`, `foreground`, or `top`. Use `order` only to resolve
ordering among effects in the same semantic layer. The entire scene still lives
inside the caller's `zIndex`; effects cannot escape it.

## Contribution requirements

1. Bound node, animation, timer, and RAF counts at every intensity.
2. Reduce density on small screens and use a static or absent reduced-motion mode.
3. Prefer transforms and opacity; do not read layout in every frame.
4. Use original, public-domain, or compatible assets and record provenance.
5. Do not inject global CSS, fetch remote assets, add focusable nodes, or capture
   pointer events.
6. Validate factory options before returning an effect.
7. Add unit cleanup tests, real-browser coverage, and deterministic visual coverage.

If an effect throws, Zeenat reports `Zeenat: effect "…" failed`, rolls back that
effect's scoped resources, and continues mounting its siblings.
