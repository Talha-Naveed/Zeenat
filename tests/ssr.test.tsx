// @vitest-environment node

import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("SSR safety", () => {
  it("imports every public source entry without browser globals", async () => {
    await expect(import("../src/index")).resolves.toBeDefined();
    await expect(import("../src/vanilla")).resolves.toBeDefined();
    await expect(import("../src/effects")).resolves.toBeDefined();
    await expect(import("../src/presets")).resolves.toBeDefined();
    await expect(import("../src/core")).resolves.toBeDefined();
    await expect(import("../src/flags")).resolves.toBeDefined();
    await expect(import("../src/effects/snow")).resolves.toBeDefined();
    await expect(import("../src/presets/winter")).resolves.toBeDefined();
  });

  it("server-renders a stable empty decoration root", async () => {
    const { Zeenat } = await import("../src/react");
    const html = renderToString(
      createElement(Zeenat, { preset: "pakistan-defence-day" }),
    );
    expect(html).toContain('data-zeenat-root="pakistan-defence-day"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("data-zeenat-effect");
  });
  it("server-renders generic flag bunting without loading any artwork", async () => {
    const { Zeenat } = await import("../src/react");
    const html = renderToString(
      createElement(Zeenat, {
        preset: "bunting",
        flag: "japan",
        orientation: "vertical",
        navbar: "#site-header",
      }),
    );
    expect(html).toContain('data-zeenat-root="bunting"');
    expect(html).not.toContain("svg");
  });
});
