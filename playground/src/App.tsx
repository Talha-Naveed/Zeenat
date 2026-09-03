import { useEffect, useMemo, useRef, useState } from "react";
import {
  definePreset,
  Zeenat,
  type ZeenatDiagnosticsSnapshot,
  type ZeenatHandle,
  type ZeenatIntensity,
  type ZeenatMotionMode,
  type ZeenatPresetInput,
  type CountryFlag,
  type FlagOrientation,
} from "zeenat";
import { flagCatalog } from "zeenat/flags";
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

const PRESET_CHOICES = [
  ["bunting", "Country flag bunting"],
  ["pakistan-defence-day", "Pakistan Defence Day"],
  ["pakistan-independence-day", "Pakistan Independence Day"],
  ["us-independence-day", "US Independence Day"],
  ["winter", "Winter"],
  ["autumn", "Autumn"],
  ["spring", "Spring"],
  ["festive-lights", "Festive Lights"],
] as const;

const EFFECT_PRESETS = {
  "effect-bunting": definePreset({
    id: "demo-bunting",
    name: "Bunting",
    effects: [bunting({ colors: ["#086972", "#f5f0e1", "#d6a84b"] })],
  }),
  "effect-aircraft": definePreset({
    id: "demo-aircraft",
    name: "Aircraft",
    effects: [aircraft({ colors: ["#40566d", "#d9e4ec"], count: 3 })],
  }),
  "effect-sparkles": definePreset({
    id: "demo-sparkles",
    name: "Sparkles",
    effects: [
      sparkles({
        colors: ["#d6a84b", "#f8efd5", "#4f7a7a"],
        shape: "star",
      }),
    ],
  }),
  "effect-fireworks": definePreset({
    id: "demo-fireworks",
    name: "Fireworks",
    effects: [fireworks({ colors: ["#cc6b6b", "#f4deb3", "#557a95"] })],
  }),
  "effect-snow": definePreset({
    id: "demo-snow",
    name: "Snow",
    effects: [snow()],
  }),
  "effect-petals": definePreset({
    id: "demo-petals",
    name: "Petals",
    effects: [petals()],
  }),
  "effect-lanterns": definePreset({
    id: "demo-lanterns",
    name: "Lanterns",
    effects: [lanterns()],
  }),
  "effect-string-lights": definePreset({
    id: "demo-string-lights",
    name: "String Lights",
    effects: [stringLights()],
  }),
  "effect-falling-leaves": definePreset({
    id: "demo-falling-leaves",
    name: "Falling Leaves",
    effects: [fallingLeaves()],
  }),
} as const;

type PresetChoice = (typeof PRESET_CHOICES)[number][0];
type EffectChoice = keyof typeof EFFECT_PRESETS;
type DemoChoice = PresetChoice | EffectChoice;

const DEVICE_PREVIEWS = {
  Mobile: [390, 844],
  Tablet: [768, 1024],
  Laptop: [1440, 900],
  Desktop: [1920, 1080],
} as const;

