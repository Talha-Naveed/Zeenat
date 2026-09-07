import { applyStyles, readViewport } from "../shared/dom";
import { ZeenatError } from "../shared/errors";
import { assertIntensity } from "../shared/intensity";
import { createRandom, normalizeSeed } from "../shared/random";
import type {
  CleanupFunction,
  EffectContext,
  MotionPreference,
  ViewportSnapshot,
  ZeenatController,
  ZeenatDiagnosticsListener,
  ZeenatDiagnosticsSnapshot,
  ZeenatEffectDiagnostics,
  ZeenatEngineState,
  ZeenatIntensity,
  ZeenatLayer,
  ZeenatMotionMode,
  ZeenatOptions,
  ZeenatPreset,
} from "../shared/types";
import { resolvePreset } from "../presets/registry";
import { EffectRuntimeScope } from "./effect-scope";
import { RuntimeScheduler } from "./scheduler";
import { parseSchedule } from "./schedule";
import { observeNavbar, validateNavbar } from "./navbar";

const MAX_TIMER_DELAY = 2_147_483_647;

const LAYER_BASE: Readonly<Record<ZeenatLayer, number>> = {
  background: 0,
  ambient: 1_000,
  foreground: 2_000,
  top: 3_000,
};

export interface SceneEngineOptions extends ZeenatOptions {
  readonly document: Document;
  readonly root?: HTMLElement;
  readonly mountTarget?: HTMLElement;
  readonly className?: string;
}

export class SceneEngine {
  private readonly document: Document;
  private readonly view: Window;
  private readonly preset: ZeenatPreset;
  private readonly suppliedRoot: HTMLElement | undefined;
  private readonly mountTarget: HTMLElement | undefined;
  private readonly className: string | undefined;
  private readonly schedule: ReturnType<typeof parseSchedule>;
  private readonly baseSeed: number;
  private readonly duration: number | "infinite";
  private readonly zIndex: number;
  private readonly navbar: string | false;
  private navbarCleanup: CleanupFunction | undefined;
  private readonly respectReducedMotion: boolean;
  private readonly motionMode: ZeenatMotionMode;
  private readonly enabled: boolean;
  private readonly debug: boolean;
  private root: HTMLElement | null = null;
  private stateValue: ZeenatEngineState = "idle";
  private intensity: ZeenatIntensity;
  private motion: MotionPreference = "full";
  private manualPaused = false;
  private hiddenPaused = false;
  private scheduler: RuntimeScheduler | null = null;
  private effectScopes: EffectRuntimeScope[] = [];
  private failedEffects: ZeenatEffectDiagnostics[] = [];
  private resizeCallbacks = new Set<(viewport: ViewportSnapshot) => void>();
  private viewport: ViewportSnapshot;
  private environmentCleanups: CleanupFunction[] = [];
  private readonly diagnosticsListeners = new Set<ZeenatDiagnosticsListener>();
  private durationTimer: number | null = null;
  private durationDeadline: number | null = null;
  private scheduleTimer: number | null = null;
  private resizeFrame: number | null = null;

  constructor(options: SceneEngineOptions) {
    const view = options.document.defaultView;
    if (!view) throw new ZeenatError("Zeenat requires a browser document.");
    this.document = options.document;
    this.view = view;
    this.preset = resolvePreset(options.preset, options);
    this.suppliedRoot = options.root;
    this.mountTarget = options.mountTarget;
    this.className = options.className;
    this.intensity = options.intensity ?? "medium";
    assertIntensity(this.intensity);
    this.duration = options.duration ?? "infinite";
    if (
      this.duration !== "infinite" &&
      (!Number.isFinite(this.duration) || this.duration <= 0)
    ) {
      throw new ZeenatError(
        "duration must be a positive number or `infinite`.",
      );
    }
    this.zIndex = options.zIndex ?? 1000;
    this.navbar = options.navbar ?? "auto";
    validateNavbar(this.document, this.navbar);
    if (!Number.isFinite(this.zIndex)) {
      throw new ZeenatError("zIndex must be a finite number.");
    }
    this.respectReducedMotion = options.respectReducedMotion ?? true;
    this.motionMode =
      options.motion ?? (this.respectReducedMotion ? "system" : "full");
    this.enabled = options.enabled ?? true;
    this.debug = options.debug ?? false;
    this.schedule = parseSchedule(options.activeFrom, options.activeUntil);
    this.baseSeed = normalizeSeed(
      options.seed ?? Math.floor(Math.random() * 4_294_967_295),
    );
    this.viewport = readViewport(this.document);
  }

