import { defineEffect } from "../core/definitions";
import { applyStyles, createSvgElement } from "../shared/dom";
import { ZeenatError } from "../shared/errors";
import { scaleEffectCount } from "../shared/intensity";
import type { ViewportSnapshot, ZeenatEffect } from "../shared/types";
import { colorAt, requireColors, type EffectPlacementOptions } from "./utils";

export interface BuntingFlagRenderContext {
  readonly document: Document;
  readonly container: SVGSymbolElement;
  readonly width: number;
  readonly height: number;
  /** Aborted when the owning effect is removed, resized across a breakpoint, or restarted. */
  readonly signal: AbortSignal;
}

/**
 * A normalized, reusable flag design. Artwork is drawn into a `0 0 width 1`
 * SVG symbol once and reused by every flag on the cord.
 */
export interface BuntingFlagDesign {
  readonly id: string;
  readonly aspectRatio: number;
  render(context: BuntingFlagRenderContext): void | Promise<void>;
}

export type FlagOrientation = "horizontal" | "vertical";

interface BuntingBaseOptions extends EffectPlacementOptions {
  readonly count?: number;
  readonly position?: "top" | "bottom";
  readonly height?: number;
  readonly cableColor?: string;
}

export interface PennantBuntingOptions extends BuntingBaseOptions {
  /** Solid colors used by the decorative pennant mode. */
  readonly colors: readonly string[];
  readonly flags?: never;
  readonly shape?: "pennant" | "swallowtail";
}

export interface FlagBuntingOptions extends BuntingBaseOptions {
  /** Flag artwork used by the country-flag mode. */
  readonly flags: readonly BuntingFlagDesign[];
  /** Vertical rotates the complete artwork 90° clockwise; it never stretches it. */
  readonly orientation?: FlagOrientation;
  readonly colors?: never;
  readonly shape?: never;
}

export type BuntingOptions = PennantBuntingOptions | FlagBuntingOptions;

interface CablePoint {
  readonly x: number;
  readonly y: number;
  readonly angle: number;
}

interface BuntingItem {
  readonly anchor: SVGGElement;
  readonly artwork: SVGPathElement | SVGUseElement;
  readonly flag?: BuntingFlagDesign;
}

const CABLE_START_Y = 12;
const CABLE_CONTROL_Y = 66;
const CABLE_LOWEST_Y = (CABLE_START_Y + CABLE_CONTROL_Y) / 2;
const CABLE_EDGE_OVERFLOW = 10;
const ITEM_EDGE_PADDING = 28;
const FLAG_OVERLAP = 1.25;
let nextSymbolId = 0;

