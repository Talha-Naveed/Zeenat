import { expect, test } from "@playwright/test";

test("performance budgets stay bounded across repeated lifecycle changes", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Performance sampling is normalized on Chromium.",
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?scene=winter&motion=full");
  await page.waitForFunction(
    () => window.__ZEENAT_TEST__?.diagnostics()?.state === "running",
  );
  const diagnostics = await page.evaluate(() =>
    window.__ZEENAT_TEST__!.diagnostics()!,
  );
  expect(diagnostics.domNodes).toBeLessThanOrEqual(180);
  expect(diagnostics.animations).toBeLessThanOrEqual(100);
  expect(diagnostics.timers).toBeLessThanOrEqual(10);
  expect(diagnostics.rafLoops).toBeLessThanOrEqual(2);

  for (let index = 0; index < 12; index += 1) {
    await page.evaluate(() => window.__ZEENAT_TEST__?.unmount());
    await page.waitForFunction(
      () => document.querySelectorAll("[data-zeenat-root]").length === 0,
    );
    await page.evaluate(() => window.__ZEENAT_TEST__?.remount());
    await page.waitForFunction(
      () => window.__ZEENAT_TEST__?.diagnostics()?.state === "running",
    );
  }
  expect(await page.locator("[data-zeenat-root]").count()).toBe(1);

  const frameSample = await page.evaluate(async () => {
    const samples: number[] = [];
    let previous = performance.now();
    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        samples.push(now - previous);
        previous = now;
        if (samples.length >= 30) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    return (
      samples.slice(1).reduce((total, value) => total + value, 0) /
      (samples.length - 1)
    );
  });
  expect(frameSample).toBeLessThan(50);

  await page.evaluate(() => window.__ZEENAT_TEST__?.unmount());
  await expect(page.locator("[data-zeenat-root]")).toHaveCount(0);
});