  get state(): ZeenatEngineState {
    return this.stateValue;
  }

  mount(): ZeenatController {
    if (this.stateValue !== "idle") return this.controller();
    if (this.suppliedRoot) {
      this.root = this.suppliedRoot;
      this.configureRoot(this.root);
    }
    if (!this.enabled) {
      this.stateValue = "stopped";
      this.publishDiagnostics();
      return this.controller();
    }
    this.setupEnvironment();
    this.reconcileSchedule();
    return this.controller();
  }

  pause(): void {
    if (this.stateValue !== "running" && this.stateValue !== "paused") return;
    this.manualPaused = true;
    this.syncPauseState();
  }

  resume(): void {
    if (this.stateValue !== "running" && this.stateValue !== "paused") return;
    this.manualPaused = false;
    this.syncPauseState();
  }

  restart(): void {
    if (this.stateValue === "destroyed" || !this.enabled) return;
    const now = Date.now();
    if (!this.isScheduledNow(now)) {
      this.reconcileSchedule();
      return;
    }
    this.stopEffects();
    this.startEffects();
  }

  setIntensity(intensity: ZeenatIntensity): void {
    assertIntensity(intensity);
    if (this.intensity === intensity || this.stateValue === "destroyed") return;
    this.intensity = intensity;
    if (this.stateValue === "running" || this.stateValue === "paused") {
      this.restart();
    } else {
      this.publishDiagnostics();
    }
  }

  getDiagnostics(): ZeenatDiagnosticsSnapshot {
    const effects = Object.freeze([
      ...this.effectScopes.map((scope) => scope.diagnostics()),
      ...this.failedEffects,
    ]);
    return Object.freeze({
      preset: this.preset.id,
      state: this.stateValue,
      intensity: this.intensity,
      motion: this.motion,
      viewport: Object.freeze({ ...this.viewport }),
      seed: this.baseSeed,
      domNodes: this.root ? this.root.querySelectorAll("*").length : 0,
      animations: effects.reduce(
        (total, effect) => total + effect.animations,
        0,
      ),
      timers: effects.reduce((total, effect) => total + effect.timers, 0),
      rafLoops: effects.reduce((total, effect) => total + effect.rafLoops, 0),
      effects,
    });
  }

  subscribeDiagnostics(listener: ZeenatDiagnosticsListener): CleanupFunction {
    if (this.stateValue === "destroyed") return () => undefined;
    this.diagnosticsListeners.add(listener);
    listener(this.getDiagnostics());
    return () => this.diagnosticsListeners.delete(listener);
  }

  destroy(): void {
    if (this.stateValue === "destroyed") return;
    this.clearScheduleTimer();
    this.stopEffects();
    for (const cleanup of this.environmentCleanups.splice(0).reverse())
      cleanup();
    if (this.resizeFrame !== null) {
      this.view.cancelAnimationFrame(this.resizeFrame);
      this.resizeFrame = null;
    }
    if (this.root && !this.suppliedRoot) this.root.remove();
    this.root = null;
    this.stateValue = "destroyed";
    this.publishDiagnostics();
    this.diagnosticsListeners.clear();
  }

  private controller(): ZeenatController {
    const getState = () => this.state;
    return {
      get state() {
        return getState();
      },
      pause: () => this.pause(),
      resume: () => this.resume(),
      restart: () => this.restart(),
      destroy: () => this.destroy(),
      setIntensity: (intensity) => this.setIntensity(intensity),
      getDiagnostics: () => this.getDiagnostics(),
      subscribeDiagnostics: (listener) => this.subscribeDiagnostics(listener),
    };
  }

