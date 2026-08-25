import { expect, test, type Page } from "@playwright/test";

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1440, height: 900 },
  { name: "desktop", width: 1920, height: 1080 },
] as const;

async function waitForScene(page: Page): Promise<void> {
  await page.waitForFunction(
    () => window.__ZEENAT_TEST__?.diagnostics()?.state === "running",
  );
}

for (const preset of ["pakistan-defence-day", "us-independence-day"] as const) {
  for (const viewport of viewports) {
    test(`${preset} is overlay-safe at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(`/?scene=${preset}&motion=full`);
      await waitForScene(page);
      const root = page.locator("[data-zeenat-root]");
      await expect(root).toHaveCSS("position", "fixed");
      await expect(root).toHaveCSS("pointer-events", "none");
      await expect(root).toHaveAttribute("aria-hidden", "true");
      expect(await root.locator("[data-zeenat-effect]").count()).toBe(3);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      const box = await root.boundingBox();
      expect(box?.width).toBeCloseTo(viewport.width, 0);
      expect(box?.height).toBeCloseTo(viewport.height, 0);
    });
  }
}

test("host controls, sticky navigation, and modal remain interactive", async ({
  page,
}) => {
  await page.goto("/?scene=festive-lights&motion=full");
  await waitForScene(page);
  await page.locator("#host-button").click();
  await expect(page.locator("#click-count")).toHaveText("1");
  await page.locator("#host-input").fill("still interactive");
  await expect(page.locator("#host-input")).toHaveValue("still interactive");
  await page.locator("#host-select").selectOption("bright");
  await page.locator("#open-modal").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.locator("#close-modal").click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("mounting does not move host layout and unmount removes every effect", async ({
  page,
}) => {
  await page.goto("/?scene=winter&motion=full");
  await waitForScene(page);
  await page.evaluate(() => window.__ZEENAT_TEST__?.unmount());
  await expect(page.locator("[data-zeenat-root]")).toHaveCount(0);
  const before = await page.evaluate(() =>
    window.__ZEENAT_TEST__!.probeRect().toJSON(),
  );
  await page.evaluate(() => window.__ZEENAT_TEST__?.remount());
  await waitForScene(page);
  const after = await page.evaluate(() =>
    window.__ZEENAT_TEST__!.probeRect().toJSON(),
  );
  expect(after.x).toBeCloseTo(before.x, 3);
  expect(after.y).toBeCloseTo(before.y, 3);
  expect(after.width).toBeCloseTo(before.width, 3);
  expect(after.height).toBeCloseTo(before.height, 3);
  await page.evaluate(() => window.__ZEENAT_TEST__?.unmount());
  await expect(page.locator("[data-zeenat-effect]")).toHaveCount(0);
});

test("responsive density decreases after crossing to mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?scene=winter&motion=full");
  await waitForScene(page);
  const desktopNodes = await page.evaluate(
    () => window.__ZEENAT_TEST__!.diagnostics()!.domNodes,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(
    (previous) => window.__ZEENAT_TEST__!.diagnostics()!.domNodes < previous,
    desktopNodes,
  );
  const mobileNodes = await page.evaluate(
    () => window.__ZEENAT_TEST__!.diagnostics()!.domNodes,
  );
  expect(mobileNodes).toBeLessThan(desktopNodes);
});

test("bunting spans the viewport and aircraft reaches the visible flight path", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?scene=pakistan-defence-day&motion=full");
  await waitForScene(page);
  const buntingBox = await page
    .locator("[data-zeenat-effect='bunting'] svg")
    .boundingBox();
  expect(buntingBox?.width).toBeCloseTo(1440, 0);

  const visibleAircraft = await page.evaluate(() => {
    const layer = document.querySelector("[data-zeenat-effect='aircraft']");
    if (!layer) return false;
    for (const animation of document.getAnimations()) {
      const target = (animation.effect as KeyframeEffect | null)?.target;
      if (!(target instanceof Element) || !layer.contains(target)) continue;
      const timing = animation.effect?.getTiming();
      const duration =
        typeof timing?.duration === "number" ? timing.duration : 10_000;
      animation.currentTime = (timing?.delay ?? 0) + duration * 0.5;
      animation.pause();
    }
    return [...layer.children].some((node) => {
      const box = node.getBoundingClientRect();
      return box.right > 0 && box.left < window.innerWidth;
    });
  });
  expect(visibleAircraft).toBe(true);
});

test("strict CSP produces no policy violations or console errors", async ({
  page,
}) => {
  const errors: string[] = [];
  const violations: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.addInitScript(() => {
    window.addEventListener("securitypolicyviolation", (event) => {
      document.documentElement.dataset.cspViolation = `${event.violatedDirective}:${event.blockedURI}`;
    });
  });
  const response = await page.goto("/?scene=spring&motion=full");
  await waitForScene(page);
  await page.waitForTimeout(100);
  const marker = await page.locator("html").getAttribute("data-csp-violation");
  if (marker) violations.push(marker);
  expect(response?.headers()["content-security-policy"]).toContain(
    "style-src 'self'",
  );
  expect(violations).toEqual([]);
  expect(errors).toEqual([]);
});
