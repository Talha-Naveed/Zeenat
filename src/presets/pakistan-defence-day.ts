import { definePreset } from "../core/definitions";
import { aircraft } from "../effects/aircraft";
import { bunting } from "../effects/bunting";
import { sparkles } from "../effects/sparkles";

export const pakistanDefenceDay = definePreset({
  id: "pakistan-defence-day",
  name: "Pakistan Defence Day",
  description:
    "Green and white bunting, subtle accents, and a restrained aircraft flyover.",
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
      direction: "ltr",
      altitude: [0.16, 0.4],
    }),
    bunting({
      colors: ["#01411c", "#ffffff"],
      count: 14,
      position: "top",
      shape: "pennant",
    }),
  ],
});
