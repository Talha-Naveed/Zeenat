import { describe, expect, it, vi } from "vitest";
import { defineEffect, definePreset } from "../src/core/definitions";
import { SceneEngine } from "../src/core/engine";
import type { MotionPreference, ZeenatIntensity } from "../src/shared/types";
import { zeenat } from "../src/vanilla";

function testPreset(mount: ReturnType<typeof vi.fn>) {
  return definePreset({
    id: "test-preset",
    name: "Test preset",
    effects: [defineEffect({ id: "test-effect", mount })],
  });
}

function setReducedMotion(matches: boolean): void {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({
      matches,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    })),
  });
}

describe("SceneEngine lifecycle", () => {
  it("mounts an inert fixed overlay and releases all owned DOM", () => {
    const cleanup = vi.fn();
    const mount = vi.fn(() => cleanup);
    const controller = zeenat({ preset: testPreset(mount), seed: 42 });
    const root = document.querySelector<HTMLElement>("[data-zeenat-root]");

    expect(controller.state).toBe("running");
    expect(mount).toHaveBeenCalledOnce();
    expect(root?.style.position).toBe("fixed");
    expect(root?.style.pointerEvents).toBe("none");
    expect(root?.getAttribute("aria-hidden")).toBe("true");

    controller.destroy();
    controller.destroy();
    expect(cleanup).toHaveBeenCalledOnce();
    expect(controller.state).toBe("destroyed");
    expect(document.querySelector("[data-zeenat-root]")).toBeNull();
  });

  it("keeps multiple instances independent", () => {
    const firstCleanup = vi.fn();
    const secondCleanup = vi.fn();
    const first = zeenat({
      preset: testPreset(vi.fn(() => firstCleanup)),
      seed: 1,
    });
    const second = zeenat({
      preset: testPreset(vi.fn(() => secondCleanup)),
      seed: 2,
    });

    expect(document.querySelectorAll("[data-zeenat-root]")).toHaveLength(2);
    first.destroy();
    expect(document.querySelectorAll("[data-zeenat-root]")).toHaveLength(1);
    expect(firstCleanup).toHaveBeenCalledOnce();
    expect(secondCleanup).not.toHaveBeenCalled();
    second.destroy();
  });

  it("does not mount an effect when disabled", () => {
    const mount = vi.fn();
    const controller = zeenat({ preset: testPreset(mount), enabled: false });
    expect(controller.state).toBe("stopped");
    expect(mount).not.toHaveBeenCalled();
    expect(document.querySelector("[data-zeenat-root]")).toBeNull();
    controller.destroy();
  });

  it("pauses, resumes, and rebuilds effects when intensity changes", () => {
    const intensities: ZeenatIntensity[] = [];
    const cleanups: ReturnType<typeof vi.fn>[] = [];
    const preset = testPreset(
      vi.fn((context) => {
        intensities.push(context.intensity);
        const cleanup = vi.fn();
        cleanups.push(cleanup);
        return cleanup;
      }),
    );
    const controller = zeenat({ preset, intensity: "medium", seed: 3 });

    controller.pause();
    expect(controller.state).toBe("paused");
    controller.resume();
    expect(controller.state).toBe("running");
    controller.setIntensity("low");
    expect(intensities).toEqual(["medium", "low"]);
    expect(cleanups[0]).toHaveBeenCalledOnce();
    controller.destroy();
  });

  it("passes reduced motion to effects and can opt out", () => {
    setReducedMotion(true);
    const motions: MotionPreference[] = [];
    const preset = testPreset(
      vi.fn((context) => {
        motions.push(context.motion);
      }),
    );

    const respectful = zeenat({ preset });
    const unrestricted = zeenat({ preset, respectReducedMotion: false });
    expect(motions).toEqual(["reduced", "full"]);
    respectful.destroy();
    unrestricted.destroy();
  });

  it("cancels animations registered by an effect", () => {
    const animation = {
      playState: "running",
      pause: vi.fn(),
      play: vi.fn(),
      cancel: vi.fn(),
    } as unknown as Animation;
    const node = document.createElement("span");
    node.animate = vi.fn(() => animation);
    const preset = testPreset(
      vi.fn((context) => {
        context.layer.append(node);
        context.animate(node, [{ opacity: 0 }, { opacity: 1 }]);
      }),
    );
    const controller = zeenat({ preset });
    controller.destroy();
    expect(animation.cancel).toHaveBeenCalledOnce();
  });

  it("stops and removes an owned scene after a finite duration", () => {
    vi.useFakeTimers();
    const cleanup = vi.fn();
    const controller = zeenat({
      preset: testPreset(vi.fn(() => cleanup)),
      duration: 50,
    });

    vi.advanceTimersByTime(50);
    expect(controller.state).toBe("stopped");
    expect(cleanup).toHaveBeenCalledOnce();
    expect(document.querySelector("[data-zeenat-root]")).toBeNull();
    controller.destroy();
  });

  it("activates at a scheduled instant", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-05T18:59:59.000Z"));
    const mount = vi.fn();
    const controller = zeenat({
      preset: testPreset(mount),
      activeFrom: "2026-09-05T19:00:00.000Z",
      activeUntil: "2026-09-05T19:01:00.000Z",
    });

    expect(controller.state).toBe("stopped");
    vi.advanceTimersByTime(1_000);
    expect(controller.state).toBe("running");
    expect(mount).toHaveBeenCalledOnce();
    controller.destroy();
  });

  it("replays deterministic random values for a seed", () => {
    const values: number[] = [];
    const preset = testPreset(
      vi.fn((context) => {
        values.push(context.random(), context.randomBetween(10, 20));
      }),
    );
    const first = zeenat({ preset, seed: 1234 });
    first.destroy();
    const second = zeenat({ preset, seed: 1234 });
    second.destroy();
    expect(values.slice(0, 2)).toEqual(values.slice(2));
  });

  it("rejects ambiguous schedule timezones", () => {
    expect(
      () =>
        new SceneEngine({
          document,
          preset: testPreset(vi.fn()),
          activeFrom: "2026-09-05T00:00:00",
        }),
    ).toThrow(/explicit UTC offset/);
  });
});
