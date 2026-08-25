import { expect, test, type Page } from "@playwright/test";

const scenes = [
  "pakistan-defence-day",
  "us-independence-day",
  "snow",
  "petals",
  "lanterns",
  "string-lights",
  "falling-leaves",
] as const;

async function freezeAnimations(page: Page) {
  await page.evaluate(() => {
    const animations = document.getAnimations();
    animations.forEach((animation, index) => {
      animation.pause();
      const timing = animation.effect?.getTiming();
      const duration =
        typeof timing?.duration === "number" ? timing.duration : 4_000;
      const delay = timing?.delay ?? 0;
      const completedCycles = Math.ceil(Math.max(0, -delay) / duration);
      const phase = 0.28 + (index / Math.max(1, animations.length - 1)) * 0.4;
      animation.currentTime = delay + duration * (completedCycles + phase);
    });
  });
}

for (const scene of scenes) {
  test(`@visual ${scene} deterministic desktop`, async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "Visual baselines use Chromium.");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/?scene=${scene}&motion=full`);
    await page.waitForFunction(
      () => window.__ZEENAT_TEST__?.diagnostics()?.state === "running",
    );
    await freezeAnimations(page);
    await expect(page).toHaveScreenshot(`${scene}-desktop.png`, {
      animations: "allow",
      fullPage: false,
    });
  });
}

test("@visual winter mobile", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Visual baselines use Chromium.");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?scene=winter&motion=full");
  await page.waitForFunction(
    () => window.__ZEENAT_TEST__?.diagnostics()?.state === "running",
  );
  await freezeAnimations(page);
  await expect(page).toHaveScreenshot("winter-mobile.png", {
    animations: "allow",
    fullPage: false,
  });
});

test("@visual reduced-motion static fallback", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Visual baselines use Chromium.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?scene=spring&motion=reduced");
  await page.waitForFunction(
    () => window.__ZEENAT_TEST__?.diagnostics()?.state === "running",
  );
  await expect(page).toHaveScreenshot("spring-reduced.png", {
    animations: "allow",
    fullPage: false,
  });
});
