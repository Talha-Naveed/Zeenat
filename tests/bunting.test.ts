import { describe, expect, it } from "vitest";
import { definePreset } from "../src/core/definitions";
import {
  bunting,
  pakistanFlag,
  unitedStatesFlag,
} from "../src/effects/bunting";
import { zeenat } from "../src/vanilla";

describe("bunting", () => {
  it("keeps identical portrait flags the same size along the curved cord", () => {
    const controller = zeenat({
      preset: "bunting",
      flag: "pakistan",
      orientation: "vertical",
      motion: "reduced",
    });
    const sizes = [...document.querySelectorAll("[data-zeenat-flag]")].map(
      (flag) => `${flag.getAttribute("width")}/${flag.getAttribute("height")}`,
    );
    expect(sizes.length).toBeGreaterThan(1);
    expect(new Set(sizes).size).toBe(1);
    controller.destroy();
  });
  it.each(["horizontal", "vertical"] as const)(
    "supports %s national preset bunting without distortion",
    (orientation) => {
      const controller = zeenat({
        preset: "pakistan-defence-day",
        orientation,
        motion: "reduced",
      });
      const use = document.querySelector("[data-zeenat-flag='pakistan']")!;
      expect(
        Number(use.getAttribute("width")) / Number(use.getAttribute("height")),
      ).toBeCloseTo(1.5);
      expect(use.getAttribute("transform")?.includes("rotate(90)")).toBe(
        orientation === "vertical",
      );
      expect(
        document
          .querySelector("[data-zeenat-flag-orientation]")
          ?.getAttribute("data-zeenat-flag-orientation"),
      ).toBe(orientation);
      expect(document.querySelector("[data-zeenat-aircraft]")).toBeNull();
      controller.destroy();
    },
  );
  it("anchors every item to the actual quadratic cable curve", () => {
    const controller = zeenat({
      preset: definePreset({
        id: "attached-bunting",
        name: "Attached bunting",
        effects: [bunting({ flags: [pakistanFlag], count: 7 })],
      }),
      motion: "reduced",
    });

    const svg = document.querySelector<SVGSVGElement>(
      "[data-zeenat-effect='bunting'] svg",
    );
    const anchors = svg?.querySelectorAll<SVGGElement>(
      "[data-zeenat-bunting-anchor]",
    );
    expect(svg?.dataset.zeenatBuntingKind).toBe("flags");
    expect(anchors).toHaveLength(7);

    const middle = anchors?.[3];
    // A quadratic curve with endpoints at y=12 and control y=66 reaches y=39,
    // not y=66, at its midpoint. This guards the original visible gap.
    expect(Number(middle?.dataset.zeenatAnchorY)).toBeCloseTo(39, 3);
    expect(
      Number(
        middle
          ?.querySelector<SVGUseElement>("[data-zeenat-flag]")
          ?.getAttribute("y"),
      ),
    ).toBeLessThan(0);

    controller.destroy();
  });

  it("renders reusable country flags while preserving pennant mode", () => {
    const flagController = zeenat({
      preset: definePreset({
        id: "country-flags",
        name: "Country flags",
        effects: [
          bunting({ flags: [pakistanFlag, unitedStatesFlag], count: 8 }),
        ],
      }),
      motion: "reduced",
    });

    expect(document.querySelectorAll("symbol")).toHaveLength(2);
    expect(
      document.querySelectorAll("[data-zeenat-flag='pakistan']").length,
    ).toBeGreaterThan(0);
    expect(
      document.querySelectorAll("[data-zeenat-flag='united-states']").length,
    ).toBeGreaterThan(0);
    flagController.destroy();

    const pennantController = zeenat({
      preset: definePreset({
        id: "classic-pennants",
        name: "Classic pennants",
        effects: [bunting({ colors: ["#01411c", "#ffffff"], count: 6 })],
      }),
      motion: "reduced",
    });
    const svg = document.querySelector<SVGSVGElement>(
      "[data-zeenat-effect='bunting'] svg",
    );
    expect(svg?.dataset.zeenatBuntingKind).toBe("pennants");
    expect(
      svg?.querySelectorAll("[data-zeenat-bunting-anchor] path"),
    ).toHaveLength(6);
    pennantController.destroy();
  });

  it("rejects empty or malformed flag designs", () => {
    expect(() => bunting({ flags: [] })).toThrow(/at least one design/);
    expect(() =>
      bunting({
        flags: [
          {
            id: "invalid",
            aspectRatio: 0,
            render: () => undefined,
          },
        ],
      }),
    ).toThrow(/invalid flag design/);
  });
});
