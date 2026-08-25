import { SceneEngine } from "../core/engine";
import { ZeenatError } from "../shared/errors";
import type { ZeenatController, ZeenatOptions } from "../shared/types";

export interface VanillaZeenatOptions extends ZeenatOptions {
  readonly mount?: HTMLElement;
  readonly className?: string;
}

export function zeenat(options: VanillaZeenatOptions): ZeenatController {
  const document =
    options.mount?.ownerDocument ??
    (typeof globalThis.document === "undefined" ? null : globalThis.document);
  if (!document) {
    throw new ZeenatError(
      "zeenat() requires a browser document. Importing zeenat/vanilla during SSR is safe; call it after the client mounts.",
    );
  }

  const engine = new SceneEngine({
    ...options,
    document,
    ...(options.mount === undefined ? {} : { mountTarget: options.mount }),
  });
  return engine.mount();
}

export type {
  BuiltInPresetName,
  CleanupFunction,
  ZeenatDiagnosticsListener,
  ZeenatDiagnosticsSnapshot,
  ZeenatController,
  ZeenatDuration,
  ZeenatEngineState,
  ZeenatIntensity,
  ZeenatLayer,
  ZeenatMotionMode,
  ZeenatOptions,
  ZeenatPreset,
  ZeenatPresetInput,
} from "../shared/types";
