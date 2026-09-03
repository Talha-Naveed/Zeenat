import { pakistanFlag, unitedStatesFlag } from "../effects/bunting-flags";
import type {
  BuntingFlagDesign,
  BuntingFlagRenderContext,
} from "../effects/bunting";
import { renderFlag } from "./render";
import { ZeenatError } from "../shared/errors";
import {
  flagCatalog,
  type CountryFlagCode,
  type CountryFlagName,
} from "./catalog";

const aliases = {
  usa: "US",
  america: "US",
  "united-states-of-america": "US",
  uk: "GB",
  britain: "GB",
  "great-britain": "GB",
  turkey: "TR",
  "south-korea": "KR",
  "north-korea": "KP",
  "czech-republic": "CZ",
  "ivory-coast": "CI",
  "east-timor": "TL",
  "cape-verde": "CV",
  burma: "MM",
  swaziland: "SZ",
  "palestinian-territories": "PS",
  "holy-see": "VA",
} as const satisfies Record<string, CountryFlagCode>;

export type CountryFlag =
  | CountryFlagCode
  | Lowercase<CountryFlagCode>
  | CountryFlagName
  | Uppercase<keyof typeof aliases>
  | keyof typeof aliases;
export type { CountryFlagCode, CountryFlagName } from "./catalog";
export { flagCatalog } from "./catalog";

/** Resolve without fetching artwork or accessing browser globals. */
export function resolveFlag(input: string): (typeof flagCatalog)[number] {
  if (typeof input !== "string")
    throw new ZeenatError("flag must be a country name or two-letter code.");
  const normalized = input.trim().toLowerCase().replace(/[ _]+/g, "-");
  const alias = Object.prototype.hasOwnProperty.call(aliases, normalized)
    ? aliases[normalized as keyof typeof aliases]
    : undefined;
  const flag = flagCatalog.find(
    (entry) =>
      entry.code === (alias ?? normalized.toUpperCase()) ||
      entry.slug === normalized,
  );
  if (!flag)
    throw new ZeenatError(
      `Unknown or unsupported flag "${input}". See https://zeenat.xinuty.com or zeenat/flags flagCatalog.`,
    );
  return flag;
}

/** A reusable design; only mounting it requests that country's local JS chunk. */
export function countryFlag(input: CountryFlag): BuntingFlagDesign {
  const { code, slug } = resolveFlag(input);
  if (code === "PK") return pakistanFlag;
  if (code === "US") return unitedStatesFlag;
  return Object.freeze({
    id: slug,
    aspectRatio: 1.5,
    async render(context: BuntingFlagRenderContext) {
      const { flagLoaders } = await import("./loaders");
      if (context.signal.aborted) return;
      const { default: artwork } = await flagLoaders[code]();
      if (context.signal.aborted) return;
      renderFlag(artwork, context);
    },
  });
}
