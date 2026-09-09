import { render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { defineEffect, definePreset } from "../src/core/definitions";
import { Zeenat, type ZeenatHandle } from "../src/react";

describe("React adapter", () => {
  it("updates the navbar selector and opt-out through the shared engine", () => {
    const header = document.createElement("div");
    header.id = "site-header";
    document.body.append(header);
    const rect = vi.spyOn(header, "getBoundingClientRect").mockReturnValue({
      top: 0,
      bottom: 80,
      left: 0,
      right: 1024,
      width: 1024,
      height: 80,
    } as DOMRect);
    const result = render(
      <Zeenat
        preset="bunting"
        flag="pakistan"
        navbar="#site-header"
        motion="reduced"
      />,
    );
    const root =
      result.container.querySelector<HTMLElement>("[data-zeenat-root]")!;
    expect(root.style.getPropertyValue("--zeenat-navbar-bottom")).toBe("80px");
    result.rerender(
      <Zeenat
        preset="bunting"
        flag="pakistan"
        navbar={false}
        motion="reduced"
      />,
    );
    expect(root.style.getPropertyValue("--zeenat-navbar-bottom")).toBe("");
    result.unmount();
    rect.mockRestore();
  });
  it("updates flag and orientation props through the shared engine", () => {
    const result = render(
      <Zeenat
        preset="bunting"
        flag="pakistan"
        orientation="horizontal"
        motion="reduced"
      />,
    );
    expect(
      result.container.querySelector("[data-zeenat-flag='pakistan']"),
    ).not.toBeNull();
    result.rerender(
      <Zeenat
        preset="bunting"
        flag="US"
        orientation="vertical"
        motion="reduced"
      />,
    );
    expect(
      result.container.querySelector("[data-zeenat-flag='pakistan']"),
    ).toBeNull();
    expect(
      result.container.querySelector(
        "[data-zeenat-flag-orientation='vertical']",
      ),
    ).not.toBeNull();
    expect(
      result.container.querySelector("[data-zeenat-flag='united-states']"),
    ).not.toBeNull();
    result.unmount();
    expect(document.querySelector("[data-zeenat-root]")).toBeNull();
  });
  it("mounts through the shared engine and cleans up on React unmount", () => {
    const cleanup = vi.fn();
    const mount = vi.fn(() => cleanup);
    const preset = definePreset({
      id: "react-test",
      name: "React test",
      effects: [defineEffect({ id: "react-effect", mount })],
    });

    const result = render(<Zeenat preset={preset} seed={10} />);
    expect(mount).toHaveBeenCalledOnce();
    expect(
      result.container.firstElementChild?.getAttribute("data-zeenat-root"),
    ).toBe("react-test");
    result.unmount();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it("exposes lifecycle controls through a ref", () => {
    const ref = createRef<ZeenatHandle>();
    const preset = definePreset({
      id: "controlled-test",
      name: "Controlled test",
      effects: [
        defineEffect({ id: "controlled-effect", mount: () => undefined }),
      ],
    });

    const result = render(<Zeenat ref={ref} preset={preset} />);
    expect(ref.current?.state).toBe("running");
    expect(ref.current?.getDiagnostics().effects).toHaveLength(1);
    ref.current?.pause();
    expect(ref.current?.state).toBe("paused");
    ref.current?.resume();
    expect(ref.current?.state).toBe("running");
    result.unmount();
  });

  it("leaves the React-owned root empty when disabled", () => {
    const mount = vi.fn();
    const preset = definePreset({
      id: "disabled-test",
      name: "Disabled test",
      effects: [defineEffect({ id: "disabled-effect", mount })],
    });
    const result = render(<Zeenat preset={preset} enabled={false} />);
    expect(mount).not.toHaveBeenCalled();
    expect(result.container.querySelector("[data-zeenat-effect]")).toBeNull();
  });
});
