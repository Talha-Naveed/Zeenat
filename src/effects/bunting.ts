import { defineEffect } from "../core/definitions";
import { applyStyles, createSvgElement } from "../shared/dom";
import { scaleEffectCount } from "../shared/intensity";
import type { ZeenatEffect } from "../shared/types";
import { colorAt, requireColors, type EffectPlacementOptions } from "./utils";

export interface BuntingOptions extends EffectPlacementOptions {
  readonly colors: readonly string[];
  readonly count?: number;
  readonly position?: "top" | "bottom";
  readonly height?: number;
  readonly shape?: "pennant" | "swallowtail";
  readonly cableColor?: string;
}

export function bunting(options: BuntingOptions): ZeenatEffect {
  const colors = requireColors("bunting", options.colors);

  return defineEffect({
    id: "bunting",
    layer: options.layer ?? "top",
    ...(options.order === undefined ? {} : { order: options.order }),
    mount(context) {
      const document = context.layer.ownerDocument;
      const svg = createSvgElement(document, "svg");
      const position = options.position ?? "top";
      const height = options.height ?? (context.viewport.isSmall ? 74 : 108);
      const count = scaleEffectCount(
        options.count ?? 14,
        context.intensity,
        context.viewport,
        "full",
        6,
      );

      svg.setAttribute("viewBox", "0 0 1000 120");
      svg.setAttribute("preserveAspectRatio", "none");
      svg.setAttribute("focusable", "false");
      applyStyles(svg, {
        position: "absolute",
        left: "0",
        width: "100%",
        height: `${height}px`,
        top: position === "top" ? "0" : "auto",
        bottom: position === "bottom" ? "0" : "auto",
        overflow: "visible",
      });

      const cable = createSvgElement(document, "path");
      cable.setAttribute("d", "M -10 12 Q 500 66 1010 12");
      cable.setAttribute("fill", "none");
      cable.setAttribute(
        "stroke",
        options.cableColor ?? "rgba(30, 35, 40, 0.68)",
      );
      cable.setAttribute("stroke-width", "2");
      cable.setAttribute("vector-effect", "non-scaling-stroke");
      svg.append(cable);

      const spacing = 920 / Math.max(1, count - 1);
      const flagWidth = Math.min(72, spacing * 0.74);
      for (let index = 0; index < count; index += 1) {
        const progress = count === 1 ? 0.5 : index / (count - 1);
        const x = 40 + index * spacing;
        const y = 12 + 54 * 4 * progress * (1 - progress);
        const flag = createSvgElement(document, "path");
        const halfWidth = flagWidth / 2;
        const tipY = y + (context.viewport.isSmall ? 35 : 44);
        const path =
          options.shape === "swallowtail"
            ? `M ${x - halfWidth} ${y} L ${x + halfWidth} ${y} L ${x + halfWidth * 0.82} ${tipY} L ${x} ${tipY - 9} L ${x - halfWidth * 0.82} ${tipY} Z`
            : `M ${x - halfWidth} ${y} L ${x + halfWidth} ${y} L ${x} ${tipY} Z`;
        flag.setAttribute("d", path);
        flag.setAttribute("fill", colorAt(colors, index));
        flag.setAttribute("stroke", "rgba(0, 0, 0, 0.08)");
        flag.setAttribute("stroke-width", "0.8");
        flag.style.transformBox = "fill-box";
        flag.style.transformOrigin = "50% 0%";
        svg.append(flag);

        if (context.motion === "full") {
          context.animate(
            flag,
            [
              { transform: "rotate(-1.4deg) scaleX(0.98)" },
              { transform: "rotate(1.4deg) scaleX(1)" },
            ],
            {
              duration: context.randomBetween(2200, 3400),
              delay: context.randomBetween(-1800, 0),
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
