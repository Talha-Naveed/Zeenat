/* global document */
import { afterEach, describe, expect, it } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { createElement } from "react";
import { validatePresetDefinition } from "zeenat/core";
import { anniversary } from "../skills/zeenat/examples/next-decoration.tsx";
import { WinterDecoration } from "../skills/zeenat/examples/react.tsx";
import { mountDecoration } from "../skills/zeenat/examples/vanilla.js";

afterEach(cleanup);

describe("Skill examples against the built package", () => {
  it("composes a valid anniversary from existing effects", () => {
    expect(
      validatePresetDefinition(anniversary, { requireMetadata: true }),
    ).toEqual({
      valid: true,
      issues: [],
    });
    expect(anniversary.effects.map((effect) => effect.id)).toEqual([
      "bunting",
      "sparkles",
    ]);
  });

  it("keeps React controls outside decoration and cleans up on unmount", () => {
    const view = render(createElement(WinterDecoration));
    const root = view.container.querySelector("[data-zeenat-root]");
    const pause = view.getByRole("button", { name: "Pause decoration" });
    expect(root?.getAttribute("aria-hidden")).toBe("true");
    expect(root?.contains(pause)).toBe(false);
    expect(root?.querySelectorAll("[data-zeenat-effect]").length).toBe(1);
    fireEvent.click(pause);
    fireEvent.click(view.getByRole("button", { name: "Resume decoration" }));
    view.unmount();
    expect(document.querySelector("[data-zeenat-root]")).toBeNull();
  });

  it("tears down vanilla decorations without accumulating scene roots", () => {
    const dispose = mountDecoration();
    expect(document.querySelectorAll("[data-zeenat-root]").length).toBe(1);
    dispose();
    dispose();
    expect(document.querySelectorAll("[data-zeenat-root]").length).toBe(0);
    const disposeAgain = mountDecoration();
    expect(document.querySelectorAll("[data-zeenat-root]").length).toBe(1);
    disposeAgain();
    expect(document.querySelectorAll("[data-zeenat-root]").length).toBe(0);
  });
});
