import { zeenat } from "zeenat/vanilla";

// Invoke after the host has mounted in the browser. Return cleanup to its router
// or component lifecycle; importing this module does not create any scene.
export function mountDecoration() {
  const decoration = zeenat({
    preset: "bunting",
    flag: "JP",
    orientation: "vertical",
    intensity: "low",
    navbar: "auto",
  });

  return () => decoration.destroy();
}
