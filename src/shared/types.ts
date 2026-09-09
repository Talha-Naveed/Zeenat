export type ZeenatIntensity = "low" | "medium" | "high";

export type ZeenatDuration = number | "infinite";

export type MotionPreference = "full" | "reduced";

export type ZeenatMotionMode = "system" | MotionPreference;

export type ZeenatLayer = "background" | "ambient" | "foreground" | "top";

export type CleanupFunction = () => void;

export type ZeenatEngineState =
  "idle" | "running" | "paused" | "stopped" | "destroyed";

export interface ViewportSnapshot {
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
  readonly isSmall: boolean;
}

export interface ZeenatScheduler {
  frame(
    callback: (deltaMs: number, timestamp: number) => void,
  ): CleanupFunction;
  delay(callback: () => void, delayMs: number): CleanupFunction;
  every(callback: () => void, intervalMs: number): CleanupFunction;
}

export interface EffectContext {
  readonly root: HTMLElement;
  readonly layer: HTMLElement;
  readonly intensity: ZeenatIntensity;
  readonly motion: MotionPreference;
  readonly scheduler: ZeenatScheduler;
  readonly signal: AbortSignal;
  readonly viewport: ViewportSnapshot;
  random(): number;
  randomBetween(min: number, max: number): number;
  animate(
    element: Element,
    keyframes: Keyframe[] | PropertyIndexedKeyframes,
    options?: number | KeyframeAnimationOptions,
  ): Animation | null;
  registerAnimation(animation: Animation): Animation;
  onResize(callback: (viewport: ViewportSnapshot) => void): CleanupFunction;
}

export interface ZeenatEffect {
  readonly id: string;
  readonly layer?: ZeenatLayer;
  readonly order?: number;
  readonly mount: (context: EffectContext) => void | CleanupFunction;
}

export interface ZeenatPreset<Id extends string = string> {
  readonly id: Id;
  readonly name: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly region?: string;
  readonly occasion?: string;
  readonly season?: string;
  readonly author?: string;
  readonly effects: readonly ZeenatEffect[];
}

export type BuiltInPresetName =
  | "bunting"
  | "pakistan-defence-day"
  | "pakistan-independence-day"
  | "us-independence-day"
  | "winter"
  | "autumn"
  | "spring"
  | "festive-lights";

export type ZeenatPresetInput = BuiltInPresetName | ZeenatPreset;

export interface ZeenatOptions {
  preset: ZeenatPresetInput;
  /** Required by the bunting preset. Use a country slug or two-letter code. */
  flag?: CountryFlag;
  /** Supported by bunting and the three national occasion presets. */
  orientation?: FlagOrientation;
  /** Keep top bunting below visible navigation. Defaults to "auto"; accepts a CSS selector or false. */
  navbar?: string | false;
  intensity?: ZeenatIntensity;
  duration?: ZeenatDuration;
  zIndex?: number;
  respectReducedMotion?: boolean;
  /** Explicit override intended for previews and user-controlled motion settings. */
  motion?: ZeenatMotionMode;
  enabled?: boolean;
  seed?: number;
  activeFrom?: string | Date;
  activeUntil?: string | Date;
  debug?: boolean;
}

export type ZeenatEffectStatus = "mounted" | "failed";

export interface ZeenatEffectDiagnostics {
  readonly id: string;
  readonly layer: ZeenatLayer;
  readonly status: ZeenatEffectStatus;
  readonly domNodes: number;
  readonly animations: number;
  readonly timers: number;
  readonly rafLoops: number;
  readonly error?: string;
}

export interface ZeenatDiagnosticsSnapshot {
  readonly preset: string;
  readonly state: ZeenatEngineState;
  readonly intensity: ZeenatIntensity;
  readonly motion: MotionPreference;
  readonly viewport: ViewportSnapshot;
  readonly seed: number;
  readonly domNodes: number;
  readonly animations: number;
  readonly timers: number;
  readonly rafLoops: number;
  readonly effects: readonly ZeenatEffectDiagnostics[];
}

export type ZeenatDiagnosticsListener = (
  snapshot: ZeenatDiagnosticsSnapshot,
) => void;

export interface ZeenatController {
  readonly state: ZeenatEngineState;
  pause(): void;
  resume(): void;
  restart(): void;
  destroy(): void;
  setIntensity(intensity: ZeenatIntensity): void;
  getDiagnostics(): ZeenatDiagnosticsSnapshot;
  subscribeDiagnostics(listener: ZeenatDiagnosticsListener): CleanupFunction;
}

export interface DefinePresetInput<Id extends string> {
  readonly id: Id;
  readonly name: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly region?: string;
  readonly occasion?: string;
  readonly season?: string;
  readonly author?: string;
  readonly effects: readonly ZeenatEffect[];
}

export interface PresetValidationIssue {
  readonly level: "error" | "warning";
  readonly path: string;
  readonly message: string;
}

export interface PresetValidationResult {
  readonly valid: boolean;
  readonly issues: readonly PresetValidationIssue[];
}
import type { FlagOrientation } from "../effects/bunting";
import type { CountryFlag } from "../flags";