export function App() {
  const [choice, setChoice] = useState<DemoChoice>("pakistan-defence-day");
  const [flag, setFlag] = useState<CountryFlag>("pakistan");
  const [orientation, setOrientation] = useState<FlagOrientation>("horizontal");
  const supportsOrientation = [
    "bunting",
    "pakistan-defence-day",
    "pakistan-independence-day",
    "us-independence-day",
  ].includes(choice);
  const [intensity, setIntensity] = useState<ZeenatIntensity>("medium");
  const [motion, setMotion] = useState<ZeenatMotionMode>("system");
  const [seed, setSeed] = useState(20260906);
  const [mounted, setMounted] = useState(true);
  const [instance, setInstance] = useState(0);
  const [preview, setPreview] =
    useState<keyof typeof DEVICE_PREVIEWS>("Laptop");
  const [diagnostics, setDiagnostics] =
    useState<ZeenatDiagnosticsSnapshot | null>(null);
  const decorationRef = useRef<ZeenatHandle>(null);

  const preset = useMemo<ZeenatPresetInput>(() => {
    return choice.startsWith("effect-")
      ? EFFECT_PRESETS[choice as EffectChoice]
      : (choice as PresetChoice);
  }, [choice]);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    const update = () =>
      setDiagnostics(decorationRef.current?.getDiagnostics() ?? null);
    const timer = window.setInterval(update, 300);
    update();
    return () => window.clearInterval(timer);
  }, [choice, instance, intensity, motion, mounted, seed]);

  const remount = () => {
    setInstance((value) => value + 1);
    setMounted(true);
  };

  const requestViewport = (name: keyof typeof DEVICE_PREVIEWS) => {
    setPreview(name);
    const [width, height] = DEVICE_PREVIEWS[name];
    window.resizeTo(width, height);
  };

  return (
    <main>
      {mounted ? (
        <Zeenat
          key={instance}
          ref={decorationRef}
          preset={preset}
          {...(choice === "bunting" ? { flag } : {})}
          {...(supportsOrientation ? { orientation } : {})}
          intensity={intensity}
          motion={motion}
          seed={seed}
          zIndex={20}
          debug
        />
      ) : null}

      <section className="hero" aria-labelledby="playground-title">
        <p className="eyebrow">Open-source decoration engine</p>
        <h1 id="playground-title">Zeenat.js</h1>
        <p className="tagline">Adorn the web.</p>
        <p className="intro">
          Exercise presets, isolated effects, lifecycle controls, responsive
          density, and engine diagnostics without adding playground code to the
          package.
        </p>
        <code>{`<Zeenat preset="${choice}"${choice === "bunting" ? ` flag="${flag}"` : ""}${supportsOrientation ? ` orientation="${orientation}"` : ""} />`}</code>
        <p>
          <a href="https://zeenat.xinuty.com">Documentation</a>
        </p>
      </section>

      <div className="workspace">
        <section className="controls" aria-label="Decoration controls">
          <label>
            <span>Preset or effect</span>
            <select
              value={choice}
              onChange={(event) => setChoice(event.target.value as DemoChoice)}
            >
              <optgroup label="Presets">
                {PRESET_CHOICES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Individual effects">
                {Object.keys(EFFECT_PRESETS).map((value) => (
                  <option key={value} value={value}>
                    {EFFECT_PRESETS[value as EffectChoice].name}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>

          {choice === "bunting" ? (
            <label>
              <span>Country flag</span>
              <select
                value={flag}
                onChange={(event) => setFlag(event.target.value as CountryFlag)}
              >
                {[...flagCatalog]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((entry) => (
                    <option key={entry.code} value={entry.slug}>
                      {entry.name} ({entry.code})
                    </option>
                  ))}
              </select>
            </label>
          ) : null}
          {supportsOrientation ? (
            <label>
              <span>Flag orientation</span>
              <select
                value={orientation}
                onChange={(event) =>
                  setOrientation(event.target.value as FlagOrientation)
                }
              >
                <option value="horizontal">Horizontal (landscape)</option>
                <option value="vertical">Vertical (portrait)</option>
              </select>
            </label>
          ) : null}

          <fieldset>
            <legend>Intensity</legend>
            <div className="segmented">
              {(["low", "medium", "high"] as const).map((value) => (
                <button
                  key={value}
                  className={intensity === value ? "selected" : ""}
                  type="button"
                  onClick={() => setIntensity(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </fieldset>

          <label>
            <span>Motion mode</span>
            <select
              value={motion}
              onChange={(event) =>
                setMotion(event.target.value as ZeenatMotionMode)
              }
            >
              <option value="system">System preference</option>
              <option value="full">Full motion</option>
              <option value="reduced">Reduced simulation</option>
            </select>
          </label>

          <label>
            <span>Deterministic seed</span>
            <input
              type="number"
              value={seed}
              onChange={(event) => setSeed(Number(event.target.value) || 1)}
            />
          </label>

          <fieldset className="wide-control">
            <legend>Viewport window</legend>
            <div className="device-grid">
              {Object.keys(DEVICE_PREVIEWS).map((name) => (
                <button
                  key={name}
                  type="button"
                  className={preview === name ? "selected" : ""}
                  onClick={() =>
                    requestViewport(name as keyof typeof DEVICE_PREVIEWS)
                  }
                >
                  {name}
                </button>
              ))}
            </div>
            <small>
              Requests {DEVICE_PREVIEWS[preview][0]} ×{" "}
              {DEVICE_PREVIEWS[preview][1]}; browsers may restrict window
              resizing.
            </small>
          </fieldset>

          <div className="actions wide-control">
            <button
              type="button"
              onClick={() => decorationRef.current?.pause()}
            >
              Pause
            </button>
            <button
              type="button"
              onClick={() => decorationRef.current?.resume()}
            >
              Resume
            </button>
            <button
              type="button"
              onClick={() => decorationRef.current?.restart()}
            >
              Restart
            </button>
            <button
              type="button"
              onClick={() => {
                decorationRef.current?.destroy();
                setDiagnostics(null);
                setMounted(false);
              }}
            >
              Destroy
            </button>
            <button type="button" onClick={remount}>
              Remount
            </button>
          </div>
        </section>

        <aside className="diagnostics" aria-live="polite">
          <div className="panel-heading">
            <p className="eyebrow">Live diagnostics</p>
            <span
              className={`status status-${diagnostics?.state ?? "destroyed"}`}
            >
              {diagnostics?.state ?? "unmounted"}
            </span>
          </div>
          <dl>
            <div>
              <dt>DOM nodes</dt>
              <dd>{diagnostics?.domNodes ?? 0}</dd>
            </div>
            <div>
              <dt>Animations</dt>
              <dd>{diagnostics?.animations ?? 0}</dd>
            </div>
            <div>
              <dt>RAF loops</dt>
              <dd>{diagnostics?.rafLoops ?? 0}</dd>
            </div>
            <div>
              <dt>Timers</dt>
              <dd>{diagnostics?.timers ?? 0}</dd>
            </div>
            <div>
              <dt>Viewport</dt>
              <dd>
                {diagnostics
                  ? `${diagnostics.viewport.width} × ${diagnostics.viewport.height}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Motion</dt>
              <dd>{diagnostics?.motion ?? "—"}</dd>
            </div>
            <div>
              <dt>Seed</dt>
              <dd>{diagnostics?.seed ?? seed}</dd>
            </div>
          </dl>
          <h2>Mounted effects</h2>
          <ul>
            {diagnostics?.effects.map((effect) => (
              <li key={`${effect.id}-${effect.layer}`}>
                <span>{effect.id}</span>
                <small>
                  {effect.layer} · {effect.animations} animations ·{" "}
                  {effect.domNodes} nodes
                </small>
              </li>
            )) ?? <li>None</li>}
          </ul>
        </aside>
      </div>

      <p className="footnote">
        Decorative layers are fixed, inert, aria-hidden, and isolated from React
        rendering.
      </p>
    </main>
  );
}
