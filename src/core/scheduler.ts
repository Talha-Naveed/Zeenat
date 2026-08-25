import type { CleanupFunction, ZeenatScheduler } from "../shared/types";

interface TimerRecord {
  callback: () => void;
  remainingMs: number;
  startedAt: number;
  handle: number | null;
}

type ErrorHandler = (error: unknown) => void;

const ignoreError: ErrorHandler = () => undefined;

export class RuntimeScheduler implements ZeenatScheduler {
  private readonly frameTasks = new Map<
    number,
    (deltaMs: number, timestamp: number) => void
  >();
  private readonly timers = new Map<number, TimerRecord>();
  private nextId = 1;
  private frameHandle: number | null = null;
  private previousTimestamp: number | null = null;
  private paused = false;
  private destroyed = false;

  constructor(
    private readonly view: Window,
    private readonly onError: ErrorHandler = ignoreError,
  ) {}

  get timerCount(): number {
    return this.timers.size;
  }

  get frameTaskCount(): number {
    return this.frameTasks.size;
  }

  frame(
    callback: (deltaMs: number, timestamp: number) => void,
  ): CleanupFunction {
    if (this.destroyed) return () => undefined;
    const id = this.nextId++;
    this.frameTasks.set(id, callback);
    this.ensureFrame();
    return () => {
      this.frameTasks.delete(id);
      this.cancelFrameWhenIdle();
    };
  }

  delay(callback: () => void, delayMs: number): CleanupFunction {
    if (this.destroyed) return () => undefined;
    if (!Number.isFinite(delayMs)) {
      throw new RangeError("Zeenat scheduler delay must be finite.");
    }
    const id = this.nextId++;
    const record: TimerRecord = {
      callback,
      remainingMs: Math.max(0, delayMs),
      startedAt: this.now(),
      handle: null,
    };
    this.timers.set(id, record);
    if (!this.paused) this.armTimer(id, record);
    return () => this.clearTimer(id);
  }

  every(callback: () => void, intervalMs: number): CleanupFunction {
    if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
      throw new RangeError(
        "Zeenat scheduler interval must be positive and finite.",
      );
    }
    let active = true;
    let cancelNext: CleanupFunction = () => undefined;
    const run = () => {
      if (!active) return;
      callback();
      cancelNext = this.delay(run, intervalMs);
    };
    cancelNext = this.delay(run, intervalMs);
    return () => {
      active = false;
      cancelNext();
    };
  }

  pause(): void {
    if (this.paused || this.destroyed) return;
    this.paused = true;
    if (this.frameHandle !== null) {
      this.view.cancelAnimationFrame(this.frameHandle);
      this.frameHandle = null;
    }
    this.previousTimestamp = null;
    const now = this.now();
    for (const record of this.timers.values()) {
      if (record.handle === null) continue;
      this.view.clearTimeout(record.handle);
      record.handle = null;
      record.remainingMs = Math.max(
        0,
        record.remainingMs - (now - record.startedAt),
      );
    }
  }

  resume(): void {
    if (!this.paused || this.destroyed) return;
    this.paused = false;
    for (const [id, record] of this.timers) this.armTimer(id, record);
    this.ensureFrame();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.frameHandle !== null) {
      this.view.cancelAnimationFrame(this.frameHandle);
      this.frameHandle = null;
    }
    for (const record of this.timers.values()) {
      if (record.handle !== null) this.view.clearTimeout(record.handle);
    }
    this.timers.clear();
    this.frameTasks.clear();
  }

  private readonly tick = (timestamp: number): void => {
    this.frameHandle = null;
    if (this.paused || this.destroyed) return;
    const delta =
      this.previousTimestamp === null
        ? 0
        : Math.min(64, Math.max(0, timestamp - this.previousTimestamp));
    this.previousTimestamp = timestamp;
    for (const callback of [...this.frameTasks.values()]) {
      try {
        callback(delta, timestamp);
      } catch (error) {
        this.onError(error);
      }
    }
    this.ensureFrame();
  };

  private ensureFrame(): void {
    if (
      this.paused ||
      this.destroyed ||
      this.frameHandle !== null ||
      this.frameTasks.size === 0
    ) {
      return;
    }
    this.frameHandle = this.view.requestAnimationFrame(this.tick);
  }

  private cancelFrameWhenIdle(): void {
    if (this.frameTasks.size > 0 || this.frameHandle === null) return;
    this.view.cancelAnimationFrame(this.frameHandle);
    this.frameHandle = null;
    this.previousTimestamp = null;
  }

  private armTimer(id: number, record: TimerRecord): void {
    record.startedAt = this.now();
    record.handle = this.view.setTimeout(() => {
      record.handle = null;
      this.timers.delete(id);
      if (this.destroyed) return;
      try {
        record.callback();
      } catch (error) {
        this.onError(error);
      }
    }, record.remainingMs);
  }

  private clearTimer(id: number): void {
    const record = this.timers.get(id);
    if (!record) return;
    if (record.handle !== null) this.view.clearTimeout(record.handle);
    this.timers.delete(id);
  }

  private now(): number {
    return this.view.performance?.now() ?? Date.now();
  }
}

