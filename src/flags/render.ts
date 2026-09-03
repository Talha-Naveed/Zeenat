import type { BuntingFlagRenderContext } from "../effects/bunting";

export type FlagNode = readonly [
  string,
  Readonly<Record<string, string>>,
  readonly FlagNode[],
];

/** Render trusted, build-validated geometry without innerHTML, images or CSP exceptions. */
export function renderFlag(
  node: FlagNode,
  context: BuntingFlagRenderContext,
): void {
  const prefix = `${context.container.id}-`;
  const create = ([tag, attributes, children]: FlagNode): SVGElement => {
    const element = context.document.createElementNS(
      "http://www.w3.org/2000/svg",
      tag,
    );
    for (const [name, value] of Object.entries(attributes)) {
      if (name === "xmlns" || name.startsWith("xmlns:")) continue;
      const local =
        name === "id"
          ? `${prefix}${value}`
          : name.endsWith("href") && value.startsWith("#")
            ? `#${prefix}${value.slice(1)}`
            : value.replace(/url\(#([^)]+)\)/g, `url(#${prefix}$1)`);
      if (name === "xlink:href")
        element.setAttributeNS(
          "http://www.w3.org/1999/xlink",
          "xlink:href",
          local,
        );
      else element.setAttribute(name, local);
    }
    for (const child of children) element.append(create(child));
    return element;
  };
  const artwork = create(node);
  artwork.setAttribute("width", String(context.width));
  artwork.setAttribute("height", String(context.height));
  artwork.setAttribute("preserveAspectRatio", "xMidYMid meet");
  context.container.append(artwork);
}
