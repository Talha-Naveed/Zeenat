import { createRoot } from "react-dom/client";
import { createRef, useEffect, useMemo, useState, type RefObject } from "react";
import { Zeenat, ZeenatScene, type ZeenatHandle } from "zeenat";
import type { CountryFlag, FlagOrientation } from "zeenat";
import {
  aircraft,
  bunting,
  fallingLeaves,
  fireworks,
  lanterns,
  petals,
  snow,
  sparkles,
  stringLights,
} from "zeenat/effects";
import type {
  BuiltInPresetName,
  ZeenatDiagnosticsSnapshot,
  ZeenatEffect,
  ZeenatMotionMode,
} from "zeenat/core";

const effects: Readonly<Record<string, ZeenatEffect>> = {
  "classic-bunting": bunting({ colors: ["#0f766e", "#f8fafc", "#f59e0b"] }),
  aircraft: aircraft(),
  sparkles: sparkles({
    colors: ["#f59e0b", "#38bdf8", "#ffffff"],
    shape: "star",
  }),
  fireworks: fireworks({ colors: ["#ef4444", "#ffffff", "#3b82f6"] }),
  snow: snow(),
  petals: petals(),
  lanterns: lanterns(),
  "string-lights": stringLights(),
  "falling-leaves": fallingLeaves(),
};

interface TestApi {
  diagnostics(): ZeenatDiagnosticsSnapshot | null;
  pause(): void;
  resume(): void;
  restart(): void;
  destroy(): void;
  unmount(): void;
  remount(): void;
  probeRect(): DOMRect;
}

declare global {
  interface Window {
    __ZEENAT_TEST__?: TestApi;
  }
}

function Decoration({
  scene,
  motion,
  decorationRef,
  instanceKey,
  flag,
  orientation,
  navbar,
}: {
  readonly scene: string;
  readonly motion: ZeenatMotionMode;
  readonly decorationRef: RefObject<ZeenatHandle | null>;
  readonly instanceKey: number;
  readonly flag: CountryFlag;
  readonly orientation: FlagOrientation;
  readonly navbar: string | false;
}) {
  const common = {
    ref: decorationRef,
    intensity: "medium" as const,
    motion,
    seed: 12345,
    debug: true,
    navbar,
  };
  const effect = effects[scene];
  return effect ? (
    <ZeenatScene
      key={instanceKey}
      {...common}
      effects={[effect]}
      id={`fixture-${scene}`}
    />
  ) : (
    <Zeenat
      key={instanceKey}
      {...common}
      preset={scene as BuiltInPresetName}
      {...(scene === "bunting" ? { flag } : {})}
      {...([
        "bunting",
        "pakistan-defence-day",
        "pakistan-independence-day",
        "us-independence-day",
      ].includes(scene)
        ? { orientation }
        : {})}
    />
  );
}

function App() {
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const scene = query.get("scene") ?? "pakistan-defence-day";
  const motion = (query.get("motion") ?? "full") as ZeenatMotionMode;
  const [mounted, setMounted] = useState(true);
  const [instanceKey, setInstanceKey] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [modal, setModal] = useState(false);
  const decorationRef = useMemo(() => createRef<ZeenatHandle>(), []);

  useEffect(() => {
    window.__ZEENAT_TEST__ = {
      diagnostics: () => {
        try {
          return decorationRef.current?.getDiagnostics() ?? null;
        } catch {
          // The React imperative handle commits just before the engine effect.
          return null;
        }
      },
      pause: () => decorationRef.current?.pause(),
      resume: () => decorationRef.current?.resume(),
      restart: () => decorationRef.current?.restart(),
      destroy: () => decorationRef.current?.destroy(),
      unmount: () => setMounted(false),
      remount: () => {
        setInstanceKey((value) => value + 1);
        setMounted(true);
      },
      probeRect: () =>
        document.querySelector("[data-layout-probe]")!.getBoundingClientRect(),
    };
    return () => {
      delete window.__ZEENAT_TEST__;
    };
  });

  return (
    <>
      {mounted ? (
        <Decoration
          scene={scene}
          motion={motion}
          decorationRef={decorationRef}
          instanceKey={instanceKey}
          navbar={
            query.get("navbar") === "false"
              ? false
              : (query.get("navbar") ?? "auto")
          }
          flag={(query.get("flag") ?? "pakistan") as CountryFlag}
          orientation={
            (query.get("orientation") ?? "horizontal") as FlagOrientation
          }
        />
      ) : null}
      <nav className="navbar">
        <a href="#content" id="host-link">
          Zeenat fixture
        </a>
        <label>
          Theme
          <select id="host-select" defaultValue="calm">
            <option value="calm">Calm</option>
            <option value="bright">Bright</option>
          </select>
        </label>
      </nav>
      <main id="content">
        <section className="hero" data-layout-probe>
          <p className="eyebrow">Zeenat.js browser verification</p>
          <h1>Decoration must remain behind interaction.</h1>
          <p>
            This host layout deliberately includes controls, overflow edges, and
            a sticky navigation bar.
          </p>
          <div className="controls">
            <button
              id="host-button"
              onClick={() => setClicks((value) => value + 1)}
            >
              Click host control
            </button>
            <button id="open-modal" onClick={() => setModal(true)}>
              Open modal
            </button>
            <input
              id="host-input"
              aria-label="Host input"
              placeholder="Type here"
            />
          </div>
          <output id="click-count">{clicks}</output>
        </section>
        <section className="content-card">
          <h2>Existing application content</h2>
          <p>The decoration root may not change this card's geometry.</p>
        </section>
      </main>
      {modal ? (
        <div className="modal-backdrop" role="presentation">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Test modal"
          >
            <h2>Host modal</h2>
            <button id="close-modal" onClick={() => setModal(false)}>
              Close modal
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