  private setupEnvironment(): void {
    this.hiddenPaused = this.document.visibilityState === "hidden";
    const media =
      this.motionMode === "system" && this.respectReducedMotion
        ? this.view.matchMedia?.("(prefers-reduced-motion: reduce)")
        : undefined;
    this.motion =
      this.motionMode === "system"
        ? media?.matches
          ? "reduced"
          : "full"
        : this.motionMode;

    if (media) {
      const onMotionChange = (event: MediaQueryListEvent) => {
        const nextMotion: MotionPreference = event.matches ? "reduced" : "full";
        if (nextMotion === this.motion) return;
        this.motion = nextMotion;
        if (this.stateValue === "running" || this.stateValue === "paused") {
          this.restart();
        }
      };
      media.addEventListener("change", onMotionChange);
      this.environmentCleanups.push(() =>
        media.removeEventListener("change", onMotionChange),
      );
    }

    const onVisibility = () => {
      this.hiddenPaused = this.document.visibilityState === "hidden";
      this.syncPauseState();
    };
    this.document.addEventListener("visibilitychange", onVisibility);
    this.environmentCleanups.push(() =>
      this.document.removeEventListener("visibilitychange", onVisibility),
    );

    const onResize = () => {
      if (this.resizeFrame !== null) return;
      this.resizeFrame = this.view.requestAnimationFrame(() => {
        this.resizeFrame = null;
        const previous = this.viewport;
        this.viewport = readViewport(this.document);
        for (const callback of [...this.resizeCallbacks])
          callback(this.viewport);
        if (
          previous.isSmall !== this.viewport.isSmall &&
          (this.stateValue === "running" || this.stateValue === "paused")
        ) {
          this.restart();
        } else {
          this.publishDiagnostics();
        }
      });
    };
    this.view.addEventListener("resize", onResize, { passive: true });
    this.environmentCleanups.push(() =>
      this.view.removeEventListener("resize", onResize),
    );
  }

  private reconcileSchedule(): void {
    this.clearScheduleTimer();
    const now = Date.now();
    if (!this.isScheduledNow(now)) {
      this.stopEffects();
      this.stateValue = "stopped";
      if (this.schedule.from !== null && now < this.schedule.from) {
        this.armScheduleTimer(this.schedule.from - now);
      }
      this.publishDiagnostics();
      return;
    }

    if (this.stateValue !== "running" && this.stateValue !== "paused") {
      this.startEffects();
    }
    if (this.schedule.until !== null) {
      this.armScheduleTimer(this.schedule.until - now);
    }
  }

  private isScheduledNow(now: number): boolean {
    if (this.schedule.from !== null && now < this.schedule.from) return false;
    return this.schedule.until === null || now < this.schedule.until;
  }

  private armScheduleTimer(delay: number): void {
    this.scheduleTimer = this.view.setTimeout(
      () => this.reconcileSchedule(),
      Math.min(MAX_TIMER_DELAY, Math.max(0, delay)),
    );
  }

  private clearScheduleTimer(): void {
    if (this.scheduleTimer === null) return;
    this.view.clearTimeout(this.scheduleTimer);
    this.scheduleTimer = null;
  }

  private startEffects(): void {
    const root = this.ensureRoot();
    this.viewport = readViewport(this.document);
    this.failedEffects = [];
    this.scheduler = new RuntimeScheduler(this.view, (error) =>
      this.reportError("scheduler", "runtime callback", error),
    );

    this.preset.effects.forEach((effect, index) => {
      const semanticLayer = effect.layer ?? "ambient";
      const layer = this.document.createElement("div");
      layer.dataset.zeenatEffect = effect.id;
      layer.dataset.zeenatLayer = semanticLayer;
      layer.setAttribute("aria-hidden", "true");
      applyStyles(layer, {
        position: "absolute",
        inset: "0",
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: String(LAYER_BASE[semanticLayer] + (effect.order ?? index)),
      });
      root.append(layer);

      const scope = new EffectRuntimeScope(
        effect,
        layer,
        semanticLayer,
        this.scheduler!,
        (error, phase) => this.reportError(effect.id, phase, error),
      );
      const random = createRandom(this.baseSeed + (index + 1) * 2_654_435_761);
      const context: EffectContext = {
        root,
        layer,
        intensity: this.intensity,
        motion: this.motion,
        scheduler: scope.scheduler,
        signal: scope.controller.signal,
        viewport: this.viewport,
        random: () => random.next(),
        randomBetween: (min, max) => random.between(min, max),
        animate: (element, keyframes, options) =>
          scope.animations.animate(element, keyframes, options),
        registerAnimation: (animation) => scope.animations.register(animation),
        onResize: (callback) => {
          const guarded = (viewport: ViewportSnapshot) => {
            try {
              callback(viewport);
            } catch (error) {
              this.reportError(effect.id, "resize callback", error);
            }
          };
          this.resizeCallbacks.add(guarded);
          return scope.track(() => this.resizeCallbacks.delete(guarded));
        },
      };

      try {
        scope.setCleanup(effect.mount(context));
        this.effectScopes.push(scope);
      } catch (error) {
        scope.dispose();
        const message = error instanceof Error ? error.message : String(error);
        this.failedEffects.push({
          id: effect.id,
          layer: semanticLayer,
          status: "failed",
          domNodes: 0,
          animations: 0,
          timers: 0,
          rafLoops: 0,
          error: message,
        });
        this.reportError(effect.id, "mount", error);
      }
    });

    if (
      this.navbar !== false &&
      this.effectScopes.some(
        (scope) => scope.layer.dataset.zeenatEffect === "bunting",
      )
    ) {
      this.navbarCleanup = observeNavbar(root, this.navbar);
    }
    this.stateValue = "running";
    if (this.duration !== "infinite") {
      this.durationDeadline = Date.now() + this.duration;
      this.armDurationTimer();
    }
    this.syncPauseState();
    this.publishDiagnostics();
  }