export function bunting(options: BuntingOptions): ZeenatEffect {
  const orientation =
    "orientation" in options
      ? (options.orientation ?? "horizontal")
      : "horizontal";
  if (orientation !== "horizontal" && orientation !== "vertical") {
    throw new ZeenatError(
      'bunting orientation must be "horizontal" or "vertical".',
    );
  }
  const flags = normalizeFlags(options.flags);
  const colors = flags
    ? undefined
    : requireColors("bunting", options.colors ?? []);

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

      svg.setAttribute("preserveAspectRatio", "none");
      svg.setAttribute("focusable", "false");
      svg.dataset.zeenatBuntingKind = flags ? "flags" : "pennants";
      if (flags) svg.dataset.zeenatFlagOrientation = orientation;
      applyStyles(svg, {
        position: "absolute",
        left: "0",
        width: "100%",
        height: `${height}px`,
        top: position === "top" ? "var(--zeenat-navbar-bottom, 0px)" : "auto",
        bottom: position === "bottom" ? "0" : "auto",
        overflow: "visible",
      });

      const symbols = flags
        ? createFlagSymbols(document, svg, flags, context.signal)
        : [];
      const cable = createSvgElement(document, "path");
      cable.dataset.zeenatBuntingCable = "";
      cable.setAttribute("fill", "none");
      cable.setAttribute(
        "stroke",
        options.cableColor ?? "rgba(30, 35, 40, 0.68)",
      );
      cable.setAttribute("stroke-width", "2");
      cable.setAttribute("stroke-linecap", "round");
      cable.setAttribute("vector-effect", "non-scaling-stroke");
      svg.append(cable);

      const items: BuntingItem[] = [];
      for (let index = 0; index < count; index += 1) {
        const anchor = createSvgElement(document, "g");
        anchor.dataset.zeenatBuntingAnchor = String(index);
        const sway = createSvgElement(document, "g");
        sway.style.transformBox = "fill-box";
        sway.style.transformOrigin = "50% 0%";
        anchor.append(sway);

        const flag = flags?.[index % flags.length];
        const artwork = flag
          ? createFlagUse(document, symbols[index % symbols.length]!, flag)
          : createSvgElement(document, "path");
        sway.append(artwork);
        svg.append(anchor);
        items.push({ anchor, artwork, ...(flag ? { flag } : {}) });

        if (context.motion === "full") {
          context.animate(
            sway,
            [
              { transform: "rotate(-1.4deg) scaleX(0.985)" },
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

      const layout = (viewport: ViewportSnapshot) => {
        const width = Math.max(1, viewport.width);
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        cable.setAttribute(
          "d",
          `M ${-CABLE_EDGE_OVERFLOW} ${CABLE_START_Y} Q ${width / 2} ${CABLE_CONTROL_Y} ${width + CABLE_EDGE_OVERFLOW} ${CABLE_START_Y}`,
        );

        const usableWidth = Math.max(0, width - ITEM_EDGE_PADDING * 2);
        const spacing = usableWidth / Math.max(1, count - 1);
        const maxItemWidth = viewport.isSmall ? 46 : 76;
        const itemWidth = Math.max(18, Math.min(maxItemWidth, spacing * 0.86));

        items.forEach((item, index) => {
          const progress = count === 1 ? 0.5 : index / (count - 1);
          const x = ITEM_EDGE_PADDING + progress * usableWidth;
          const point = pointOnCable(x, width);
          item.anchor.setAttribute(
            "transform",
            `translate(${point.x} ${point.y}) rotate(${point.angle})`,
          );
          item.anchor.dataset.zeenatAnchorX = point.x.toFixed(3);
          item.anchor.dataset.zeenatAnchorY = point.y.toFixed(3);

          if (item.flag) {
            const vertical = orientation === "vertical";
            const ratio = vertical
              ? 1 / item.flag.aspectRatio
              : item.flag.aspectRatio;
            // Fit portrait flags into the same decoration band on small screens.
            const displayedWidth = Math.min(
              itemWidth,
              Math.max(12, height - CABLE_LOWEST_Y - 8) * ratio,
            );
            const displayedHeight = displayedWidth / ratio;
            item.artwork.setAttribute(
              "x",
              vertical ? "0" : String(-displayedWidth / 2),
            );
            item.artwork.setAttribute(
              "y",
              vertical ? "0" : String(-FLAG_OVERLAP),
            );
            item.artwork.setAttribute(
              "width",
              String(vertical ? displayedHeight : displayedWidth),
            );
            item.artwork.setAttribute(
              "height",
              String(vertical ? displayedWidth : displayedHeight),
            );
            item.artwork.setAttribute(
              "transform",
              vertical
                ? `translate(${displayedWidth / 2} ${-FLAG_OVERLAP}) rotate(90)`
                : "translate(0 0)",
            );
          } else {
            const halfWidth = itemWidth / 2;
            const tipY = viewport.isSmall ? 35 : 44;
            const path =
              options.shape === "swallowtail"
                ? `M ${-halfWidth} ${-FLAG_OVERLAP} L ${halfWidth} ${-FLAG_OVERLAP} L ${halfWidth * 0.82} ${tipY} L 0 ${tipY - 9} L ${-halfWidth * 0.82} ${tipY} Z`
                : `M ${-halfWidth} ${-FLAG_OVERLAP} L ${halfWidth} ${-FLAG_OVERLAP} L 0 ${tipY} Z`;
            item.artwork.setAttribute("d", path);
          }
        });
      };

      if (colors) {
        items.forEach((item, index) => {
          item.artwork.setAttribute("fill", colorAt(colors, index));
          item.artwork.setAttribute("stroke", "rgba(0, 0, 0, 0.08)");
          item.artwork.setAttribute("stroke-width", "0.8");
        });
      }

      layout(context.viewport);
      context.onResize(layout);
      context.layer.append(svg);
    },
  });
}

function normalizeFlags(
  input: readonly BuntingFlagDesign[] | undefined,
): readonly BuntingFlagDesign[] | undefined {
  if (input === undefined) return undefined;
  if (input.length === 0) {
    throw new ZeenatError("bunting flags must contain at least one design.");
  }
  for (const flag of input) {
    if (
      flag.id.trim() === "" ||
      !Number.isFinite(flag.aspectRatio) ||
      flag.aspectRatio <= 0 ||
      typeof flag.render !== "function"
    ) {
      throw new ZeenatError("bunting received an invalid flag design.");
    }
  }
  return Object.freeze([...input]);
}

function createFlagSymbols(
  document: Document,
  svg: SVGSVGElement,
  flags: readonly BuntingFlagDesign[],
  signal: AbortSignal,
): readonly string[] {
  const definitions = createSvgElement(document, "defs");
  const ids = flags.map((flag) => {
    const symbol = createSvgElement(document, "symbol");
    const id = createUniqueSymbolId(document, flag.id);
    symbol.id = id;
    symbol.setAttribute("viewBox", `0 0 ${flag.aspectRatio} 1`);
    symbol.setAttribute("preserveAspectRatio", "none");
    const rendering = flag.render({
      document,
      container: symbol,
      width: flag.aspectRatio,
      height: 1,
      signal,
    });
    if (rendering) {
      symbol.dataset.zeenatFlagStatus = "loading";
      void rendering.then(
        () => {
          if (!signal.aborted) symbol.dataset.zeenatFlagStatus = "ready";
        },
        (error: unknown) => {
          if (signal.aborted) return;
          symbol.dataset.zeenatFlagStatus = "failed";
          // Fail only this optional artwork, never the host page or other effects.
          console.error(`Zeenat: flag "${flag.id}" could not load.`, error);
        },
      );
    } else {
      symbol.dataset.zeenatFlagStatus = "ready";
    }
    definitions.append(symbol);
    return id;
  });
  svg.append(definitions);
  return ids;
}

function createFlagUse(
  document: Document,
  symbolId: string,
  flag: BuntingFlagDesign,
): SVGUseElement {
  const use = createSvgElement(document, "use");
  use.setAttribute("href", `#${symbolId}`);
  use.setAttribute("preserveAspectRatio", "none");
  use.dataset.zeenatFlag = flag.id;
  return use;
}

function createUniqueSymbolId(document: Document, flagId: string): string {
  const safeId = flagId.toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
  nextSymbolId += 1;
  let candidate = `zeenat-bunting-${safeId}-${nextSymbolId}`;
  while (document.getElementById(candidate)) {
    nextSymbolId += 1;
    candidate = `zeenat-bunting-${safeId}-${nextSymbolId}`;
  }
  return candidate;
}

function pointOnCable(x: number, viewportWidth: number): CablePoint {
  const startX = -CABLE_EDGE_OVERFLOW;
  const controlX = viewportWidth / 2;
  const endX = viewportWidth + CABLE_EDGE_OVERFLOW;
  const t = Math.max(0, Math.min(1, (x - startX) / (endX - startX)));
  const inverse = 1 - t;
  const cableX =
    inverse * inverse * startX + 2 * inverse * t * controlX + t * t * endX;
  const cableY =
    inverse * inverse * CABLE_START_Y +
    2 * inverse * t * CABLE_CONTROL_Y +
    t * t * CABLE_START_Y;
  const dx = 2 * inverse * (controlX - startX) + 2 * t * (endX - controlX);
  const dy =
    2 * inverse * (CABLE_CONTROL_Y - CABLE_START_Y) +
    2 * t * (CABLE_START_Y - CABLE_CONTROL_Y);

  return {
    x: cableX,
    y: cableY,
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
  };
}

export { pakistanFlag, unitedStatesFlag } from "./bunting-flags";
