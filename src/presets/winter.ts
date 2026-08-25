import { definePreset } from "../core/definitions";
import { snow, type SnowOptions } from "../effects/snow";
import { sparkles, type SparklesOptions } from "../effects/sparkles";
import {
  stringLights,
  type StringLightsOptions,
} from "../effects/string-lights";

export interface WinterPresetOptions {
  readonly snow?: SnowOptions | false;
  readonly lights?: StringLightsOptions | false;
  readonly sparkles?: SparklesOptions | false;
}

export function createWinterPreset(options: WinterPresetOptions = {}) {
  return definePreset({
    id: "winter",
    name: "Winter",
    description:
      "A quiet snowfall with cool accents and a warm line of lights.",
    tags: ["season", "winter", "snow", "lights"],
    season: "winter",
    author: "Zeenat.js contributors",
    effects: [
      ...(options.snow === false
        ? []
        : [
            snow({
              colors: ["#ffffff", "#dbeafe"],
              count: 32,
              ...options.snow,
            }),
          ]),
      ...(options.sparkles === false
        ? []
        : [
            sparkles({
              colors: ["#bfdbfe", "#ffffff", "#e0f2fe"],
              count: 13,
              shape: "circle",
              opacity: 0.36,
              maxY: 0.82,
              ...options.sparkles,
            }),
          ]),
      ...(options.lights === false
        ? []
        : [
            stringLights({
              colors: ["#fef3c7", "#bfdbfe", "#ffffff"],
              count: 15,
              ...options.lights,
            }),
          ]),
    ],
  });
}

export const winter = createWinterPreset();
