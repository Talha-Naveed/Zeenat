import { definePreset } from "../core/definitions";
import {
  fallingLeaves,
  type FallingLeavesOptions,
} from "../effects/falling-leaves";
import { sparkles, type SparklesOptions } from "../effects/sparkles";

export interface AutumnPresetOptions {
  readonly leaves?: FallingLeavesOptions | false;
  readonly accents?: SparklesOptions | false;
}

export function createAutumnPreset(options: AutumnPresetOptions = {}) {
  return definePreset({
    id: "autumn",
    name: "Autumn",
    description: "Slowly drifting leaves with restrained amber accents.",
    tags: ["season", "autumn", "leaves"],
    season: "autumn",
    author: "Zeenat.js contributors",
    effects: [
      ...(options.leaves === false
        ? []
        : [
            fallingLeaves({
              colors: ["#b45309", "#d97706", "#92400e", "#a16207"],
              count: 20,
              ...options.leaves,
            }),
          ]),
      ...(options.accents === false
        ? []
        : [
            sparkles({
              colors: ["#f59e0b", "#fcd34d", "#a16207"],
              count: 9,
              shape: "circle",
              opacity: 0.25,
              ...options.accents,
            }),
          ]),
    ],
  });
}

export const autumn = createAutumnPreset();
