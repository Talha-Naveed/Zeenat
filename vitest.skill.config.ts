import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "./vitest.config";

// Public-package examples require dist; run after build, separately from source tests.
export default mergeConfig(
  baseConfig,
  defineConfig({ test: { include: ["tests/skill-examples.smoke.js"] } }),
);
