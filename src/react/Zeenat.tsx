"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { definePreset } from "../core/definitions";
import { SceneEngine } from "../core/engine";
import type {
  ZeenatController,
  ZeenatEffect,
  ZeenatOptions,
} from "../shared/types";

export interface ZeenatProps extends ZeenatOptions {
  readonly className?: string;
}

export type ZeenatHandle = ZeenatController;

export const Zeenat = forwardRef<ZeenatHandle, ZeenatProps>(
  function Zeenat(props, forwardedRef) {
    const {
      activeFrom,
      activeUntil,
      className,
      debug,
      duration,
      enabled,
      flag,
      intensity,
      motion,
      navbar,
      orientation,
      preset,
      respectReducedMotion,
      seed,
      zIndex,
    } = props;
    const rootRef = useRef<HTMLDivElement>(null);
    const controllerRef = useRef<ZeenatController | null>(null);

    useImperativeHandle(
      forwardedRef,
      () => ({
        get state() {
          return controllerRef.current?.state ?? "idle";
        },
        pause: () => controllerRef.current?.pause(),
        resume: () => controllerRef.current?.resume(),
        restart: () => controllerRef.current?.restart(),
        destroy: () => controllerRef.current?.destroy(),
        setIntensity: (intensity) =>
          controllerRef.current?.setIntensity(intensity),
        getDiagnostics: () => {
          const controller = controllerRef.current;
          if (!controller) {
            throw new Error("Zeenat is not mounted yet.");
          }
          return controller.getDiagnostics();
        },
        subscribeDiagnostics: (listener) =>
          controllerRef.current?.subscribeDiagnostics(listener) ??
          (() => undefined),
      }),
      [],
    );

    useEffect(() => {
      const root = rootRef.current;
      if (!root) return;
      const engine = new SceneEngine({
        document: root.ownerDocument,
        root,
        preset,
        ...(flag === undefined ? {} : { flag }),
        ...(orientation === undefined ? {} : { orientation }),
        ...(activeFrom === undefined ? {} : { activeFrom }),
        ...(activeUntil === undefined ? {} : { activeUntil }),
        ...(className === undefined ? {} : { className }),
        ...(duration === undefined ? {} : { duration }),
        ...(debug === undefined ? {} : { debug }),
        ...(enabled === undefined ? {} : { enabled }),
        ...(intensity === undefined ? {} : { intensity }),
        ...(motion === undefined ? {} : { motion }),
        ...(navbar === undefined ? {} : { navbar }),
        ...(respectReducedMotion === undefined ? {} : { respectReducedMotion }),
        ...(seed === undefined ? {} : { seed }),
        ...(zIndex === undefined ? {} : { zIndex }),
      });
      controllerRef.current = engine.mount();
      return () => {
        engine.destroy();
        controllerRef.current = null;
      };
    }, [
      activeFrom,
      activeUntil,
      className,
      duration,
      debug,
      enabled,
      flag,
      intensity,
      motion,
      navbar,
      orientation,
      preset,
      respectReducedMotion,
      seed,
      zIndex,
    ]);

    const presetId = typeof preset === "string" ? preset : preset.id;

    return (
      <div
        ref={rootRef}
        className={className}
        data-zeenat-root={presetId}
        aria-hidden="true"
      />
    );
  },
);

export interface ZeenatSceneProps extends Omit<
  ZeenatProps,
  "preset" | "flag" | "orientation"
> {
  readonly effects: readonly ZeenatEffect[];
  readonly id?: string;
  readonly name?: string;
}

export const ZeenatScene = forwardRef<ZeenatHandle, ZeenatSceneProps>(
  function ZeenatScene(
    { effects, id = "custom-scene", name = "Custom scene", ...options },
    forwardedRef,
  ) {
    const preset = useMemo(
      () => definePreset({ id, name, effects }),
      [effects, id, name],
    );
    return <Zeenat ref={forwardedRef} preset={preset} {...options} />;
  },
);
