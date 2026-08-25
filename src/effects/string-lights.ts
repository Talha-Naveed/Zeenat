import { defineEffect } from "../core/definitions";
import { applyStyles, createSvgElement } from "../shared/dom";
import { scaleEffectCount } from "../shared/intensity";
import type { ZeenatEffect } from "../shared/types";
import { colorAt, requireColors, type EffectPlacementOptions } from "./utils";

export interface StringLightsOptions extends EffectPlacementOptions {
  readonly colors?: readonly string[];
  readonly count?: number;
  /** Approximate bulb spacing in CSS pixels when count is omitted. */
  readonly spacing?: number;
  readonly position?: "top" | "bottom";
  readonly depth?: number;
  readonly twinkle?: boolean;
}

export function stringLights(options: StringLightsOptions = {}): ZeenatEffect {
  const colors = requireColors(
    "string-lights",
    options.colors ?? ["#fbbf24", "#fef3c7", "#f97316"],
  );
  return defineEffect({
    id: "string-lights",
    layer: options.layer ?? "top",
    ...(options.order === undefined ? {} : { order: options.order }),
    mount(context) {
      const document = context.layer.ownerDocument;
      const svg = createSvgElement(document, "svg");
      const position = options.position ?? "top";
      const depth = Math.max(
        28,
        options.depth ?? (context.viewport.isSmall ? 54 : 72),
      );
      const baseCount =
        options.count ??
        Math.max(
          6,
          Math.round(
            context.viewport.width / Math.max(30, options.spacing ?? 78),
          ),
        );
      const count = scaleEffectCount(
        baseCount,
        context.intensity,
        context.viewport,
        context.motion,
        8,
      );
      svg.setAttribute("viewBox", "0 0 1000 100");
      svg.setAttribute("preserveAspectRatio", "none");
      svg.setAttribute("focusable", "false");
      applyStyles(svg, {
        position: "absolute",
        left: "0",
        width: "100%",
        height: `${depth}px`,
        top: position === "top" ? "0" : "auto",
        bottom: position === "bottom" ? "0" : "auto",
        transform: position === "bottom" ? "scaleY(-1)" : "none",
        overflow: "visible",
      });
      const cable = createSvgElement(document, "path");
      cable.setAttribute("d", "M-10 8 Q500 72 1010 8");
      cable.setAttribute("fill", "none");
      cable.setAttribute("stroke", "rgba(35,35,30,.64)");
      cable.setAttribute("stroke-width", "2");
      cable.setAttribute("vector-effect", "non-scaling-stroke");
      svg.append(cable);
      for (let index = 0; index < count; index += 1) {
        const progress = count === 1 ? 0.5 : index / (count - 1);
        const x = 24 + progress * 952;
        const y = 8 + 64 * 4 * progress * (1 - progress);
        const stem = createSvgElement(document, "path");
        stem.setAttribute("d", `M${x} ${y} v7`);
        stem.setAttribute("stroke", "rgba(40,40,35,.65)");
        const bulb = createSvgElement(document, "circle");
        const color = colorAt(colors, index);
        bulb.setAttribute("cx", String(x));
        bulb.setAttribute("cy", String(y + 11));
        bulb.setAttribute("r", context.viewport.isSmall ? "4" : "5");
        bulb.setAttribute("fill", color);
        bulb.style.transformBox = "fill-box";
        bulb.style.transformOrigin = "center";
        bulb.style.filter = `drop-shadow(0 0 4px ${color})`;
        svg.append(stem, bulb);
        if (context.motion === "full" && (options.twinkle ?? true)) {
          context.animate(
            bulb,
            [
              { opacity: 0.38, transform: "scale(.82)" },
              { opacity: 1, transform: "scale(1.06)" },
            ],
            {
              duration: context.randomBetween(1500, 2700),
              delay: context.randomBetween(-2400, 0),
              direction: "alternate",
              easing: "ease-in-out",
              iterations: Infinity,
            },
          );
        }
      }
      context.layer.append(svg);
    },
  });
}
