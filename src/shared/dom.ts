import type { ViewportSnapshot } from "./types";

export const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export function applyStyles(
  element: HTMLElement | SVGElement,
  styles: Partial<CSSStyleDeclaration>,
): void {
  Object.assign(element.style, styles);
}

export function createSvgElement<K extends keyof SVGElementTagNameMap>(
  document: Document,
  name: K,
): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NAMESPACE, name);
}

export function readViewport(document: Document): ViewportSnapshot {
  const view = document.defaultView;
  const width = Math.max(
    1,
    view?.innerWidth ?? document.documentElement.clientWidth ?? 1,
  );
  const height = Math.max(
    1,
    view?.innerHeight ?? document.documentElement.clientHeight ?? 1,
  );

  return {
    width,
    height,
    dpr: Math.min(2, Math.max(1, view?.devicePixelRatio ?? 1)),
    isSmall: width < 640,
  };
}
