import { zeenat } from "zeenat/vanilla";

const decoration = zeenat({
  preset: "us-independence-day",
  intensity: "medium",
});

document.querySelector("#pause")?.addEventListener("click", () => {
  decoration.pause();
});

document.querySelector("#resume")?.addEventListener("click", () => {
  decoration.resume();
});

window.addEventListener("pagehide", () => decoration.destroy(), { once: true });
