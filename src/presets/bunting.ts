import { definePreset } from "../core/definitions";
import { bunting, type FlagOrientation } from "../effects/bunting";
import { countryFlag, type CountryFlag } from "../flags";

export interface BuntingPresetOptions {
  readonly flag: CountryFlag;
  readonly orientation?: FlagOrientation;
}

export function createBuntingPreset({
  flag,
  orientation = "horizontal",
}: BuntingPresetOptions) {
  return definePreset({
    id: "bunting",
    name: "Country flag bunting",
    description:
      "A responsive cord of country flags, with no additional effects.",
    tags: ["flag-bunting", "decoration"],
    occasion: "Any occasion",
    author: "Zeenat.js contributors",
    effects: [bunting({ flags: [countryFlag(flag)], orientation })],
  });
}
