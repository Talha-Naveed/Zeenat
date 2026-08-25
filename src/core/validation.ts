import { IDENTIFIER_PATTERN, validateEffect } from "./definitions";
import type {
  PresetValidationIssue,
  PresetValidationResult,
  ZeenatPreset,
} from "../shared/types";

export interface ValidatePresetOptions {
  readonly requireMetadata?: boolean;
}

export function validatePresetDefinition(
  preset: ZeenatPreset,
  options: ValidatePresetOptions = {},
): PresetValidationResult {
  const issues: PresetValidationIssue[] = [];
  if (!IDENTIFIER_PATTERN.test(preset.id)) {
    issues.push({
      level: "error",
      path: "id",
      message: "Preset id must be lowercase kebab case.",
    });
  }
  if (preset.name.trim().length === 0) {
    issues.push({ level: "error", path: "name", message: "Name is required." });
  }
  if (preset.effects.length === 0) {
    issues.push({
      level: "error",
      path: "effects",
      message: "At least one effect is required.",
    });
  }
  if (options.requireMetadata && !preset.description?.trim()) {
    issues.push({
      level: "error",
      path: "description",
      message: "Built-in presets require a description.",
    });
  }
  if (options.requireMetadata && (!preset.tags || preset.tags.length === 0)) {
    issues.push({
      level: "error",
      path: "tags",
      message: "Built-in presets require at least one tag.",
    });
  }

  const effectIds = new Set<string>();
  preset.effects.forEach((effect, index) => {
    try {
      validateEffect(effect);
    } catch (error) {
      issues.push({
        level: "error",
        path: `effects[${index}]`,
        message: error instanceof Error ? error.message : String(error),
      });
    }
    if (effectIds.has(effect.id)) {
      issues.push({
        level: "warning",
        path: `effects[${index}].id`,
        message: `Effect id "${effect.id}" appears more than once.`,
      });
    }
    effectIds.add(effect.id);
  });

  return Object.freeze({
    valid: issues.every((issue) => issue.level !== "error"),
    issues: Object.freeze(issues),
  });
}

export function validatePresetCollection(
  presets: readonly ZeenatPreset[],
  options: ValidatePresetOptions = {},
): PresetValidationResult {
  const issues: PresetValidationIssue[] = [];
  const ids = new Set<string>();

  presets.forEach((preset, index) => {
    const result = validatePresetDefinition(preset, options);
    for (const issue of result.issues) {
      issues.push({ ...issue, path: `[${index}].${issue.path}` });
    }
    if (ids.has(preset.id)) {
      issues.push({
        level: "error",
        path: `[${index}].id`,
        message: `Duplicate preset id "${preset.id}".`,
      });
    }
    ids.add(preset.id);
  });

  return Object.freeze({
    valid: issues.every((issue) => issue.level !== "error"),
    issues: Object.freeze(issues),
  });
}
