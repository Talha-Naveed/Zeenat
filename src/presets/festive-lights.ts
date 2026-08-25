import { definePreset } from "../core/definitions";
import { lanterns, type LanternsOptions } from "../effects/lanterns";
import { sparkles, type SparklesOptions } from "../effects/sparkles";
import {
  stringLights,
  type StringLightsOptions,
} from "../effects/string-lights";

export interface FestiveLightsPresetOptions {
  readonly lights?: StringLightsOptions | false;
  readonly lanterns?: LanternsOptions | false;
  readonly accents?: SparklesOptions | false;
}

export function createFestiveLightsPreset(
  options: FestiveLightsPresetOptions = {},
) {
  return definePreset({
    id: "festive-lights",
    name: "Festive Lights",
    description:
      "Warm string lights, neutral lantern forms, and subtle gold accents.",
    tags: ["celebration", "lights", "lanterns"],
    occasion: "General celebration",
    author: "Zeenat.js contributors",
    effects: [
      ...(options.accents === false
        ? []
        : [
            sparkles({
              colors: ["#fbbf24", "#fde68a", "#fff7ed"],
              count: 11,
              shape: "circle",
              opacity: 0.32,
              ...options.accents,
            }),
          ]),
      ...(options.lanterns === false
        ? []
        : [
            lanterns({
              colors: ["#d97706", "#b91c1c", "#f59e0b"],
              count: 5,
              ...options.lanterns,
            }),
          ]),
      ...(options.lights === false
        ? []
        : [
            stringLights({
              colors: ["#fbbf24", "#fef3c7", "#fb7185"],
              count: 18,
              ...options.lights,
            }),
          ]),
    ],
  });
}

export const festiveLights = createFestiveLightsPreset();
