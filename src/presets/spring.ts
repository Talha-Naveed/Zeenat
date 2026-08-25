import { definePreset } from "../core/definitions";
import { petals, type PetalsOptions } from "../effects/petals";
import { sparkles, type SparklesOptions } from "../effects/sparkles";

export interface SpringPresetOptions {
  readonly petals?: PetalsOptions | false;
  readonly accents?: SparklesOptions | false;
}

export function createSpringPreset(options: SpringPresetOptions = {}) {
  return definePreset({
    id: "spring",
    name: "Spring",
    description: "Soft drifting petals and fresh, low-density color accents.",
    tags: ["season", "spring", "petals"],
    season: "spring",
    author: "Zeenat.js contributors",
    effects: [
      ...(options.petals === false
        ? []
        : [
            petals({
              colors: ["#f9a8d4", "#fecdd3", "#fdf2f8", "#bbf7d0"],
              count: 21,
              ...options.petals,
            }),
          ]),
      ...(options.accents === false
        ? []
        : [
            sparkles({
              colors: ["#f472b6", "#86efac", "#fbcfe8"],
              count: 10,
              shape: "diamond",
              opacity: 0.28,
              ...options.accents,
            }),
          ]),
    ],
  });
}

export const spring = createSpringPreset();
