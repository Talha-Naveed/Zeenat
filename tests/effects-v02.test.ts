import { describe, expect, it } from "vitest";
import { definePreset } from "../src/core/definitions";
import { fallingLeaves } from "../src/effects/falling-leaves";
import { lanterns } from "../src/effects/lanterns";
import { petals } from "../src/effects/petals";
import { snow } from "../src/effects/snow";
import { stringLights } from "../src/effects/string-lights";
import { zeenat } from "../src/vanilla";

const effects = [snow(), petals(), lanterns(), stringLights(), fallingLeaves()];

describe("v0.2 effects", () => {
  it("rejects malformed color configuration before mounting", () => {
    expect(() => snow({ colors: ["url(javascript:bad)"] })).toThrow(
      /valid color/,
    );
  });

  it.each(effects)("mounts and cleans up $id", (effect) => {
    const controller = zeenat({
      preset: definePreset({
        id: `test-${effect.id}`,
        name: effect.id,
        effects: [effect],
      }),
      seed: 12345,
    });
    expect(
      document.querySelector(`[data-zeenat-effect='${effect.id}']`)
        ?.childElementCount,
    ).toBeGreaterThan(0);
    expect(controller.getDiagnostics().domNodes).toBeLessThan(150);
    controller.destroy();
    expect(document.querySelector("[data-zeenat-root]")).toBeNull();
  });

  it("uses restrained static fallbacks in reduced motion", () => {
    const controller = zeenat({
      preset: definePreset({
        id: "reduced-snow",
        name: "Reduced snow",
        effects: [snow({ count: 80 })],
      }),
      motion: "reduced",
      intensity: "high",
    });
    const diagnostics = controller.getDiagnostics();
    expect(diagnostics.motion).toBe("reduced");
    expect(diagnostics.animations).toBe(0);
    expect(diagnostics.domNodes).toBeLessThan(20);
    controller.destroy();
  });
});
