import { describe, expect, it, vi } from "vitest";
import { defineEffect, definePreset } from "../src/core/definitions";
import { zeenat } from "../src/vanilla";

describe("v0.2 isolated effect runtime", () => {
  it("pauses for visibility without clearing an independent manual pause", () => {
    const animation = {
      playState: "running",
      pause: vi.fn(),
      play: vi.fn(),
      cancel: vi.fn(),
      addEventListener: vi.fn(),
    } as unknown as Animation;
    const node = document.createElement("span");
    node.animate = vi.fn(() => animation);
    const preset = definePreset({
      id: "visibility-pause",
      name: "Visibility pause",
      effects: [
        defineEffect({
          id: "animated",
          mount(context) {
            context.layer.append(node);
            context.animate(node, [{ opacity: 0 }, { opacity: 1 }]);
          },
        }),
      ],
    });
    const originalVisibility = document.visibilityState;
    const controller = zeenat({ preset });
    controller.pause();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(controller.state).toBe("paused");
    controller.resume();
    expect(controller.state).toBe("running");
    expect(animation.pause).toHaveBeenCalled();
    expect(animation.play).toHaveBeenCalled();
    controller.destroy();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: originalVisibility,
    });
  });

  it("removes finite animations from diagnostics after they finish", () => {
    let finish: (() => void) | undefined;
    const animation = {
      playState: "running",
      pause: vi.fn(),
      play: vi.fn(),
      cancel: vi.fn(),
      addEventListener: vi.fn((type: string, listener: EventListener) => {
        if (type === "finish") finish = () => listener(new Event("finish"));
      }),
    } as unknown as Animation;
    const node = document.createElement("span");
    node.animate = vi.fn(() => animation);
    const preset = definePreset({
      id: "finite-animation",
      name: "Finite animation",
      effects: [
        defineEffect({
          id: "finite",
          mount(context) {
            context.layer.append(node);
            context.animate(node, [{ opacity: 0 }, { opacity: 1 }], 100);
          },
        }),
      ],
    });
    const controller = zeenat({ preset });
    expect(controller.getDiagnostics().animations).toBe(1);
    finish?.();
    expect(controller.getDiagnostics().animations).toBe(0);
    controller.destroy();
  });

  it("chunks durations beyond the browser timeout ceiling", () => {
    vi.useFakeTimers();
    const timeout = vi.spyOn(window, "setTimeout");
    const preset = definePreset({
      id: "long-duration",
      name: "Long duration",
      effects: [defineEffect({ id: "still", mount: () => undefined })],
    });
    const controller = zeenat({ preset, duration: 2_147_484_647 });
    expect(timeout.mock.calls.some((call) => call[1] === 2_147_483_647)).toBe(
      true,
    );
    expect(controller.state).toBe("running");
    controller.destroy();
  });

  it("rolls back a failed effect and continues mounting its siblings", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const healthyMount = vi.fn((context) => {
      context.layer.append(document.createElement("span"));
    });
    const preset = definePreset({
      id: "failure-isolation",
      name: "Failure isolation",
      effects: [
        defineEffect({
          id: "broken-effect",
          mount(context) {
            context.layer.append(document.createElement("span"));
            context.scheduler.every(() => undefined, 1_000);
            context.scheduler.frame(() => undefined);
            throw new Error("expected failure");
          },
        }),
        defineEffect({ id: "healthy-effect", mount: healthyMount }),
      ],
    });

    const controller = zeenat({ preset, seed: 8 });
    const diagnostics = controller.getDiagnostics();
    expect(healthyMount).toHaveBeenCalledOnce();
    expect(
      document.querySelector("[data-zeenat-effect='broken-effect']"),
    ).toBeNull();
    expect(
      document.querySelector("[data-zeenat-effect='healthy-effect']"),
    ).not.toBeNull();
    expect(diagnostics.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "broken-effect",
          status: "failed",
          error: "expected failure",
        }),
        expect.objectContaining({ id: "healthy-effect", status: "mounted" }),
      ]),
    );
    expect(diagnostics.timers).toBe(0);
    expect(diagnostics.rafLoops).toBe(0);
    controller.destroy();
  });

  it("isolates throwing scheduled callbacks and tracks resources", () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const sibling = vi.fn();
    const preset = definePreset({
      id: "callback-isolation",
      name: "Callback isolation",
      effects: [
        defineEffect({
          id: "throwing-timer",
          mount(context) {
            context.scheduler.every(() => {
              throw new Error("timer failed");
            }, 20);
          },
        }),
        defineEffect({
          id: "healthy-timer",
          mount(context) {
            context.scheduler.every(sibling, 20);
          },
        }),
      ],
    });

    const controller = zeenat({ preset });
    expect(controller.getDiagnostics().timers).toBe(2);
    vi.advanceTimersByTime(25);
    expect(sibling).toHaveBeenCalledOnce();
    expect(
      controller
        .getDiagnostics()
        .effects.find((effect) => effect.id === "throwing-timer")?.error,
    ).toBe("timer failed");
    controller.destroy();
  });

  it("uses semantic layers and deterministic ordering", () => {
    const preset = definePreset({
      id: "layering",
      name: "Layering",
      effects: [
        defineEffect({
          id: "top-effect",
          layer: "top",
          order: 4,
          mount: () => undefined,
        }),
        defineEffect({
          id: "background-effect",
          layer: "background",
          order: 2,
          mount: () => undefined,
        }),
      ],
    });
    const controller = zeenat({ preset });
    const top = document.querySelector<HTMLElement>(
      "[data-zeenat-effect='top-effect']",
    );
    const background = document.querySelector<HTMLElement>(
      "[data-zeenat-effect='background-effect']",
    );
    expect(top?.dataset.zeenatLayer).toBe("top");
    expect(Number(top?.style.zIndex)).toBeGreaterThan(
      Number(background?.style.zIndex),
    );
    controller.destroy();
  });

  it("publishes diagnostics and stops publishing after unsubscribe", () => {
    const preset = definePreset({
      id: "diagnostics",
      name: "Diagnostics",
      effects: [defineEffect({ id: "one", mount: () => undefined })],
    });
    const controller = zeenat({ preset, debug: true, seed: 99 });
    const listener = vi.fn();
    const unsubscribe = controller.subscribeDiagnostics(listener);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        preset: "diagnostics",
        seed: 99,
        state: "running",
      }),
    );
    unsubscribe();
    const calls = listener.mock.calls.length;
    controller.pause();
    expect(listener).toHaveBeenCalledTimes(calls);
    expect(
      document.querySelector<HTMLElement>("[data-zeenat-root]")?.dataset
        .zeenatDebug,
    ).toBe("true");
    controller.destroy();
  });

  it("restarts responsive effects only when crossing the small-screen breakpoint", () => {
    vi.useFakeTimers();
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 800,
    });
    const sizes: boolean[] = [];
    const preset = definePreset({
      id: "responsive",
      name: "Responsive",
      effects: [
        defineEffect({
          id: "responsive-effect",
          mount(context) {
            sizes.push(context.viewport.isSmall);
          },
        }),
      ],
    });
    const controller = zeenat({ preset });
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 390,
    });
    window.dispatchEvent(new Event("resize"));
    vi.advanceTimersByTime(20);
    expect(sizes).toEqual([false, true]);
    controller.destroy();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: originalWidth,
    });
  });
});
