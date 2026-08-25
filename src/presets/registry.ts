import { definePreset } from "../core/definitions";
import { ZeenatError } from "../shared/errors";
import type {
  BuiltInPresetName,
  ZeenatPreset,
  ZeenatPresetInput,
} from "../shared/types";
import { pakistanDefenceDay } from "./pakistan-defence-day";
import { usIndependenceDay } from "./us-independence-day";
import { autumn } from "./autumn";
import { festiveLights } from "./festive-lights";
import { spring } from "./spring";
import { winter } from "./winter";

export const builtInPresets: Readonly<
  Record<BuiltInPresetName, ZeenatPreset<BuiltInPresetName>>
> = Object.freeze({
  "pakistan-defence-day": pakistanDefenceDay,
  "us-independence-day": usIndependenceDay,
  winter,
  autumn,
  spring,
  "festive-lights": festiveLights,
});

export function resolvePreset(input: ZeenatPresetInput): ZeenatPreset {
  if (typeof input === "string") {
    const preset = (builtInPresets as Readonly<Record<string, ZeenatPreset>>)[
      input
    ];
    if (!preset) {
      throw new ZeenatError(
        `Unknown Zeenat preset "${input}". Available presets: ${Object.keys(
          builtInPresets,
        ).join(", ")}.`,
      );
    }
    return preset;
  }

  return definePreset({
    id: input.id,
    name: input.name,
    ...(input.description === undefined
      ? {}
      : { description: input.description }),
    ...(input.tags === undefined ? {} : { tags: input.tags }),
    ...(input.region === undefined ? {} : { region: input.region }),
    ...(input.occasion === undefined ? {} : { occasion: input.occasion }),
    ...(input.season === undefined ? {} : { season: input.season }),
    ...(input.author === undefined ? {} : { author: input.author }),
    effects: input.effects,
  });
}
