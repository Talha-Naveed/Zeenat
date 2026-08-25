import { ZeenatError } from "../shared/errors";
import type { ZeenatLayer } from "../shared/types";

export interface EffectPlacementOptions {
  readonly layer?: ZeenatLayer;
  readonly order?: number;
}

export function requireColors(
  effectName: string,
  colors: readonly string[],
): readonly string[] {
  if (
    colors.length === 0 ||
    colors.some((color) => !isSupportedColorSyntax(color.trim()))
  ) {
    throw new ZeenatError(`${effectName} requires at least one valid color.`);
  }
  return Object.freeze([...colors]);
}

function isSupportedColorSyntax(color: string): boolean {
  if (color === "") return false;
  if (/^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(color)) return true;
  if (/^[a-z][\w-]*$/i.test(color)) return true;
  return /^(?:rgb|hsl|hwb|lab|lch|oklab|oklch|color|color-mix|var)\([^;{}]+\)$/i.test(
    color,
  );
}

export function colorAt(colors: readonly string[], index: number): string {
  return colors[index % colors.length] ?? colors[0] ?? "currentColor";
}
