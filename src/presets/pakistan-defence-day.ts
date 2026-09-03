import { definePreset } from "../core/definitions";
import { aircraft } from "../effects/aircraft";
import {
  bunting,
  pakistanFlag,
  type FlagOrientation,
} from "../effects/bunting";
import { sparkles } from "../effects/sparkles";

export function createPakistanDefenceDayPreset(
  options: { readonly orientation?: FlagOrientation } = {},
) {
  return definePreset({
    id: "pakistan-defence-day",
    name: "Pakistan Defence Day",
    description:
      "Pakistani flag bunting, subtle accents, and a right-to-left fighter-jet flyover.",
    tags: ["national-day", "pakistan", "bunting", "flyover"],
    region: "PK",
    occasion: "Defence Day",
    author: "Zeenat.js contributors",
    effects: [
      sparkles({
        colors: ["#01411c", "#ffffff"],
        count: 20,
        shape: "diamond",
        opacity: 0.42,
      }),
      aircraft({
        colors: ["#315f4b", "#f4f7f5"],
        count: 2,
        direction: "rtl",
        altitude: [0.16, 0.4],
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
export const pakistanDefenceDay = createPakistanDefenceDayPreset();
