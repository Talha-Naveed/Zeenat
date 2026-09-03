import { definePreset } from "../core/definitions";
import {
  bunting,
  pakistanFlag,
  type FlagOrientation,
} from "../effects/bunting";
import { fireworks } from "../effects/fireworks";
import { sparkles } from "../effects/sparkles";

export function createPakistanIndependenceDayPreset(
  options: { readonly orientation?: FlagOrientation } = {},
) {
  return definePreset({
    id: "pakistan-independence-day",
    name: "Pakistan Independence Day",
    description:
      "Pakistani flag bunting with restrained green and white celebration accents.",
    tags: ["national-day", "pakistan", "independence-day", "flag-bunting"],
    region: "PK",
    occasion: "Independence Day",
    author: "Zeenat.js contributors",
    effects: [
      sparkles({
        colors: ["#01411c", "#ffffff"],
        count: 18,
        shape: "star",
        opacity: 0.4,
        maxY: 0.8,
      }),
      fireworks({
        colors: ["#01411c", "#ffffff"],
        count: 2,
        maxY: 0.46,
        particlesPerBurst: 8,
      }),
      bunting({
        flags: [pakistanFlag],
        orientation: options.orientation ?? "horizontal",
        count: 14,
        position: "top",
      }),
    ],
  });
}
export const pakistanIndependenceDay = createPakistanIndependenceDayPreset();
