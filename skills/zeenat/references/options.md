# Generated factory options

Generated for Zeenat 0.3.2 by `npm run skill:generate`. Do not edit.
Read only the section for the chosen effect/preset. Signatures omit implementation;
optional arguments correspond to factory defaults. Imports are listed by heading.
Referenced shared types such as `ZeenatEffect`, `ZeenatPreset`, and `ZeenatLayer`
are exported from `zeenat/core`; `CountryFlag` comes from `zeenat/flags`.
Effect option types are declared under their effect subpath; preset option types under their preset subpath.
`FlagOrientation` and flag-design types come from `zeenat/effects/bunting`.
`BuntingBaseOptions` is an internal base shown for completeness, not an import.

## Shared placement

`EffectPlacementOptions` is exported from `zeenat/effects`.

```ts
export interface EffectPlacementOptions {
  readonly layer?: ZeenatLayer;
  readonly order?: number;
}
```

## zeenat/presets/bunting

Source: `src/presets/bunting.ts`.

```ts
export interface BuntingPresetOptions {
  readonly flag: CountryFlag;
  readonly orientation?: FlagOrientation;
}

export function createBuntingPreset({
  flag,
  orientation,
}: BuntingPresetOptions): ZeenatPreset<"bunting">;
```

## zeenat/effects/aircraft

Source: `src/effects/aircraft.ts`.

```ts
export interface AircraftOptions extends EffectPlacementOptions {
  readonly colors?: readonly string[];
  readonly count?: number;
  readonly direction?: "ltr" | "rtl";
  readonly altitude?: readonly [number, number];
}

export function aircraft(options?: AircraftOptions): ZeenatEffect;
```

## zeenat/effects/bunting

Source: `src/effects/bunting.ts`.

```ts
export interface BuntingFlagRenderContext {
  readonly document: Document;
  readonly container: SVGSymbolElement;
  readonly width: number;
  readonly height: number;
  /** Aborted when the owning effect is removed, resized across a breakpoint, or restarted. */
  readonly signal: AbortSignal;
}

export interface BuntingFlagDesign {
  readonly id: string;
  readonly aspectRatio: number;
  render(context: BuntingFlagRenderContext): void | Promise<void>;
}

export type FlagOrientation = "horizontal" | "vertical";

interface BuntingBaseOptions extends EffectPlacementOptions {
  readonly count?: number;
  readonly position?: "top" | "bottom";
  readonly height?: number;
  readonly cableColor?: string;
}

export interface PennantBuntingOptions extends BuntingBaseOptions {
  /** Solid colors used by the decorative pennant mode. */
  readonly colors: readonly string[];
  readonly flags?: never;
  readonly shape?: "pennant" | "swallowtail";
}

export interface FlagBuntingOptions extends BuntingBaseOptions {
  /** Flag artwork used by the country-flag mode. */
  readonly flags: readonly BuntingFlagDesign[];
  /** Vertical rotates the complete artwork 90° clockwise; it never stretches it. */
  readonly orientation?: FlagOrientation;
  readonly colors?: never;
  readonly shape?: never;
}

export type BuntingOptions = PennantBuntingOptions | FlagBuntingOptions;

export function bunting(options: BuntingOptions): ZeenatEffect;
```

## zeenat/effects/falling-leaves

Source: `src/effects/falling-leaves.ts`.

```ts
export interface FallingLeavesOptions extends EffectPlacementOptions {
  readonly colors?: readonly string[];
  readonly count?: number;
  readonly opacity?: number;
  readonly size?: readonly [number, number];
  readonly drift?: number;
  readonly rotation?: number;
  /** Duration multiplier; values below 1 fall faster. */
  readonly fallSpeed?: number;
}

export function fallingLeaves(options?: FallingLeavesOptions): ZeenatEffect;
```

## zeenat/effects/fireworks

Source: `src/effects/fireworks.ts`.

```ts
export interface FireworksOptions extends EffectPlacementOptions {
  readonly colors: readonly string[];
  readonly count?: number;
  readonly maxY?: number;
  readonly particlesPerBurst?: number;
}

export function fireworks(options: FireworksOptions): ZeenatEffect;
```

## zeenat/effects/lanterns

Source: `src/effects/lanterns.ts`.

```ts
export interface LanternsOptions extends EffectPlacementOptions {
  readonly colors?: readonly string[];
  readonly count?: number;
  readonly position?: "top" | "sides";
  readonly glow?: boolean;
  readonly sway?: boolean;
}

export function lanterns(options?: LanternsOptions): ZeenatEffect;
```