  private armDurationTimer(): void {
    if (this.durationDeadline === null) return;
    const remaining = this.durationDeadline - Date.now();
    if (remaining <= 0) {
      this.stopEffects();
      this.stateValue = "stopped";
      this.publishDiagnostics();
      return;
    }
    this.durationTimer = this.view.setTimeout(
      () => {
        this.durationTimer = null;
        this.armDurationTimer();
      },
      Math.min(MAX_TIMER_DELAY, remaining),
    );
  }

  private stopEffects(): void {
    this.navbarCleanup?.();
    this.navbarCleanup = undefined;
    if (this.durationTimer !== null) {
      this.view.clearTimeout(this.durationTimer);
      this.durationTimer = null;
    }
    this.durationDeadline = null;
    for (const scope of this.effectScopes.splice(0).reverse()) scope.dispose();
    this.scheduler?.destroy();
    this.scheduler = null;
    this.resizeCallbacks.clear();
    if (this.root && !this.suppliedRoot) {
      this.root.remove();
      this.root = null;
    }
  }

  private syncPauseState(): void {
    if (!this.scheduler) return;
    if (this.manualPaused || this.hiddenPaused) {
      this.scheduler.pause();
      for (const scope of this.effectScopes) scope.pause();
      this.stateValue = "paused";
    } else {
      this.scheduler.resume();
      for (const scope of this.effectScopes) scope.resume();
      this.stateValue = "running";
    }
    this.publishDiagnostics();
  }

  private ensureRoot(): HTMLElement {
    if (this.root) return this.root;
    const root = this.suppliedRoot ?? this.document.createElement("div");
    this.configureRoot(root);
    if (!this.suppliedRoot) {
      const target = this.mountTarget ?? this.document.body;
      if (!target) {
        throw new ZeenatError(
          "Cannot mount Zeenat before document.body exists. Pass a mount target.",
        );
      }
      target.append(root);
    }
    this.root = root;
    return root;
  }

  private configureRoot(root: HTMLElement): void {
    root.dataset.zeenatRoot = this.preset.id;
    root.setAttribute("aria-hidden", "true");
    if (this.debug) root.dataset.zeenatDebug = "true";
    if (this.className) root.className = this.className;
    applyStyles(root, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      overflow: "hidden",
      zIndex: String(this.zIndex),
      contain: "layout style paint",
      isolation: "isolate",
    });
  }

  private reportError(effectId: string, phase: string, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    const detail = this.debug && error instanceof Error ? error : undefined;
    (this.view as Window & { console: Console }).console.error(
      `Zeenat: effect "${effectId}" failed during ${phase}: ${message}`,
      ...(detail ? [detail] : []),
    );
    this.publishDiagnostics();
  }

  private publishDiagnostics(): void {
    if (this.debug && this.root) {
      this.root.dataset.zeenatState = this.stateValue;
    }
    if (this.diagnosticsListeners.size === 0) return;
    const snapshot = this.getDiagnostics();
    for (const listener of [...this.diagnosticsListeners]) {
      try {
        listener(snapshot);
      } catch {
        // A diagnostics observer must never interfere with scene lifecycle.
      }
    }
  }
}
