import { afterEach, vi } from "vitest";

if (typeof window !== "undefined") {
  if (typeof window.requestAnimationFrame !== "function") {
    window.requestAnimationFrame = (callback) =>
      window.setTimeout(() => callback(window.performance.now()), 16);
    window.cancelAnimationFrame = (handle) => window.clearTimeout(handle);
  }

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn(() => ({
      matches: false,
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

if (
  typeof Element !== "undefined" &&
  typeof Element.prototype.animate !== "function"
) {
  Object.defineProperty(Element.prototype, "animate", {
    configurable: true,
    writable: true,
    value: vi.fn(() => {
      let playState: AnimationPlayState = "running";
      const listeners = new Map<
        string,
        Set<EventListenerOrEventListenerObject>
      >();
      const dispatch = (type: string) => {
        for (const listener of listeners.get(type) ?? []) {
          if (typeof listener === "function") listener(new Event(type));
          else listener.handleEvent(new Event(type));
        }
      };
      return {
        get playState() {
          return playState;
        },
        pause: vi.fn(() => {
          playState = "paused";
        }),
        play: vi.fn(() => {
          playState = "running";
        }),
        cancel: vi.fn(() => {
          playState = "idle";
          dispatch("cancel");
        }),
        addEventListener: vi.fn((type, listener) => {
          const bucket = listeners.get(type) ?? new Set();
          bucket.add(listener);
          listeners.set(type, bucket);
        }),
        removeEventListener: vi.fn((type, listener) => {
          listeners.get(type)?.delete(listener);
        }),
      } as unknown as Animation;
    }),
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  if (typeof document !== "undefined") document.body.replaceChildren();
});