## zeenat/effects/petals

Source: `src/effects/petals.ts`.

```ts
export interface PetalsOptions extends EffectPlacementOptions {
  readonly colors?: readonly string[];
  readonly count?: number;
  readonly opacity?: number;
  readonly size?: readonly [number, number];
  /** Horizontal travel in CSS pixels. */
  readonly drift?: number;
  /** Maximum rotation per fall cycle in degrees. */
  readonly rotation?: number;
  /** Duration multiplier; values below 1 fall faster. */
  readonly fallSpeed?: number;
}

export function petals(options?: PetalsOptions): ZeenatEffect;
```

## zeenat/effects/snow

Source: `src/effects/snow.ts`.

```ts
export interface SnowOptions extends EffectPlacementOptions {
  readonly colors?: readonly string[];
  readonly count?: number;
  readonly size?: readonly [number, number];
  readonly opacity?: number;
  readonly speed?: "slow" | "medium" | "fast";
  readonly drift?: number;
}

export function snow(options?: SnowOptions): ZeenatEffect;
```

## zeenat/effects/sparkles

Source: `src/effects/sparkles.ts`.

```ts
export interface SparklesOptions extends EffectPlacementOptions {
  readonly colors: readonly string[];
  readonly count?: number;
  readonly shape?: "circle" | "diamond" | "star";
  readonly maxY?: number;
  readonly opacity?: number;
}

export function sparkles(options: SparklesOptions): ZeenatEffect;
```

## zeenat/effects/string-lights

Source: `src/effects/string-lights.ts`.

```ts
export interface StringLightsOptions extends EffectPlacementOptions {
  readonly colors?: readonly string[];
  readonly count?: number;
  /** Approximate bulb spacing in CSS pixels when count is omitted. */
  readonly spacing?: number;
  readonly position?: "top" | "bottom";
  readonly depth?: number;
  readonly twinkle?: boolean;
}

export function stringLights(options?: StringLightsOptions): ZeenatEffect;
```

## zeenat/presets/autumn

Source: `src/presets/autumn.ts`.

```ts
export interface AutumnPresetOptions {
  readonly leaves?: FallingLeavesOptions | false;
  readonly accents?: SparklesOptions | false;
}

export function createAutumnPreset(
  options?: AutumnPresetOptions,
): ZeenatPreset<"autumn">;
```

## zeenat/presets/festive-lights

Source: `src/presets/festive-lights.ts`.

```ts
export interface FestiveLightsPresetOptions {
  readonly lights?: StringLightsOptions | false;
  readonly lanterns?: LanternsOptions | false;
  readonly accents?: SparklesOptions | false;
}

export function createFestiveLightsPreset(
  options?: FestiveLightsPresetOptions,
): ZeenatPreset<"festive-lights">;
```

## zeenat/presets/pakistan-defence-day

Source: `src/presets/pakistan-defence-day.ts`.

```ts
export function createPakistanDefenceDayPreset(options?: {
  readonly orientation?: FlagOrientation;
}): ZeenatPreset<"pakistan-defence-day">;
```

## zeenat/presets/pakistan-independence-day

Source: `src/presets/pakistan-independence-day.ts`.

```ts
export function createPakistanIndependenceDayPreset(options?: {
  readonly orientation?: FlagOrientation;
}): ZeenatPreset<"pakistan-independence-day">;
```

## zeenat/presets/spring

Source: `src/presets/spring.ts`.

```ts
export interface SpringPresetOptions {
  readonly petals?: PetalsOptions | false;
  readonly accents?: SparklesOptions | false;
}

export function createSpringPreset(
  options?: SpringPresetOptions,
): ZeenatPreset<"spring">;
```

## zeenat/presets/us-independence-day

Source: `src/presets/us-independence-day.ts`.

```ts
export function createUsIndependenceDayPreset(options?: {
  readonly orientation?: FlagOrientation;
}): ZeenatPreset<"us-independence-day">;
```

## zeenat/presets/winter

Source: `src/presets/winter.ts`.

```ts
export interface WinterPresetOptions {
  readonly snow?: SnowOptions | false;
  readonly lights?: StringLightsOptions | false;
  readonly sparkles?: SparklesOptions | false;
}

export function createWinterPreset(
  options?: WinterPresetOptions,
): ZeenatPreset<"winter">;
```
