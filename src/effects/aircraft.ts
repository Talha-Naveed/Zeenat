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
        wrapper.dataset.zeenatAircraft = "fighter-jet";
        wrapper.dataset.zeenatDirection = direction;
        const size = context.viewport.isSmall ? 54 : 76;
        applyStyles(wrapper, {
          position: "absolute",
          left: "0",
          top: `${context.randomBetween(altitude[0], altitude[1]) * 100}%`,
          width: `${size}px`,
          height: `${size * (2 / 3)}px`,
          opacity: "0",
          willChange: "transform, opacity",
        });

        const svg = createSvgElement(document, "svg");
        svg.setAttribute("viewBox", "0 0 120 80");
        svg.setAttribute("focusable", "false");
        applyStyles(svg, {
          display: "block",
          width: "100%",
          height: "100%",
        });
        // Original top-view fighter geometry points right. Mirror the artwork,
        // not the animated travel wrapper, so the nose always leads the flight.
        const airframe = createSvgElement(document, "g");
        airframe.dataset.zeenatAirframe = "";
        airframe.setAttribute(
          "transform",
          direction === "rtl"
            ? "translate(120 0) scale(-1 1)"
            : "translate(0 0)",
        );
        svg.append(airframe);

        const silhouette = createSvgElement(document, "path");
        silhouette.setAttribute(
          "d",
          "M118 40 C104 36 93 35 82 35 L67 33 L38 5 L25 5 L44 34 L23 33 L13 18 L5 18 L11 37 L5 40 L11 43 L5 62 L13 62 L23 47 L44 46 L25 75 L38 75 L67 47 L82 45 C93 45 104 44 118 40 Z",
        );
        silhouette.setAttribute("fill", colorAt(colors, index));
        silhouette.setAttribute("stroke", "rgba(0,0,0,0.2)");
        silhouette.setAttribute("stroke-width", "1");
        silhouette.setAttribute("stroke-linejoin", "round");
        airframe.append(silhouette);

        const accent = createSvgElement(document, "path");
        accent.setAttribute(
          "d",
          "M18 39 L80 38 L94 40 L80 42 L18 41 Z M34 12 L59 34 L55 34 Z M34 68 L59 46 L55 46 Z",
        );
        accent.setAttribute("fill", colorAt(colors, index + 1));
        accent.setAttribute("opacity", "0.55");
        airframe.append(accent);
        const canopy = createSvgElement(document, "path");
        canopy.setAttribute(
          "d",
          "M78 40 C82 34 94 36 101 40 C94 44 82 46 78 40 Z",
        );
        canopy.setAttribute("fill", "#243c4a");
        canopy.setAttribute("stroke", "rgba(255,255,255,0.45)");
        canopy.setAttribute("stroke-width", "0.6");
        airframe.append(canopy);
        wrapper.append(svg);
        context.layer.append(wrapper);

        const keyframes = (viewportWidth: number): Keyframe[] => {
          const travel = viewportWidth + size * 2;
          const fromX = direction === "ltr" ? -size * 1.5 : travel - size * 0.5;
          const toX = direction === "ltr" ? travel - size * 0.5 : -size * 1.5;
          return [
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
          ];
        };
        const animation = context.animate(
          wrapper,
          keyframes(context.viewport.width),
          {
            duration: context.randomBetween(10_000, 14_000),
            delay: 1800 + index * 4200 + context.randomBetween(0, 1200),
            easing: "cubic-bezier(0.42, 0, 0.58, 1)",
            iterations: Infinity,
            fill: "both",
          },
        );
        context.onResize((viewport) => {
          (animation?.effect as KeyframeEffect | null)?.setKeyframes(
            keyframes(viewport.width),
          );
        });
      }
    },
  });
}
