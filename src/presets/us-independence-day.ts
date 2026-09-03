import { definePreset } from "../core/definitions";
import {
  bunting,
  unitedStatesFlag,
  type FlagOrientation,
} from "../effects/bunting";
import { fireworks } from "../effects/fireworks";
import { sparkles } from "../effects/sparkles";

export function createUsIndependenceDayPreset(
  options: { readonly orientation?: FlagOrientation } = {},
) {
  return definePreset({
    id: "us-independence-day",
    name: "US Independence Day",
    description:
      "American flag bunting with star accents and modest fireworks.",
    tags: ["national-day", "united-states", "bunting", "fireworks"],
    region: "US",
    occasion: "Independence Day",
    author: "Zeenat.js contributors",
    effects: [
      sparkles({
        colors: ["#b22234", "#ffffff", "#3c3b6e"],
        count: 22,
        shape: "star",
        opacity: 0.46,
        maxY: 0.78,
      }),
      fireworks({
        colors: ["#b22234", "#f7f7f7", "#3c3b6e"],
        count: 3,
        maxY: 0.48,
        particlesPerBurst: 9,
      }),
      bunting({
        flags: [unitedStatesFlag],
        orientation: options.orientation ?? "horizontal",
        count: 16,
        position: "top",
        cableColor: "rgba(48, 51, 72, 0.66)",
      }),
    ],
  });
}
export const usIndependenceDay = createUsIndependenceDayPreset();
