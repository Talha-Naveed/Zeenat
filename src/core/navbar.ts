import { ZeenatError } from "../shared/errors";
import type { CleanupFunction } from "../shared/types";

const AUTO_SELECTOR = 'header, nav, [role="banner"], [role="navigation"]';
const CONTENT_SELECTOR =
  'main, article, section, aside, footer, [role="main"], [role="complementary"], [role="contentinfo"], [role="dialog"]';
const OFFSET_PROPERTY = "--zeenat-navbar-bottom";

export function validateNavbar(
  document: Document,
  navbar: string | false,
): void {
  if (navbar === false || navbar === "auto") return;
  try {
    if (typeof navbar !== "string" || !navbar.trim()) throw new Error();
    document.querySelector(navbar);
  } catch {
    throw new ZeenatError(
      'navbar must be "auto", false, or a valid CSS selector.',
    );
  }
}

/** Track host geometry without modifying host styles or keeping an idle RAF loop. */
export function observeNavbar(
  root: HTMLElement,
  navbar: string,
): CleanupFunction {
  const document = root.ownerDocument;
  const view = document.defaultView!;
  const automatic = navbar === "auto";
  const selector = automatic ? AUTO_SELECTOR : navbar;
  let candidates: Element[] = [];
  let needsDiscovery = true;
  let frame: number | null = null;
  let disposed = false;
  let previousOffset = -1;

  const queue = () => {
    if (disposed || frame !== null || document.visibilityState === "hidden")
      return;
    frame = view.requestAnimationFrame(update);
  };
  // Use constructors from the owning document, including iframe integrations.
  const browser = view as Window & typeof globalThis;
  const resizeObserver = browser.ResizeObserver
    ? new browser.ResizeObserver(queue)
    : undefined;
  resizeObserver?.observe(document.documentElement);

  function discover() {
    const next = [...document.querySelectorAll(selector)].filter(
      (element) =>
        !element.closest("[data-zeenat-root]") &&
        (!automatic || !element.closest(CONTENT_SELECTOR)),
    );
    for (const element of candidates) {
      if (!next.includes(element)) resizeObserver?.unobserve(element);
    }
    for (const element of next) {
      if (!candidates.includes(element)) resizeObserver?.observe(element);
    }
    candidates = next;
    needsDiscovery = false;
  }

  function update() {
    frame = null;
    if (disposed) return;
    if (needsDiscovery) discover();
    let offset = 0;
    let animating = false;
    const checkedAncestors = new Set<Element>();
    for (const element of candidates) {
      const rect = element.getBoundingClientRect();
      // Follow finite CSS transitions even after the triggering scroll stops.
      // Hidden headers remain candidates so a reveal can be tracked as well.
      let hidden = false;
      for (
        let ancestor: Element | null = element;
        ancestor;
        ancestor = ancestor.parentElement
      ) {
        const style = view.getComputedStyle(ancestor);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          style.visibility === "collapse" ||
          style.opacity === "0"
        ) {
          hidden = true;
        }
        if (checkedAncestors.has(ancestor)) continue;
        checkedAncestors.add(ancestor);
        animating ||= (ancestor.getAnimations?.() ?? []).some(
          (animation) =>
            animation.playState === "running" &&
            Number.isFinite(
              Number(animation.effect?.getComputedTiming().endTime),
            ),
        );
      }
      if (
        hidden ||
        rect.width <= 0 ||
        rect.height <= 0 ||
        rect.bottom <= 0 ||
        rect.top >= view.innerHeight ||
        rect.right <= 0 ||
        rect.left >= view.innerWidth
      )
        continue;
      if (
        automatic &&
        (rect.width < view.innerWidth * 0.5 ||
          rect.height > Math.min(240, view.innerHeight * 0.4) ||
          rect.top > Math.min(160, view.innerHeight * 0.25))
      )
        continue;
      offset = Math.max(offset, Math.min(view.innerHeight, rect.bottom));
    }
    // Round upwards so fractional header edges never leave a sliver of overlap.
    offset = Math.ceil(offset);
    if (offset !== previousOffset) {
      root.style.setProperty(OFFSET_PROPERTY, `${offset}px`);
      previousOffset = offset;
    }
    if (animating) queue();
  }

  const mutationObserver = new browser.MutationObserver((records) => {
    if (
      records.every((record) => {
        const element =
          record.target.nodeType === 1
            ? (record.target as Element)
            : record.target.parentElement;
        return element?.closest("[data-zeenat-root]");
      })
    )
      return;
    needsDiscovery = true;
    queue();
  });
  mutationObserver.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    // Custom selectors can depend on any attribute, including data attributes.
    ...(automatic
      ? { attributeFilter: ["class", "style", "hidden", "role", "id"] }
      : {}),
  });
  const onMotion = (event: Event) => {
    const target = event.target as Element | null;
    if (
      target?.nodeType === 1 &&
      candidates.some((element) => target.contains(element))
    )
      queue();
  };
  const motionEvents = [
    "transitionrun",
    "transitionend",
    "transitioncancel",
    "animationstart",
    "animationend",
    "animationcancel",
  ];
  // Capture also handles navbars inside independently scrolling containers.
  document.addEventListener("scroll", queue, { capture: true, passive: true });
  view.addEventListener("resize", queue, { passive: true });
  document.addEventListener("visibilitychange", queue);
  for (const event of motionEvents)
    document.addEventListener(event, onMotion, true);
  update();

  return () => {
    disposed = true;
    if (frame !== null) view.cancelAnimationFrame(frame);
    resizeObserver?.disconnect();
    mutationObserver.disconnect();
    document.removeEventListener("scroll", queue, true);
    view.removeEventListener("resize", queue);
    document.removeEventListener("visibilitychange", queue);
    for (const event of motionEvents)
      document.removeEventListener(event, onMotion, true);
    root.style.removeProperty(OFFSET_PROPERTY);
  };
}
