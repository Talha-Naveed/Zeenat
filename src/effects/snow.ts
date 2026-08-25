import { defineEffect } from "../core/definitions";
import { applyStyles } from "../shared/dom";
import type { ZeenatEffect } from "../shared/types";
import { mountFallingElements } from "./internal/falling";
import { requireColors, type EffectPlacementOptions } from "./utils";

export interface SnowOptions extends EffectPlacementOptions {
  readonly colors?: readonly string[];
  readonly count?: number;
  readonly size?: readonly [number, number];
  readonly opacity?: number;
  readonly speed?: "slow" | "medium" | "fast";
  readonly drift?: number;
}

const SPEEDS = {
  slow: [13_000, 20_000],
  medium: [9_000, 15_000],
  fast: [6_000, 10_000],
} as const;

export function snow(options: SnowOptions = {}): ZeenatEffect {
  const colors = requireColors(
    "snow",
    options.colors ?? ["#ffffff", "#dbeafe"],
  );
  const size = options.size ?? [3, 8];
  const durations = SPEEDS[options.speed ?? "medium"];
  return defineEffect({
    id: "snow",
    layer: options.layer ?? "ambient",
    ...(options.order === undefined ? {} : { order: options.order }),
    mount(context) {
      mountFallingElements(context, {
        colors,
        count: options.count ?? 34,
        minimumCount: 10,
        minSize: Math.max(1, size[0]),
        maxSize: Math.max(size[0], size[1]),
        minDuration: durations[0],
        maxDuration: durations[1],
        opacity: options.opacity ?? 0.72,
        drift: options.drift ?? 34,
        rotation: 90,
        createMark(document, color, markSize, index) {
          const mark = document.createElement("span");
          applyStyles(mark, {
            display: "block",
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            backgroundColor: color,
            boxShadow: index % 4 === 0 ? `0 0 ${markSize}px ${color}` : "none",
          });
          return mark;
        },
      });
    },
  });
}
