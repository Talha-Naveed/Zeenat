import { expect, test, type Page } from "@playwright/test";

const scenes = [
  "pakistan-defence-day",
  "pakistan-independence-day",
  "us-independence-day",
  "snow",
  "petals",
  "lanterns",
  "string-lights",
  "falling-leaves",
] as const;

for (const [flag, orientation, width] of [
  ["pakistan", "vertical", 390],
  ["japan", "horizontal", 1440],
  ["palestine", "vertical", 1440],
] as const) {
  test(`@visual bunting ${flag} ${orientation}`, async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "Visual baselines use Chromium.");
    await page.setViewportSize({ width, height: 900 });
    await page.goto(
      `/?scene=bunting&flag=${flag}&orientation=${orientation}&motion=reduced`,
    );
    await expect(
      page.locator("symbol[data-zeenat-flag-status='ready']"),
    ).toHaveCount(1);
    await expect(page).toHaveScreenshot(`bunting-${flag}-${orientation}.png`, {
      animations: "allow",
    });
  });
}

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
