import { definePreset } from "../core/definitions";
import { ZeenatError } from "../shared/errors";
import type {
  BuiltInPresetName,
  ZeenatPreset,
  ZeenatPresetInput,
  ZeenatOptions,
} from "../shared/types";
import {
  pakistanDefenceDay,
  createPakistanDefenceDayPreset,
} from "./pakistan-defence-day";
import {
  pakistanIndependenceDay,
  createPakistanIndependenceDayPreset,
} from "./pakistan-independence-day";
import {
  usIndependenceDay,
  createUsIndependenceDayPreset,
} from "./us-independence-day";
import { createBuntingPreset } from "./bunting";
import { autumn } from "./autumn";
import { festiveLights } from "./festive-lights";
import { spring } from "./spring";
import { winter } from "./winter";

export const builtInPresets: Readonly<
  Record<Exclude<BuiltInPresetName, "bunting">, ZeenatPreset<BuiltInPresetName>>
> = Object.freeze({
  "pakistan-defence-day": pakistanDefenceDay,
  "pakistan-independence-day": pakistanIndependenceDay,
  "us-independence-day": usIndependenceDay,
  winter,
  autumn,
  spring,
  "festive-lights": festiveLights,
});

export function resolvePreset(
  input: ZeenatPresetInput,
  options: Pick<ZeenatOptions, "flag" | "orientation"> = {},
): ZeenatPreset {
  if (input === "bunting") {
    if (options.flag === undefined)
      throw new ZeenatError(
        'The bunting preset requires flag, for example flag="pakistan".',
      );
    return createBuntingPreset({
      flag: options.flag,
      ...(options.orientation === undefined
        ? {}
        : { orientation: options.orientation }),
    });
  }
  if (options.flag !== undefined)
    throw new ZeenatError('flag is only supported with preset="bunting".');
  if (options.orientation !== undefined) {
    if (input === "pakistan-defence-day")
      return createPakistanDefenceDayPreset(options);
    if (input === "pakistan-independence-day")
      return createPakistanIndependenceDayPreset(options);
    if (input === "us-independence-day")
      return createUsIndependenceDayPreset(options);
    throw new ZeenatError(
      "orientation is supported by bunting and national occasion presets. For custom presets, set it on bunting().",
    );
  }
  if (typeof input === "string") {
    const preset = (builtInPresets as Readonly<Record<string, ZeenatPreset>>)[
      input
    ];
    if (!preset) {
      throw new ZeenatError(
        `Unknown Zeenat preset "${input}". Available presets: ${Object.keys({
          bunting: true,
          ...builtInPresets,
        }).join(", ")}.`,
      );
    }
    return preset;
  }

  if (!input || typeof input !== "object")
    throw new ZeenatError("A valid Zeenat preset is required.");
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
