import { applyStyles } from "../../shared/dom";
import { scaleEffectCount } from "../../shared/intensity";
import type { EffectContext } from "../../shared/types";
import { colorAt } from "../utils";

export interface FallingElementConfig {
  readonly colors: readonly string[];
  readonly count: number;
  readonly minimumCount: number;
  readonly minSize: number;
  readonly maxSize: number;
  readonly minDuration: number;
  readonly maxDuration: number;
  readonly opacity: number;
  readonly drift?: number;
  readonly rotation?: number;
  readonly createMark: (
    document: Document,
    color: string,
    size: number,
    index: number,
  ) => HTMLElement;
}

export function mountFallingElements(
  context: EffectContext,
  config: FallingElementConfig,
): void {
  const document = context.layer.ownerDocument;
  const scaledCount = scaleEffectCount(
    config.count,
    context.intensity,
    context.viewport,
    context.motion,
    context.motion === "reduced"
      ? Math.min(5, config.minimumCount)
      : config.minimumCount,
  );
  const count =
    context.motion === "reduced" ? Math.min(8, scaledCount) : scaledCount;

  for (let index = 0; index < count; index += 1) {
    const wrapper = document.createElement("span");
    const size = context.randomBetween(
      config.minSize,
      context.viewport.isSmall ? config.maxSize * 0.82 : config.maxSize,
    );
    const mark = config.createMark(
      document,
      colorAt(config.colors, index),
      size,
      index,
    );
    const left = context.randomBetween(2, 98);
    const staticTop = context.randomBetween(8, 88);
    applyStyles(wrapper, {
      position: "absolute",
      left: `${left}%`,
      top: context.motion === "reduced" ? `${staticTop}%` : `${-size * 1.5}px`,
      width: `${size}px`,
      height: `${size}px`,
      opacity: String(
        context.motion === "reduced" ? config.opacity * 0.48 : config.opacity,
      ),
      willChange: context.motion === "full" ? "transform, opacity" : "auto",
    });
    wrapper.append(mark);
    context.layer.append(wrapper);

    if (context.motion === "reduced") continue;
    const driftLimit = Math.max(0, config.drift ?? 55);
    const drift = context.randomBetween(-driftLimit, driftLimit);
    const swayLimit = Math.max(1, Math.min(34, driftLimit));
    const sway =
      context.randomBetween(Math.min(12, swayLimit), swayLimit) *
      (index % 2 === 0 ? 1 : -1);
    const rotationLimit = Math.max(0, config.rotation ?? 520);
    const rotation =
      context.randomBetween(rotationLimit * 0.3, rotationLimit) *
      (index % 2 === 0 ? 1 : -1);
    const travel = context.viewport.height + size * 3;
    context.animate(
      wrapper,
      [
        { transform: "translate3d(0, 0, 0) rotate(0deg)", opacity: 0 },
        {
          transform: `translate3d(${sway}px, ${travel * 0.16}px, 0) rotate(${rotation * 0.16}deg)`,
          opacity: config.opacity,
          offset: 0.12,
        },
        {
          transform: `translate3d(${drift - sway}px, ${travel * 0.55}px, 0) rotate(${rotation * 0.58}deg)`,
          opacity: config.opacity,
          offset: 0.56,
        },
        {
          transform: `translate3d(${drift}px, ${travel}px, 0) rotate(${rotation}deg)`,
          opacity: config.opacity * 0.2,
        },
      ],
      {
        duration: context.randomBetween(config.minDuration, config.maxDuration),
        delay: context.randomBetween(-config.maxDuration, 0),
        iterations: Infinity,
        easing: "linear",
      },
    );
  }
}
