import { ZeenatError } from "../shared/errors";
import type {
  DefinePresetInput,
  ZeenatEffect,
  ZeenatLayer,
  ZeenatPreset,
} from "../shared/types";

export const IDENTIFIER_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const EFFECT_LAYERS: readonly ZeenatLayer[] = [
  "background",
  "ambient",
  "foreground",
  "top",
];

export function defineEffect(effect: ZeenatEffect): ZeenatEffect {
  validateEffect(effect);
  return Object.freeze({ ...effect });
}

export function definePreset<const Id extends string>(
  input: DefinePresetInput<Id>,
): ZeenatPreset<Id> {
  if (!IDENTIFIER_PATTERN.test(input.id)) {
    throw new ZeenatError(
      `Preset id "${input.id}" must be a lowercase kebab-case identifier.`,
    );
  }
  if (input.name.trim().length === 0) {
    throw new ZeenatError(`Preset "${input.id}" must have a name.`);
  }
  if (!Array.isArray(input.effects) || input.effects.length === 0) {
    throw new ZeenatError(
      `Preset "${input.id}" must contain at least one effect.`,
    );
  }
  input.effects.forEach(validateEffect);

  return Object.freeze({
    id: input.id,
    name: input.name,
    ...(input.description === undefined
      ? {}
      : { description: input.description }),
    ...(input.tags === undefined
      ? {}
      : { tags: Object.freeze([...input.tags]) }),
    ...(input.region === undefined ? {} : { region: input.region }),
    ...(input.occasion === undefined ? {} : { occasion: input.occasion }),
    ...(input.season === undefined ? {} : { season: input.season }),
    ...(input.author === undefined ? {} : { author: input.author }),
    effects: Object.freeze([...input.effects]),
  });
}

export function validateEffect(effect: ZeenatEffect): void {
  if (!effect || !IDENTIFIER_PATTERN.test(effect.id)) {
    throw new ZeenatError(
      "Every effect must have a lowercase kebab-case `id`.",
    );
  }
  if (typeof effect.mount !== "function") {
    throw new ZeenatError(`Effect "${effect.id}" must provide mount(context).`);
  }
  if (effect.layer !== undefined && !EFFECT_LAYERS.includes(effect.layer)) {
    throw new ZeenatError(`Effect "${effect.id}" has an invalid layer.`);
  }
  if (effect.order !== undefined && !Number.isFinite(effect.order)) {
    throw new ZeenatError(`Effect "${effect.id}" order must be finite.`);
  }
}
