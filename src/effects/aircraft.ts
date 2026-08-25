import { defineEffect } from "../core/definitions";
import { applyStyles, createSvgElement } from "../shared/dom";
import { scaleEffectCount } from "../shared/intensity";
import type { ZeenatEffect } from "../shared/types";
import { colorAt, requireColors, type EffectPlacementOptions } from "./utils";

export interface AircraftOptions extends EffectPlacementOptions {
  readonly colors?: readonly string[];
  readonly count?: number;
  readonly direction?: "ltr" | "rtl";
  readonly altitude?: readonly [number, number];
}

export function aircraft(options: AircraftOptions = {}): ZeenatEffect {
  const colors = requireColors(
    "aircraft",
    options.colors ?? ["#315c4a", "#edf4ef"],
  );

  return defineEffect({
    id: "aircraft",
    layer: options.layer ?? "foreground",
    ...(options.order === undefined ? {} : { order: options.order }),
    mount(context) {
      if (context.motion === "reduced") return;
      const document = context.layer.ownerDocument;
      const count = scaleEffectCount(
        options.count ?? 2,
        context.intensity,
        context.viewport,
        "full",
        1,
      );
      const direction = options.direction ?? "ltr";
      const altitude = options.altitude ?? [0.16, 0.48];

      for (let index = 0; index < count; index += 1) {
        const wrapper = document.createElement("div");
        const size = context.viewport.isSmall ? 46 : 62;
        applyStyles(wrapper, {
          position: "absolute",
          left: "0",
          top: `${context.randomBetween(altitude[0], altitude[1]) * 100}%`,
          width: `${size}px`,
          height: `${Math.round(size * 0.4)}px`,
          opacity: "0",
          willChange: "transform, opacity",
        });

        const svg = createSvgElement(document, "svg");
        svg.setAttribute("viewBox", "0 0 96 38");
        svg.setAttribute("focusable", "false");
        applyStyles(svg, {
          display: "block",
          width: "100%",
          height: "100%",
          transform: direction === "rtl" ? "scaleX(-1)" : "none",
        });

        const silhouette = createSvgElement(document, "path");
        silhouette.setAttribute(
          "d",
          "M2 21 L35 17 L52 3 L61 4 L54 17 L83 19 L93 15 L96 18 L87 24 L55 25 L66 35 L57 36 L40 25 L7 26 Z",
        );
        silhouette.setAttribute("fill", colorAt(colors, index));
        silhouette.setAttribute("stroke", "rgba(0,0,0,0.2)");
        silhouette.setAttribute("stroke-width", "1");
        svg.append(silhouette);

        const accent = createSvgElement(document, "path");
        accent.setAttribute("d", "M12 21 L77 21 L72 23 L15 24 Z");
        accent.setAttribute("fill", colorAt(colors, index + 1));
        accent.setAttribute("opacity", "0.8");
        svg.append(accent);
        wrapper.append(svg);
        context.layer.append(wrapper);

        const travel = context.viewport.width + size * 2;
        const fromX = direction === "ltr" ? -size * 1.5 : travel - size * 0.5;
        const toX = direction === "ltr" ? travel - size * 0.5 : -size * 1.5;
        context.animate(
          wrapper,
          [
            {
              transform: `translate3d(${fromX}px, 8px, 0) rotate(-1deg)`,
              opacity: 0,
              offset: 0,
            },
            {
              opacity: 0.78,
              offset: 0.08,
            },
            {
              transform: `translate3d(${(fromX + toX) / 2}px, -5px, 0) rotate(1deg)`,
              opacity: 0.78,
              offset: 0.52,
            },
            {
              transform: `translate3d(${toX}px, 2px, 0) rotate(-1deg)`,
              opacity: 0,
              offset: 1,
            },
          ],
          {
            duration: context.randomBetween(10_000, 14_000),
            delay: 1800 + index * 4200 + context.randomBetween(0, 1200),
            easing: "cubic-bezier(0.42, 0, 0.58, 1)",
            iterations: Infinity,
            fill: "both",
          },
        );
      }
    },
  });
}
