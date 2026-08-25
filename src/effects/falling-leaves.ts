import { defineEffect } from "../core/definitions";
import { applyStyles } from "../shared/dom";
import type { ZeenatEffect } from "../shared/types";
import { mountFallingElements } from "./internal/falling";
import { requireColors, type EffectPlacementOptions } from "./utils";

export interface FallingLeavesOptions extends EffectPlacementOptions {
  readonly colors?: readonly string[];
  readonly count?: number;
  readonly opacity?: number;
  readonly size?: readonly [number, number];
  readonly drift?: number;
  readonly rotation?: number;
  /** Duration multiplier; values below 1 fall faster. */
  readonly fallSpeed?: number;
}

export function fallingLeaves(
  options: FallingLeavesOptions = {},
): ZeenatEffect {
  const colors = requireColors(
    "falling-leaves",
    options.colors ?? ["#b45309", "#d97706", "#92400e", "#a16207"],
  );
  const size = options.size ?? [10, 19];
  return defineEffect({
    id: "falling-leaves",
    layer: options.layer ?? "ambient",
    ...(options.order === undefined ? {} : { order: options.order }),
    mount(context) {
      mountFallingElements(context, {
        colors,
        count: options.count ?? 20,
        minimumCount: 6,
        minSize: Math.max(4, size[0]),
        maxSize: Math.max(size[0], size[1]),
        minDuration: 8_000 * Math.max(0.2, options.fallSpeed ?? 1),
        maxDuration: 14_000 * Math.max(0.2, options.fallSpeed ?? 1),
        opacity: options.opacity ?? 0.7,
        drift: options.drift ?? 72,
        rotation: options.rotation ?? 720,
        createMark(document, color, _markSize, index) {
          const mark = document.createElement("span");
          applyStyles(mark, {
            display: "block",
            position: "relative",
            width: "100%",
            height: "72%",
            marginTop: "8%",
            borderRadius: index % 2 === 0 ? "90% 8% 90% 8%" : "8% 90% 8% 90%",
            backgroundColor: color,
            transform: `rotate(${index % 2 === 0 ? 38 : -38}deg)`,
            boxShadow: "inset -2px -1px 0 rgba(70, 35, 5, 0.16)",
          });
          const vein = document.createElement("span");
          applyStyles(vein, {
            position: "absolute",
            left: "48%",
            top: "12%",
            width: "1px",
            height: "76%",
            backgroundColor: "rgba(70, 35, 5, 0.32)",
          });
          mark.append(vein);
          return mark;
        },
      });
    },
  });
}
