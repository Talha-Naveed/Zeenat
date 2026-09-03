import { describe, expect, it, vi } from "vitest";
import { countryFlag, flagCatalog, resolveFlag } from "../src/flags";
import { flagLoaders } from "../src/flags/loaders";
import { createBuntingPreset } from "../src/presets/bunting";
import { resolvePreset } from "../src/presets/registry";
import { zeenat } from "../src/vanilla";
import type { FlagNode } from "../src/flags/render";

describe("country flag catalog", () => {
  it("covers 248 ISO entries plus Kosovo with unique codes and names", () => {
    expect(flagCatalog).toHaveLength(249);
    expect(new Set(flagCatalog.map((flag) => flag.code)).size).toBe(249);
    expect(new Set(flagCatalog.map((flag) => flag.slug)).size).toBe(249);
    for (const code of ["PK", "US", "PS", "XK", "JP", "NP", "CH", "BR", "ZA"])
      expect(resolveFlag(code).code).toBe(code);
    for (const invalid of [
      "IL",
      "il",
      "israel",
      "unknown",
      "constructor",
      "__proto__",
      "",
    ])
      expect(() => resolveFlag(invalid)).toThrow(/unsupported flag/);
  });

  it("supports canonical slugs, codes, and common aliases", () => {
    expect(countryFlag("pakistan").id).toBe("pakistan");
    expect(countryFlag("pk").id).toBe("pakistan");
    expect(countryFlag("USA")).toBeDefined();
    expect(resolveFlag("united states").code).toBe("US");
    expect(resolveFlag("uk").code).toBe("GB");
    expect(resolveFlag("turkey").code).toBe("TR");
  });

  it("renders every catalog design as local SVG without images or duplicate IDs", async () => {
    for (const flag of flagCatalog) {
      const container = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "symbol",
      );
      container.id = `test-${flag.code}`;
      const design = countryFlag(flag.code);
      await design.render({
        document,
        container,
        width: design.aspectRatio,
        height: 1,
        signal: new AbortController().signal,
      });
      expect(container.children.length, flag.code).toBeGreaterThan(0);
      expect(
        container.querySelector("script, image, foreignObject, style"),
        flag.code,
      ).toBeNull();
      const ids = [...container.querySelectorAll("[id]")].map(
        (node) => node.id,
      );
      expect(new Set(ids).size, flag.code).toBe(ids.length);
      for (const id of ids)
        expect(id.startsWith(`${container.id}-`)).toBe(true);
    }
  }, 20_000);

  it("does not load artwork while disabled and discards a late load after destroy", async () => {
    let complete!: (value: { default: FlagNode }) => void;
    const loader = vi.spyOn(flagLoaders, "JP").mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }) as ReturnType<typeof flagLoaders.JP>,
    );
    const disabled = zeenat({
      preset: "bunting",
      flag: "japan",
      enabled: false,
    });
    expect(loader).not.toHaveBeenCalled();
    disabled.destroy();
    const controller = zeenat({
      preset: "bunting",
      flag: "japan",
      motion: "reduced",
    });
    const symbol = document.querySelector("symbol")!;
    await vi.waitFor(() => expect(loader).toHaveBeenCalledOnce());
    controller.destroy();
    complete({
      default: [
        "svg",
        { viewBox: "0 0 3 2" },
        [["path", { d: "M0 0H3V2H0Z" }, []]],
      ],
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(symbol.children).toHaveLength(0);
    expect(document.querySelector("[data-zeenat-root]")).toBeNull();
    loader.mockRestore();
  });

  it("handles a failed asset import without an unhandled rejection", async () => {
    const loader = vi
      .spyOn(flagLoaders, "JP")
      .mockRejectedValue(new Error("chunk unavailable"));
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const controller = zeenat({
      preset: "bunting",
      flag: "japan",
      motion: "reduced",
    });
    await vi.waitFor(() =>
      expect(
        document
          .querySelector("symbol")
          ?.getAttribute("data-zeenat-flag-status"),
      ).toBe("failed"),
    );
    expect(log).toHaveBeenCalledOnce();
    controller.destroy();
    loader.mockRestore();
    log.mockRestore();
  });

  it("requires a flag for generic bunting and rejects ignored option combinations", () => {
    expect(() => resolvePreset("bunting")).toThrow(/requires flag/);
    expect(resolvePreset("bunting", { flag: "pakistan" }).effects).toHaveLength(
      1,
    );
    expect(
      createBuntingPreset({ flag: "PK", orientation: "vertical" }).id,
    ).toBe("bunting");
    expect(() => resolvePreset("winter", { flag: "pakistan" })).toThrow(
      /only supported/,
    );
    expect(() => resolvePreset("winter", { orientation: "vertical" })).toThrow(
      /orientation/,
    );
    expect(() =>
      resolvePreset("bunting", {
        flag: "PK",
        orientation: "diagonal" as never,
      }),
    ).toThrow(/orientation/);
  });
});
