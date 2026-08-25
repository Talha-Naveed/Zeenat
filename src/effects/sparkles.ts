import { defineEffect } from "../core/definitions";
import { applyStyles } from "../shared/dom";
import { scaleEffectCount } from "../shared/intensity";
import type { ZeenatEffect } from "../shared/types";
import { colorAt, requireColors, type EffectPlacementOptions } from "./utils";

export interface SparklesOptions extends EffectPlacementOptions {
  readonly colors: readonly string[];
  readonly count?: number;
  readonly shape?: "circle" | "diamond" | "star";
  readonly maxY?: number;
  readonly opacity?: number;
}

const STAR_CLIP =
  "polygon(50% 0%, 61% 35%, 98% 35%, 68% 56%, 79% 94%, 50% 71%, 21% 94%, 32% 56%, 2% 35%, 39% 35%)";

export function sparkles(options: SparklesOptions): ZeenatEffect {
  const colors = requireColors("sparkles", options.colors);

  return defineEffect({
    id: "sparkles",
    layer: options.layer ?? "ambient",
    ...(options.order === undefined ? {} : { order: options.order }),
    mount(context) {
      const document = context.layer.ownerDocument;
      const count = scaleEffectCount(
        options.count ?? 24,
        context.intensity,
        context.viewport,
        context.motion,
        context.motion === "reduced" ? 4 : 8,
      );
      const shape = options.shape ?? "diamond";
      const maxY = Math.min(1, Math.max(0.1, options.maxY ?? 0.9));

      for (let index = 0; index < count; index += 1) {
        const wrapper = document.createElement("span");
        const mark = document.createElement("span");
        const size = context.randomBetween(3, context.viewport.isSmall ? 7 : 9);
        const color = colorAt(colors, index);
        applyStyles(wrapper, {
          position: "absolute",
          left: `${context.randomBetween(3, 97)}%`,
          top: `${context.randomBetween(8, maxY * 100)}%`,
          width: `${size}px`,
          height: `${size}px`,
          opacity: String(
            context.motion === "reduced" ? 0.34 : (options.opacity ?? 0.62),
          ),
          willChange: context.motion === "full" ? "transform, opacity" : "auto",
        });
        applyStyles(mark, {
          display: "block",
          width: "100%",
          height: "100%",
          backgroundColor: color,
          color,
          borderRadius: shape === "circle" ? "50%" : "1px",
          clipPath: shape === "star" ? STAR_CLIP : "none",
          transform: shape === "diamond" ? "rotate(45deg)" : "none",
          boxShadow: `0 0 ${Math.max(2, size * 0.8)}px currentColor`,
        });
        wrapper.append(mark);
        context.layer.append(wrapper);

        if (context.motion === "full") {
          context.animate(
            wrapper,
            [
              { transform: "translate3d(0, 5px, 0) scale(0.7)", opacity: 0.08 },
              {
                transform: "translate3d(2px, -4px, 0) scale(1)",
                opacity: options.opacity ?? 0.62,
              },
              {
                transform: "translate3d(-2px, -9px, 0) scale(0.75)",
                opacity: 0.08,
              },
            ],
            {
              duration: context.randomBetween(2400, 4800),
              delay: context.randomBetween(-4000, 0),
              direction: "alternate",
              easing: "ease-in-out",
              iterations: Infinity,
            },
          );
        }
      }
    },
  });
}
