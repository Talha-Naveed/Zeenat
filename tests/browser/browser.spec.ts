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

for (const preset of [
  "pakistan-defence-day",
  "pakistan-independence-day",
  "us-independence-day",
] as const) {
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

for (const viewport of [viewports[0], viewports[3]]) {
  test(`country-flag bunting stays attached and proportional at ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/?scene=pakistan-defence-day&motion=reduced");
    await waitForScene(page);

    const result = await page.evaluate(() => {
      const svg = document.querySelector<SVGSVGElement>(
        "[data-zeenat-effect='bunting'] svg",
      )!;
      const cable = svg.querySelector<SVGPathElement>(
        "[data-zeenat-bunting-cable]",
      )!;
      const anchors = [
        ...svg.querySelectorAll<SVGGElement>("[data-zeenat-bunting-anchor]"),
      ];
      const length = cable.getTotalLength();
      let maximumGap = 0;
      for (const anchor of anchors) {
        const targetX = Number(anchor.dataset.zeenatAnchorX);
        const targetY = Number(anchor.dataset.zeenatAnchorY);
        let low = 0;
        let high = length;
        for (let step = 0; step < 24; step += 1) {
          const middle = (low + high) / 2;
          if (cable.getPointAtLength(middle).x < targetX) low = middle;
          else high = middle;
        }
        const cablePoint = cable.getPointAtLength((low + high) / 2);
        maximumGap = Math.max(
          maximumGap,
          Math.hypot(cablePoint.x - targetX, cablePoint.y - targetY),
        );
      }

      const centerFlag = anchors[Math.floor(anchors.length / 2)]
        ?.querySelector<SVGUseElement>("[data-zeenat-flag='pakistan']")
        ?.getBoundingClientRect();
      return {
        count: anchors.length,
        kind: svg.dataset.zeenatBuntingKind,
        maximumGap,
        flagRatio: centerFlag ? centerFlag.width / centerFlag.height : 0,
      };
    });

    expect(result.kind).toBe("flags");
    expect(result.count).toBeGreaterThanOrEqual(6);
    expect(result.maximumGap).toBeLessThan(0.02);
    expect(result.flagRatio).toBeCloseTo(1.5, 1);
  });
}

test("country-flag bunting relayouts during same-breakpoint resize", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?scene=pakistan-defence-day&motion=reduced");
  await waitForScene(page);
  const anchorsBefore = await page
    .locator("[data-zeenat-bunting-anchor]")
    .count();

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForFunction(() => {
    const viewBox = document
      .querySelector("[data-zeenat-effect='bunting'] svg")
      ?.getAttribute("viewBox");
    return viewBox?.split(" ")[2] === "768";
  });

  const result = await page.evaluate(() => {
    const svg = document.querySelector<SVGSVGElement>(
      "[data-zeenat-effect='bunting'] svg",
    )!;
    const anchors = [
      ...svg.querySelectorAll<SVGGElement>("[data-zeenat-bunting-anchor]"),
    ];
    return {
      count: anchors.length,
      lastX: Number(anchors[anchors.length - 1]?.dataset.zeenatAnchorX),
      viewBox: svg.getAttribute("viewBox"),
    };
  });

  expect(result.count).toBe(anchorsBefore);
  expect(result.lastX).toBeCloseTo(740, 1);
  expect(result.viewBox).toBe("0 0 768 108");
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
  const response = await page.goto("/?scene=bunting&flag=japan&motion=full");
  await waitForScene(page);
  await expect(
    page.locator("symbol[data-zeenat-flag-status='ready']"),
  ).toHaveCount(1);
  await page.waitForTimeout(100);
  const marker = await page.locator("html").getAttribute("data-csp-violation");
  if (marker) violations.push(marker);
  expect(response?.headers()["content-security-policy"]).toContain(
    "style-src 'self'",
  );
  expect(violations).toEqual([]);
  expect(errors).toEqual([]);
});

for (const orientation of ["horizontal", "vertical"]) {
  for (const width of [320, 390, 768, 1440, 1920]) {
    test(`${orientation} flag bunting is attached and responsive at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(
        `/?scene=bunting&flag=pakistan&orientation=${orientation}&motion=reduced`,
      );
      await waitForScene(page);
      const geometry = await page.evaluate(() => {
        const anchors = [
          ...document.querySelectorAll<SVGGElement>(
            "[data-zeenat-bunting-anchor]",
          ),
        ];
        const use =
          anchors[Math.floor(anchors.length / 2)]!.querySelector<SVGUseElement>(
            "use",
          )!;
        // Firefox may double-apply <symbol> scaling in <use>.getBoundingClientRect().
        // Measure its viewport corners through the actual SVG transform matrix.
        const matrix = use.getScreenCTM()!;
        const x = Number(use.getAttribute("x"));
        const y = Number(use.getAttribute("y"));
        const w = Number(use.getAttribute("width"));
        const h = Number(use.getAttribute("height"));
        const corners = [
          [x, y],
          [x + w, y],
          [x, y + h],
          [x + w, y + h],
        ].map(([cx, cy]) => new DOMPoint(cx, cy).matrixTransform(matrix));
        const box = {
          width:
            Math.max(...corners.map((p) => p.x)) -
            Math.min(...corners.map((p) => p.x)),
          height:
            Math.max(...corners.map((p) => p.y)) -
            Math.min(...corners.map((p) => p.y)),
          bottom: Math.max(...corners.map((p) => p.y)),
        };
        // Map the visual top midpoint from the symbol's local coordinates.
        const vertical =
          document
            .querySelector("[data-zeenat-flag-orientation]")
            ?.getAttribute("data-zeenat-flag-orientation") === "vertical";
        const top = new DOMPoint(
          vertical ? 0 : 0,
          vertical
            ? Number(use.getAttribute("height")) / 2
            : Number(use.getAttribute("y")),
        ).matrixTransform(use.getScreenCTM()!);
        const anchor = new DOMPoint(0, 0).matrixTransform(
          (
            use.parentElement!.parentElement as unknown as SVGGElement
          ).getScreenCTM()!,
        );
        return {
          ratio: box.width / box.height,
          gap: Math.hypot(top.x - anchor.x, top.y - anchor.y),
          bottom: box.bottom,
          overflow: document.documentElement.scrollWidth - innerWidth,
        };
      });
      expect(geometry.ratio).toBeCloseTo(
        orientation === "vertical" ? 2 / 3 : 1.5,
        1,
      );
      expect(geometry.gap).toBeLessThan(1.6);
      expect(geometry.bottom).toBeLessThan(width < 640 ? 78 : 112);
      expect(geometry.overflow).toBe(0);
      await page.locator("#host-button").click();
      await expect(page.locator("#click-count")).toHaveText("1");
    });
  }
}

