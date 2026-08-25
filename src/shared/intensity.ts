import type {
  MotionPreference,
  ViewportSnapshot,
  ZeenatIntensity,
} from "./types";

const INTENSITY_SCALE: Readonly<Record<ZeenatIntensity, number>> = {
  low: 0.6,
  medium: 1,
  high: 1.5,
};

export function assertIntensity(
  value: unknown,
): asserts value is ZeenatIntensity {
  if (value !== "low" && value !== "medium" && value !== "high") {
    throw new TypeError(`Invalid Zeenat intensity: ${String(value)}`);
  }
}

export function intensityScale(intensity: ZeenatIntensity): number {
  return INTENSITY_SCALE[intensity];
}

export function scaleEffectCount(
  baseCount: number,
  intensity: ZeenatIntensity,
  viewport: Pick<ViewportSnapshot, "isSmall">,
  motion: MotionPreference,
  minimum = 1,
): number {
  const viewportScale = viewport.isSmall ? 0.65 : 1;
  const motionScale = motion === "reduced" ? 0.3 : 1;
  return Math.max(
    minimum,
    Math.round(
      baseCount * intensityScale(intensity) * viewportScale * motionScale,
    ),
  );
}
