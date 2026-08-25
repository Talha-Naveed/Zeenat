import { defineEffect } from "../core/definitions";
import { applyStyles } from "../shared/dom";
import { scaleEffectCount } from "../shared/intensity";
import type { ZeenatEffect } from "../shared/types";
import { colorAt, requireColors, type EffectPlacementOptions } from "./utils";

export interface FireworksOptions extends EffectPlacementOptions {
  readonly colors: readonly string[];
  readonly count?: number;
  readonly maxY?: number;
  readonly particlesPerBurst?: number;
}

export function fireworks(options: FireworksOptions): ZeenatEffect {
  const colors = requireColors("fireworks", options.colors);

  return defineEffect({
    id: "fireworks",
    layer: options.layer ?? "background",
    ...(options.order === undefined ? {} : { order: options.order }),
    mount(context) {
      if (context.motion === "reduced") return;
      const document = context.layer.ownerDocument;
      const burstCount = scaleEffectCount(
        options.count ?? 3,
        context.intensity,
        context.viewport,
        "full",
        1,
      );
      const particleCount = Math.max(6, options.particlesPerBurst ?? 10);
      const maxY = Math.min(0.72, Math.max(0.16, options.maxY ?? 0.52));

      for (let burstIndex = 0; burstIndex < burstCount; burstIndex += 1) {
        const burst = document.createElement("div");
        const radius = context.randomBetween(
          context.viewport.isSmall ? 28 : 42,
          context.viewport.isSmall ? 48 : 68,
        );
        const cycle = context.randomBetween(4300, 6200);
        const delay = context.randomBetween(0, cycle) + burstIndex * 900;
        applyStyles(burst, {
          position: "absolute",
          left: `${context.randomBetween(12, 88)}%`,
          top: `${context.randomBetween(14, maxY * 100)}%`,
          width: "1px",
          height: "1px",
        });
        context.layer.append(burst);

        for (let index = 0; index < particleCount; index += 1) {
          const particle = document.createElement("span");
          const angle = (Math.PI * 2 * index) / particleCount;
          const distance = radius * context.randomBetween(0.78, 1.08);
          const dx = Math.cos(angle) * distance;
          const dy = Math.sin(angle) * distance;
          applyStyles(particle, {
            position: "absolute",
            left: "0",
            top: "0",
            width: context.viewport.isSmall ? "2px" : "3px",
            height: context.viewport.isSmall ? "2px" : "3px",
            borderRadius: "50%",
            backgroundColor: colorAt(colors, index + burstIndex),
            opacity: "0",
            willChange: "transform, opacity",
          });
          burst.append(particle);
          context.animate(
            particle,
            [
              {
                transform: "translate3d(0, 0, 0) scale(0.4)",
                opacity: 0,
                offset: 0,
              },
              {
                transform: "translate3d(0, 0, 0) scale(1)",
                opacity: 0.86,
                offset: 0.08,
              },
              {
                transform: `translate3d(${dx}px, ${dy}px, 0) scale(0.85)`,
                opacity: 0.74,
                offset: 0.56,
              },
              {
                transform: `translate3d(${dx * 1.12}px, ${dy * 1.12 + 15}px, 0) scale(0.2)`,
                opacity: 0,
                offset: 0.82,
              },
              {
                transform: `translate3d(${dx * 1.12}px, ${dy * 1.12 + 15}px, 0) scale(0.2)`,
                opacity: 0,
                offset: 1,
              },
            ],
            {
              duration: cycle,
              delay,
              easing: "cubic-bezier(0.16, 0.75, 0.35, 1)",
              iterations: Infinity,
              fill: "both",
            },
          );
        }
      }
    },
  });
}
