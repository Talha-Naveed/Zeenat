import { useRef } from "react";
import { Zeenat, type ZeenatHandle } from "zeenat";
import { createWinterPreset } from "zeenat/presets/winter";

// Stable across renders. A Next.js host should use a client module for this.
const quietWinter = createWinterPreset({
  snow: { count: 14, speed: "slow", drift: 20 },
  sparkles: false,
  lights: false,
});

export function WinterDecoration() {
  const decoration = useRef<ZeenatHandle>(null);
  return (
    <>
      <Zeenat ref={decoration} preset={quietWinter} intensity="low" />
      {/* Controls are siblings, outside the aria-hidden decoration root. */}
      <div aria-label="Decoration controls" role="group">
        <button type="button" onClick={() => decoration.current?.pause()}>
          Pause decoration
        </button>
        <button type="button" onClick={() => decoration.current?.resume()}>
          Resume decoration
        </button>
      </div>
    </>
  );
}