export class ScopedScheduler implements ZeenatScheduler {
  private readonly timerCleanups = new Set<CleanupFunction>();
  private readonly frameCleanups = new Set<CleanupFunction>();
  private destroyed = false;

  constructor(
    private readonly runtime: RuntimeScheduler,
    private readonly onError: ErrorHandler = ignoreError,
  ) {}

  get timerCount(): number {
    return this.timerCleanups.size;
  }

  get frameTaskCount(): number {
    return this.frameCleanups.size;
  }

  frame(
    callback: (deltaMs: number, timestamp: number) => void,
  ): CleanupFunction {
    if (this.destroyed) return () => undefined;
    let cancelRuntime: CleanupFunction = () => undefined;
    const cancel = () => {
      if (!this.frameCleanups.delete(cancel)) return;
      cancelRuntime();
    };
    cancelRuntime = this.runtime.frame((delta, timestamp) => {
      try {
        callback(delta, timestamp);
      } catch (error) {
        this.onError(error);
      }
    });
    this.frameCleanups.add(cancel);
    return cancel;
  }

  delay(callback: () => void, delayMs: number): CleanupFunction {
    if (this.destroyed) return () => undefined;
    let cancelRuntime: CleanupFunction = () => undefined;
    const cancel = () => {
      if (!this.timerCleanups.delete(cancel)) return;
      cancelRuntime();
    };
    cancelRuntime = this.runtime.delay(() => {
      this.timerCleanups.delete(cancel);
      try {
        callback();
      } catch (error) {
        this.onError(error);
      }
    }, delayMs);
    this.timerCleanups.add(cancel);
    return cancel;
  }

  every(callback: () => void, intervalMs: number): CleanupFunction {
    if (this.destroyed) return () => undefined;
    let cancelRuntime: CleanupFunction = () => undefined;
    const cancel = () => {
      if (!this.timerCleanups.delete(cancel)) return;
      cancelRuntime();
    };
    cancelRuntime = this.runtime.every(() => {
      try {
        callback();
      } catch (error) {
        this.onError(error);
      }
    }, intervalMs);
    this.timerCleanups.add(cancel);
    return cancel;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const cleanup of [...this.frameCleanups]) cleanup();
    for (const cleanup of [...this.timerCleanups]) cleanup();
  }
}

export class AnimationRegistry {
  private readonly animations = new Set<Animation>();
  private paused = false;

  constructor(private readonly onError: ErrorHandler = ignoreError) {}

  get count(): number {
    return this.animations.size;
  }

  animate(
    element: Element,
    keyframes: Keyframe[] | PropertyIndexedKeyframes,
    options?: number | KeyframeAnimationOptions,
  ): Animation | null {
    if (typeof element.animate !== "function") return null;
    try {
      return this.register(element.animate(keyframes, options));
    } catch (error) {
      this.onError(error);
      return null;
    }
  }

  register(animation: Animation): Animation {
    this.animations.add(animation);
    const release = () => this.animations.delete(animation);
    animation.addEventListener?.("finish", release, { once: true });
    animation.addEventListener?.("cancel", release, { once: true });
    if (this.paused) this.runSafely(() => animation.pause());
    return animation;
  }

  pause(): void {
    this.paused = true;
    for (const animation of this.animations) {
      this.runSafely(() => animation.pause());
    }
  }

  resume(): void {
    this.paused = false;
    for (const animation of this.animations) {
      if (animation.playState !== "finished") {
        this.runSafely(() => animation.play());
      }
    }
  }

  cancelAll(): void {
    for (const animation of [...this.animations]) {
      this.runSafely(() => animation.cancel());
    }
    this.animations.clear();
  }

  private runSafely(callback: () => void): void {
    try {
      callback();
    } catch (error) {
      this.onError(error);
    }
  }
}
