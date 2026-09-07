import { afterEach, describe, expect, it, vi } from "vitest";
import { definePreset } from "../src/core/definitions";
import { bunting } from "../src/effects/bunting";
import { zeenat } from "../src/vanilla";

const property = "--zeenat-navbar-bottom";
const options = {
  preset: "bunting",
  flag: "pakistan",
  motion: "reduced",
} as const;

function header(tag = "nav", parent: HTMLElement = document.body) {
  const element = document.createElement(tag);
  parent.append(element);
  const bounds = {
    top: 0,
    bottom: 64,
    left: 0,
    right: 1024,
    width: 1024,
    height: 64,
  };
  vi.spyOn(element, "getBoundingClientRect").mockImplementation(
    () => ({ ...bounds }) as DOMRect,
  );
  return { element, bounds };
}

async function flush() {
  await Promise.resolve();
  vi.advanceTimersByTime(20);
}

afterEach(() => vi.restoreAllMocks());

describe("navbar avoidance", () => {
  it("automatically clears navigation without changing host styles or geometry", () => {
    const { element } = header();
    const before = element.outerHTML;
    const controller = zeenat(options);
    const root = document.querySelector<HTMLElement>("[data-zeenat-root]")!;
    expect(root.style.getPropertyValue(property)).toBe("64px");
    expect(element.outerHTML).toBe(before);
    expect(root.style.inset).toBe("0");
    controller.destroy();
  });

  it("follows the visible bottom while scrolling, including when paused", async () => {
    vi.useFakeTimers();
    const { bounds } = header();
    const controller = zeenat(options);
    const root = document.querySelector<HTMLElement>("[data-zeenat-root]")!;
    const svg = root.querySelector("svg");
    controller.pause();
    bounds.top = -32;
    bounds.bottom = 32;
    document.dispatchEvent(new Event("scroll"));
    await flush();
    expect(root.style.getPropertyValue(property)).toBe("32px");
    bounds.top = -80;
    bounds.bottom = -16;
    document.dispatchEvent(new Event("scroll"));
    await flush();
    expect(root.style.getPropertyValue(property)).toBe("0px");
    expect(root.querySelector("svg")).toBe(svg);
    controller.destroy();
  });

  it("ignores content headers, sidebars, tall heroes, and offscreen navigation", () => {
    const main = document.createElement("main");
    document.body.append(main);
    header("header", main);
    const sidebar = header();
    sidebar.bounds.width = 180;
    const hero = header("header");
    hero.bounds.height = 450;
    hero.bounds.bottom = 450;
    const lower = header();
    lower.bounds.top = 400;
    lower.bounds.bottom = 464;
    const controller = zeenat(options);
    expect(
      document
        .querySelector<HTMLElement>("[data-zeenat-root]")!
        .style.getPropertyValue(property),
    ).toBe("0px");
    controller.destroy();
  });

  it("accepts custom selectors and follows replacement and hidden ancestors", async () => {
    vi.useFakeTimers();
    const wrapper = document.createElement("div");
    document.body.append(wrapper);
    const first = header("div", wrapper);
    first.element.className = "site-nav";
    const controller = zeenat({ ...options, navbar: ".site-nav" });
    const root = document.querySelector<HTMLElement>("[data-zeenat-root]")!;
    expect(root.style.getPropertyValue(property)).toBe("64px");
    wrapper.style.opacity = "0";
    await flush();
    expect(root.style.getPropertyValue(property)).toBe("0px");
    wrapper.style.opacity = "1";
    first.element.remove();
    const second = header("div", wrapper);
    second.element.className = "site-nav";
    second.bounds.height = 96;
    second.bounds.bottom = 96;
    await flush();
    expect(root.style.getPropertyValue(property)).toBe("96px");
    controller.destroy();
  });

  it("finds a late-mounted header and rounds fractional edges upwards", async () => {
    vi.useFakeTimers();
    const controller = zeenat(options);
    const root = document.querySelector<HTMLElement>("[data-zeenat-root]")!;
    expect(root.style.getPropertyValue(property)).toBe("0px");
    const { bounds } = header();
    bounds.bottom = 64.3;
    await flush();
    expect(root.style.getPropertyValue(property)).toBe("65px");
    controller.destroy();
  });

  it("rediscovers custom attribute selectors when their attributes change", async () => {
    vi.useFakeTimers();
    const { element } = header("div");
    const controller = zeenat({ ...options, navbar: "[data-site-navbar]" });
    const root = document.querySelector<HTMLElement>("[data-zeenat-root]")!;
    expect(root.style.getPropertyValue(property)).toBe("0px");
    element.setAttribute("data-site-navbar", "");
    await flush();
    expect(root.style.getPropertyValue(property)).toBe("64px");
    element.removeAttribute("data-site-navbar");
    await flush();
    expect(root.style.getPropertyValue(property)).toBe("0px");
    controller.destroy();
  });

  it("uses the lowest edge of stacked header regions", () => {
    header("header");
    const second = header();
    second.bounds.top = 64;
    second.bounds.bottom = 120;
    const controller = zeenat(options);
    expect(
      document
        .querySelector<HTMLElement>("[data-zeenat-root]")!
        .style.getPropertyValue(property),
    ).toBe("120px");
    controller.destroy();
  });

  it("allows opting out and leaves bottom bunting and other effects in place", () => {
    header();
    const disabled = zeenat({ ...options, navbar: false });
    expect(
      document
        .querySelector<HTMLElement>("[data-zeenat-root]")!
        .style.getPropertyValue(property),
    ).toBe("");
    disabled.destroy();
    const bottom = zeenat({
      preset: definePreset({
        id: "bottom",
        name: "Bottom",
        effects: [bunting({ colors: ["green"], position: "bottom" })],
      }),
      motion: "reduced",
    });
    expect(document.querySelector("svg")?.style.top).toBe("auto");
    expect(document.querySelector("svg")?.style.bottom).toBe("0px");
    bottom.destroy();
    const winter = zeenat({ preset: "winter", motion: "reduced" });
    expect(
      document
        .querySelector<HTMLElement>("[data-zeenat-root]")!
        .style.getPropertyValue(property),
    ).toBe("");
    winter.destroy();
  });

  it("disconnects observers and cancels queued work on destroy and restarts cleanly", async () => {
    vi.useFakeTimers();
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const cancel = vi.spyOn(window, "cancelAnimationFrame");
    const { bounds } = header();
    const controller = zeenat(options);
    controller.restart();
    expect(disconnect).toHaveBeenCalledTimes(1);
    const root = document.querySelector<HTMLElement>("[data-zeenat-root]")!;
    document.dispatchEvent(new Event("scroll"));
    controller.destroy();
    expect(disconnect).toHaveBeenCalledTimes(2);
    expect(cancel).toHaveBeenCalled();
    bounds.bottom = 100;
    document.dispatchEvent(new Event("scroll"));
    await flush();
    expect(root.style.getPropertyValue(property)).toBe("");
    expect(document.querySelector("[data-zeenat-root]")).toBeNull();
  });

  it.each(["[", "", "   "])(
    "rejects invalid selector %j before mounting",
    (navbar) => {
      expect(() => zeenat({ ...options, navbar })).toThrow(/navbar must be/);
      expect(document.querySelector("[data-zeenat-root]")).toBeNull();
    },
  );
});
