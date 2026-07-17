import React from "react";
import { render } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";
import { App } from "../src/components/App.jsx";

describe("accessibility smoke test", () => {
  it("has no automatically detectable serious or critical violations on entry", async () => {
    const api = { preview: vi.fn(), submit: vi.fn() };
    const { container } = render(<App api={api} />);
    const result = await axe.run(container, { resultTypes: ["violations"], rules: { region: { enabled: false }, "color-contrast": { enabled: false } } });
    const severe = result.violations.filter(({ impact }) => impact === "serious" || impact === "critical");
    expect(severe).toEqual([]);
  });
});
