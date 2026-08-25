import type {
  CleanupFunction,
  ZeenatEffect,
  ZeenatEffectDiagnostics,
  ZeenatLayer,
} from "../shared/types";
import { AnimationRegistry, ScopedScheduler } from "./scheduler";
import type { RuntimeScheduler } from "./scheduler";

export class EffectRuntimeScope {
  readonly scheduler: ScopedScheduler;
  readonly animations: AnimationRegistry;
  readonly controller = new AbortController();
  private cleanup: CleanupFunction | null = null;
  private readonly disposers = new Set<CleanupFunction>();
  private disposed = false;
  private lastError: string | undefined;

  constructor(
    readonly effect: ZeenatEffect,
    readonly layer: HTMLElement,
    readonly semanticLayer: ZeenatLayer,
    runtime: RuntimeScheduler,
    private readonly onError: (error: unknown, phase: string) => void,
  ) {
    const reportRuntimeError = (error: unknown) => {
      this.lastError = error instanceof Error ? error.message : String(error);
      this.onError(error, "runtime callback");
    };
    this.scheduler = new ScopedScheduler(runtime, reportRuntimeError);
    this.animations = new AnimationRegistry((error) =>
      reportRuntimeError(error),
    );
  }

  setCleanup(cleanup: void | CleanupFunction): void {
    this.cleanup = cleanup ?? null;
  }

  track(cleanup: CleanupFunction): CleanupFunction {
    if (this.disposed) {
      cleanup();
      return () => undefined;
    }
    this.disposers.add(cleanup);
    return () => {
      if (!this.disposers.delete(cleanup)) return;
      cleanup();
    };
  }

  pause(): void {
    this.animations.pause();
  }

  resume(): void {
    this.animations.resume();
  }

  diagnostics(): ZeenatEffectDiagnostics {
    return {
      id: this.effect.id,
      layer: this.semanticLayer,
      status: "mounted",
      domNodes: this.layer.querySelectorAll("*").length,
      animations: this.animations.count,
      timers: this.scheduler.timerCount,
      rafLoops: this.scheduler.frameTaskCount,
      ...(this.lastError === undefined ? {} : { error: this.lastError }),
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.controller.abort();
    if (this.cleanup) {
      try {
        this.cleanup();
      } catch (error) {
        this.onError(error, "cleanup");
      }
      this.cleanup = null;
    }
    for (const cleanup of [...this.disposers].reverse()) {
      try {
        cleanup();
      } catch (error) {
        this.onError(error, "cleanup");
      }
    }
    this.disposers.clear();
    this.scheduler.destroy();
    this.animations.cancelAll();
    this.layer.remove();
  }
}