test("Defence Day fighter noses point in the direction of right-to-left travel", async ({
  page,
}) => {
  await page.goto("/?scene=pakistan-defence-day&motion=full");
  await waitForScene(page);
  const result = await page.evaluate(() => {
    const jet = document.querySelector<HTMLElement>(
      "[data-zeenat-aircraft='fighter-jet']",
    )!;
    const animation = jet.getAnimations()[0]!;
    const timing = animation.effect!.getTiming();
    animation.pause();
    animation.currentTime = (timing.delay ?? 0) + Number(timing.duration) * 0.3;
    const before = jet.getBoundingClientRect().x;
    animation.currentTime = (timing.delay ?? 0) + Number(timing.duration) * 0.7;
    const after = jet.getBoundingClientRect().x;
    const airframe = jet.querySelector<SVGGElement>("[data-zeenat-airframe]")!;
    const matrix = airframe.getScreenCTM()!;
    return {
      before,
      after,
      nose: new DOMPoint(118, 40).matrixTransform(matrix).x,
      tail: new DOMPoint(5, 40).matrixTransform(matrix).x,
    };
  });
  expect(result.after).toBeLessThan(result.before);
  expect(result.nose).toBeLessThan(result.tail);
});

test("a catalog flag loads only its own local artwork chunk", async ({
  page,
}) => {
  const chunks: string[] = [];
  page.on("request", (request) => {
    if (/\/[a-z]{2}-[a-z0-9]+\.js/i.test(request.url()))
      chunks.push(request.url());
  });
  await page.goto(
    "/?scene=bunting&flag=japan&orientation=vertical&motion=reduced",
  );
  await waitForScene(page);
  await expect(
    page.locator("symbol[data-zeenat-flag-status='ready']"),
  ).toHaveCount(1);
  expect(chunks.length).toBeGreaterThan(0);
  expect(chunks.every((url) => /\/jp-/i.test(url))).toBe(true);
  await expect(
    page.locator("[data-zeenat-flag='japan']").first(),
  ).toBeVisible();
  await page.evaluate(() => window.__ZEENAT_TEST__?.unmount());
  await expect(page.locator("[data-zeenat-root]")).toHaveCount(0);
});
