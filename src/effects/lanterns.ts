import { defineEffect } from "../core/definitions";
import { applyStyles, createSvgElement } from "../shared/dom";
import { scaleEffectCount } from "../shared/intensity";
import type { ZeenatEffect } from "../shared/types";
import { colorAt, requireColors, type EffectPlacementOptions } from "./utils";

export interface LanternsOptions extends EffectPlacementOptions {
  readonly colors?: readonly string[];
  readonly count?: number;
  readonly position?: "top" | "sides";
  readonly glow?: boolean;
  readonly sway?: boolean;
}

export function lanterns(options: LanternsOptions = {}): ZeenatEffect {
  const colors = requireColors(
    "lanterns",
    options.colors ?? ["#f59e0b", "#dc2626"],
  );
  return defineEffect({
    id: "lanterns",
    layer: options.layer ?? "top",
    ...(options.order === undefined ? {} : { order: options.order }),
    mount(context) {
      const document = context.layer.ownerDocument;
      const count = scaleEffectCount(
        options.count ?? 7,
        context.intensity,
        context.viewport,
        context.motion,
        3,
      );
      const position = options.position ?? "top";
      for (let index = 0; index < count; index += 1) {
        const wrapper = document.createElement("span");
        const size = context.viewport.isSmall ? 30 : 38;
        const side = index % 2 === 0 ? "left" : "right";
        const horizontal =
          position === "sides"
            ? { [side]: `${3 + Math.floor(index / 2) * 2}%` }
            : { left: `${((index + 1) / (count + 1)) * 100}%` };
        applyStyles(wrapper, {
          position: "absolute",
          ...horizontal,
          top:
            position === "sides"
              ? `${8 + (index / Math.max(1, count - 1)) * 56}%`
              : "0",
          width: `${size}px`,
          height: `${size * 1.7}px`,
          transformOrigin: "50% 0",
          opacity: context.motion === "reduced" ? "0.6" : "0.78",
          willChange: context.motion === "full" ? "transform" : "auto",
        });
        const svg = createSvgElement(document, "svg");
        svg.setAttribute("viewBox", "0 0 40 68");
        svg.setAttribute("focusable", "false");
        applyStyles(svg, { width: "100%", height: "100%", display: "block" });
        const cord = createSvgElement(document, "path");
        cord.setAttribute("d", "M20 0 V15");
        cord.setAttribute("stroke", "rgba(30,30,30,.55)");
        cord.setAttribute("stroke-width", "1.5");
        const body = createSvgElement(document, "path");
        body.setAttribute("d", "M10 19 Q20 13 30 19 L34 48 Q20 57 6 48 Z");
        body.setAttribute("fill", colorAt(colors, index));
        body.setAttribute("stroke", "rgba(70,30,10,.28)");
        const ribs = createSvgElement(document, "path");
        ribs.setAttribute("d", "M10 24 H30 M8 42 H32 M20 16 V53");
        ribs.setAttribute("stroke", "rgba(255,255,255,.36)");
        ribs.setAttribute("fill", "none");
        const tassel = createSvgElement(document, "path");
        tassel.setAttribute("d", "M20 53 V65 M16 57 L20 65 L24 57");
        tassel.setAttribute("stroke", "rgba(95,48,12,.65)");
        tassel.setAttribute("fill", "none");
        svg.append(cord, body, ribs, tassel);
        if (options.glow ?? true) {
          applyStyles(svg, {
            filter: `drop-shadow(0 2px 7px ${colorAt(colors, index)})`,
          });
        }
        wrapper.append(svg);
        context.layer.append(wrapper);
        const centered = position === "top" ? "translateX(-50%) " : "";
        if (context.motion === "full" && (options.sway ?? true)) {
          context.animate(
            wrapper,
            [
              { transform: `${centered}rotate(-2.2deg)` },
              { transform: `${centered}rotate(2.2deg)` },
            ],
            {
              duration: context.randomBetween(2600, 3900),
              delay: context.randomBetween(-2500, 0),
              direction: "alternate",
              easing: "ease-in-out",
              iterations: Infinity,
            },
          );
        } else if (position === "top") {
          wrapper.style.transform = "translateX(-50%)";
        }
      }
    },
  });
}
