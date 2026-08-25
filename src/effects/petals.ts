import { defineEffect } from "../core/definitions";
import { applyStyles } from "../shared/dom";
import type { ZeenatEffect } from "../shared/types";
import { mountFallingElements } from "./internal/falling";
import { requireColors, type EffectPlacementOptions } from "./utils";

export interface PetalsOptions extends EffectPlacementOptions {
  readonly colors?: readonly string[];
  readonly count?: number;
  readonly opacity?: number;
  readonly size?: readonly [number, number];
  /** Horizontal travel in CSS pixels. */
  readonly drift?: number;
  /** Maximum rotation per fall cycle in degrees. */
  readonly rotation?: number;
  /** Duration multiplier; values below 1 fall faster. */
  readonly fallSpeed?: number;
}

export function petals(options: PetalsOptions = {}): ZeenatEffect {
  const colors = requireColors(
    "petals",
    options.colors ?? ["#f9a8d4", "#fecdd3", "#fdf2f8"],
  );
  const size = options.size ?? [8, 15];
  return defineEffect({
    id: "petals",
    layer: options.layer ?? "ambient",
    ...(options.order === undefined ? {} : { order: options.order }),
    mount(context) {
      mountFallingElements(context, {
        colors,
        count: options.count ?? 22,
        minimumCount: 7,
        minSize: Math.max(3, size[0]),
        maxSize: Math.max(size[0], size[1]),
        minDuration: 9_000 * Math.max(0.2, options.fallSpeed ?? 1),
        maxDuration: 16_000 * Math.max(0.2, options.fallSpeed ?? 1),
        opacity: options.opacity ?? 0.62,
        drift: options.drift ?? 60,
        rotation: options.rotation ?? 600,
        createMark(document, color, _markSize, index) {
          const mark = document.createElement("span");
          applyStyles(mark, {
            display: "block",
            width: "100%",
            height: "72%",
            marginTop: "14%",
            borderRadius:
              index % 2 === 0 ? "70% 30% 70% 30%" : "30% 70% 30% 70%",
            backgroundColor: color,
            transform: `rotate(${index % 2 === 0 ? 18 : -18}deg)`,
            boxShadow: "inset 0 -1px 0 rgba(70, 20, 45, 0.12)",
          });
          return mark;
        },
      });
    },
  });
}
