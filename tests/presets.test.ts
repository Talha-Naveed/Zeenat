import { describe, expect, it } from "vitest";
import { defineEffect, definePreset } from "../src/core/definitions";
import { resolvePreset } from "../src/presets/registry";
import { builtInPresets } from "../src/presets/registry";
import { createWinterPreset } from "../src/presets/winter";
import { scaleEffectCount } from "../src/shared/intensity";
import {
  validatePresetCollection,
  validatePresetDefinition,
} from "../src/core/validation";

describe("preset definitions", () => {
  it("resolves all built-in preset ids", () => {
    expect(resolvePreset("pakistan-defence-day").effects).toHaveLength(3);
    expect(resolvePreset("us-independence-day").effects).toHaveLength(3);
    expect(resolvePreset("winter").effects).toHaveLength(3);
    expect(resolvePreset("autumn").effects).toHaveLength(2);
    expect(resolvePreset("spring").effects).toHaveLength(2);
    expect(resolvePreset("festive-lights").effects).toHaveLength(3);
  });

  it("supports typed preset customization without a universal option bag", () => {
    const preset = createWinterPreset({
      snow: { speed: "slow", count: 8 },
      sparkles: false,
    });
    expect(preset.effects.map((effect) => effect.id)).toEqual([
      "snow",
      "string-lights",
    ]);
  });

  it("validates built-in metadata and duplicate preset ids", () => {
    expect(
      validatePresetCollection(Object.values(builtInPresets), {
        requireMetadata: true,
      }).valid,
    ).toBe(true);
    const duplicate = validatePresetCollection([
      builtInPresets.winter,
      builtInPresets.winter,
    ]);
    expect(duplicate.valid).toBe(false);
    expect(
      duplicate.issues.some((issue) =>
        issue.message.includes("Duplicate preset id"),
      ),
    ).toBe(true);
    expect(validatePresetDefinition(builtInPresets.spring).valid).toBe(true);
  });

  it("accepts and freezes a custom preset", () => {
    const preset = definePreset({
      id: "company-anniversary",
      name: "Company anniversary",
      effects: [defineEffect({ id: "custom-mark", mount: () => undefined })],
    });

    expect(resolvePreset(preset).id).toBe("company-anniversary");
    expect(Object.isFrozen(preset.effects)).toBe(true);
  });

  it("rejects unknown and malformed presets with useful errors", () => {
    expect(() => resolvePreset("not-real" as never)).toThrow(
      /Unknown Zeenat preset/,
    );
    expect(() =>
      definePreset({ id: "Not Valid", name: "Bad", effects: [] }),
    ).toThrow(/kebab-case/);
    expect(() =>
      definePreset({ id: "valid-id", name: "Bad", effects: [] }),
    ).toThrow(/at least one effect/);
  });
});

describe("intensity calculations", () => {
  it("scales density by intensity, viewport, and motion preference", () => {
    expect(scaleEffectCount(20, "low", { isSmall: false }, "full")).toBe(12);
    expect(scaleEffectCount(20, "medium", { isSmall: true }, "full")).toBe(13);
    expect(scaleEffectCount(20, "high", { isSmall: false }, "full")).toBe(30);
    expect(scaleEffectCount(20, "high", { isSmall: true }, "reduced")).toBe(6);
  });
});
