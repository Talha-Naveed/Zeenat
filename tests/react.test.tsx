import { render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { defineEffect, definePreset } from "../src/core/definitions";
import { Zeenat, type ZeenatHandle } from "../src/react";

describe("React adapter", () => {
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
