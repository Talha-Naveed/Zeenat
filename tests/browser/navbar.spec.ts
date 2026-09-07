import { expect, test, type Page } from "@playwright/test";

const bunting = "[data-zeenat-effect='bunting'] > svg";
async function expectTop(page: Page, top: number) {
  await expect
    .poll(async () => (await page.locator(bunting).boundingBox())?.y)
    .toBeCloseTo(top, 0);
}

test("bunting clears a sticky navbar on desktop and mobile without moving host content", async ({
  page,
}) => {
  await page.goto("/?scene=bunting&motion=reduced");
  await expectTop(page, 64);
  const content = await page.locator("[data-layout-probe]").boundingBox();
  await page.evaluate(() => window.__ZEENAT_TEST__?.unmount());
  await expect(page.locator(bunting)).toHaveCount(0);
  expect(await page.locator("[data-layout-probe]").boundingBox()).toEqual(
    content,
  );
  await page.evaluate(() => window.__ZEENAT_TEST__?.remount());
  await expectTop(page, 64);
  await page.evaluate(() => window.scrollTo(0, 240));
  await expectTop(page, 64);
  await page.setViewportSize({ width: 390, height: 844 });
  await expectTop(page, 64);
  await page.locator("#host-select").selectOption("bright");
  await expect(page.locator("#host-select")).toHaveValue("bright");
});

test("bunting follows partial and fully scrolled-away headers and returns with them", async ({
  page,
}) => {
  await page.goto("/?scene=bunting&motion=reduced");
  await page.locator(".navbar").evaluate((nav: HTMLElement) => {
    nav.style.position = "relative";
  });
  await expectTop(page, 64);
  await page.evaluate(() => window.scrollTo(0, 32));
  await expectTop(page, 32);
  await page.evaluate(() => window.scrollTo(0, 200));
  await expectTop(page, 0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectTop(page, 64);
});

test("fixed header resizing and CSS hide/reveal transitions are tracked through completion", async ({
  page,
}) => {
  await page.goto("/?scene=bunting&motion=reduced");
  await page.locator(".navbar").evaluate((nav: HTMLElement) => {
    Object.assign(nav.style, {
      position: "fixed",
      width: "100%",
      height: "96px",
      transition: "transform 200ms linear",
      zIndex: "1",
    });
  });
  await expectTop(page, 96);
  await page.locator(".navbar").evaluate((nav: HTMLElement) => {
    nav.style.transform = "translateY(-100%)";
  });
  await expectTop(page, 0);
  await page.locator(".navbar").evaluate((nav: HTMLElement) => {
    nav.style.transform = "translateY(0)";
  });
  await expectTop(page, 96);
  await page.locator(".navbar").evaluate((nav: HTMLElement) => {
    nav.hidden = true;
    nav.style.display = "none";
  });
  await expectTop(page, 0);
});

test("custom selectors follow replacement and late-mounted navigation", async ({
  page,
}) => {
  await page.goto("/?scene=bunting&motion=reduced&navbar=%23custom-header");
  await expectTop(page, 0);
  await page.evaluate(() => {
    const nav = document.createElement("div");
    nav.id = "custom-header";
    Object.assign(nav.style, {
      position: "fixed",
      top: "0",
      height: "88px",
      width: "100%",
    });
    document.body.append(nav);
  });
  await expectTop(page, 88);
  await page.evaluate(() => {
    const nav = document.getElementById("custom-header")!;
    const replacement = nav.cloneNode() as HTMLElement;
    replacement.style.height = "112px";
    nav.replaceWith(replacement);
  });
  await expectTop(page, 112);
  await page.locator("#custom-header").evaluate((nav) => nav.remove());
  await expectTop(page, 0);
});

test("auto detection ignores content navigation; opting out preserves viewport placement", async ({
  page,
}) => {
  await page.goto("/?scene=bunting&motion=reduced");
  await page.evaluate(() => {
    document.querySelector(".navbar")!.remove();
    const nav = document.createElement("nav");
    Object.assign(nav.style, {
      position: "fixed",
      top: "0",
      width: "100%",
      height: "120px",
    });
    document.querySelector("main")!.append(nav);
  });
  await expectTop(page, 0);
  await page.goto("/?scene=bunting&motion=reduced&navbar=false");
  await expectTop(page, 0);
});

test("header measurement is idle between changes and stops after destroy", async ({
  page,
}) => {
  await page.goto("/?scene=bunting&motion=reduced");
  await expectTop(page, 64);
  const measurements = await page.evaluate(async () => {
    const nav = document.querySelector<HTMLElement>(".navbar")!;
    const measure = nav.getBoundingClientRect.bind(nav);
    let reads = 0;
    nav.getBoundingClientRect = () => {
      reads += 1;
      return measure();
    };
    const frames = async () => {
      for (let i = 0; i < 4; i += 1)
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
    };
    await frames();
    reads = 0;
    await frames();
    const idle = reads;
    nav.style.height = "90px";
    await frames();
    const changed = reads;
    window.__ZEENAT_TEST__!.destroy();
    reads = 0;
    nav.style.height = "110px";
    await frames();
    return { idle, changed, destroyed: reads };
  });
  expect(measurements.idle).toBe(0);
  expect(measurements.changed).toBeGreaterThan(0);
  expect(measurements.destroyed).toBe(0);
});

test("headers inside scrolling containers follow captured scroll events", async ({
  page,
}) => {
  await page.goto("/?scene=bunting&motion=reduced");
  await expectTop(page, 64);
  await page.evaluate(() => {
    const container = document.createElement("div");
    container.id = "scrolling-header";
    Object.assign(container.style, {
      position: "fixed",
      top: "0",
      width: "100%",
      height: "200px",
      overflow: "auto",
    });
    const nav = document.querySelector<HTMLElement>(".navbar")!;
    nav.style.position = "relative";
    const content = document.createElement("div");
    content.style.height = "1000px";
    container.append(nav, content);
    document.body.append(container);
  });
  await expectTop(page, 64);
  await page.locator("#scrolling-header").evaluate((container) => {
    container.scrollTop = 32;
  });
  await expectTop(page, 32);
});
