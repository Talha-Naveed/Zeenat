import { createSvgElement } from "../shared/dom";
import type { BuntingFlagDesign, BuntingFlagRenderContext } from "./bunting";

const PAKISTAN_GREEN = "#01411c";
const FLAG_WHITE = "#ffffff";
const US_RED = "#b22234";
const US_BLUE = "#3c3b6e";

export const pakistanFlag: BuntingFlagDesign = Object.freeze({
  id: "pakistan",
  aspectRatio: 1.5,
  render(context: BuntingFlagRenderContext) {
    appendRect(context, 0, 0, context.width, context.height, PAKISTAN_GREEN);
    appendRect(context, 0, 0, context.width * 0.25, context.height, FLAG_WHITE);
    appendCircle(context, 0.94, 0.48, 0.245, FLAG_WHITE);
    appendCircle(context, 1.045, 0.395, 0.215, PAKISTAN_GREEN);
    appendPath(
      context,
      createStarPath(1.135, 0.285, 0.09, 0.038, -18),
      FLAG_WHITE,
    );
    appendOutline(context);
  },
});

export const unitedStatesFlag: BuntingFlagDesign = Object.freeze({
  id: "united-states",
  aspectRatio: 1.9,
  render(context: BuntingFlagRenderContext) {
    appendRect(context, 0, 0, context.width, context.height, FLAG_WHITE);
    const stripeHeight = context.height / 13;
    for (let stripe = 0; stripe < 13; stripe += 2) {
      appendRect(
        context,
        0,
        stripe * stripeHeight,
        context.width,
        stripeHeight,
        US_RED,
      );
    }

    const cantonWidth = 0.76;
    const cantonHeight = stripeHeight * 7;
    appendRect(context, 0, 0, cantonWidth, cantonHeight, US_BLUE);
    const stars: string[] = [];
    for (let row = 0; row < 9; row += 1) {
      const count = row % 2 === 0 ? 6 : 5;
      const inset = row % 2 === 0 ? 0.055 : 0.115;
      for (let column = 0; column < count; column += 1) {
        const x =
          inset + column * ((cantonWidth - inset * 2) / Math.max(1, count - 1));
        const y = ((row + 1) * cantonHeight) / 10;
        stars.push(createStarPath(x, y, 0.018, 0.0075));
      }
    }
    appendPath(context, stars.join(" "), FLAG_WHITE);
    appendOutline(context);
  },
});

function appendRect(
  context: BuntingFlagRenderContext,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
): void {
  const rect = createSvgElement(context.document, "rect");
  rect.setAttribute("x", String(x));
  rect.setAttribute("y", String(y));
  rect.setAttribute("width", String(width));
  rect.setAttribute("height", String(height));
  rect.setAttribute("fill", fill);
  context.container.append(rect);
}

function appendCircle(
  context: BuntingFlagRenderContext,
  cx: number,
  cy: number,
  radius: number,
  fill: string,
): void {
  const circle = createSvgElement(context.document, "circle");
  circle.setAttribute("cx", String(cx));
  circle.setAttribute("cy", String(cy));
  circle.setAttribute("r", String(radius));
  circle.setAttribute("fill", fill);
  context.container.append(circle);
}

function appendPath(
  context: BuntingFlagRenderContext,
  data: string,
  fill: string,
): void {
  const path = createSvgElement(context.document, "path");
  path.setAttribute("d", data);
  path.setAttribute("fill", fill);
  context.container.append(path);
}

function appendOutline(context: BuntingFlagRenderContext): void {
  const outline = createSvgElement(context.document, "rect");
  outline.setAttribute("x", "0.008");
  outline.setAttribute("y", "0.008");
  outline.setAttribute("width", String(context.width - 0.016));
  outline.setAttribute("height", String(context.height - 0.016));
  outline.setAttribute("fill", "none");
  outline.setAttribute("stroke", "rgba(0, 0, 0, 0.16)");
  outline.setAttribute("stroke-width", "0.016");
  context.container.append(outline);
}

function createStarPath(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  rotation = -90,
): string {
  const points: string[] = [];
  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = (rotation + index * 36) * (Math.PI / 180);
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    points.push(`${index === 0 ? "M" : "L"} ${x} ${y}`);
  }
  return `${points.join(" ")} Z`;
}
