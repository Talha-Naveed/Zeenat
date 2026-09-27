"use client";

// Import this component in the host layout in place of its other decoration.
// Function-containing presets stay entirely inside this client module.
import { Zeenat } from "zeenat";
import { definePreset } from "zeenat/core";
import { bunting } from "zeenat/effects/bunting";
import { sparkles } from "zeenat/effects/sparkles";

export const anniversary = definePreset({
  id: "company-anniversary",
  name: "Company anniversary",
  description: "Brand pennants with restrained gold accents.",
  tags: ["company", "anniversary"],
  effects: [
    bunting({ colors: ["#172554", "#f8fafc"], shape: "pennant" }),
    sparkles({ colors: ["#eab308", "#f8fafc"], count: 12 }),
  ],
});

export default function AnniversaryDecoration() {
  return <Zeenat preset={anniversary} intensity="low" duration={8_000} />;
}
