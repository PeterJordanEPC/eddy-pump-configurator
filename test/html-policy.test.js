import { describe, expect, it } from "vitest";
import { hasForbiddenScriptHost } from "../scripts/html-policy.mjs";

const forbidden = new Set(["unpkg.com"]);

describe("generated HTML remote-script policy", () => {
  it.each([
    '<script src="https://unpkg.com/react"></script>',
    '<script src = "https://unpkg.com/react"></script>',
    '<script src=https://unpkg.com/react></script>',
    '<script src="https://unpkg&#46;com/react"></script>',
  ])("rejects browser-valid Unpkg syntax: %s", (html) => {
    expect(hasForbiddenScriptHost(html, forbidden)).toBe(true);
  });

  it("allows local scripts and unrelated hosts", () => {
    const html = '<script src="/app.js"></script><script src="https://example.com/tool.js"></script>';
    expect(hasForbiddenScriptHost(html, forbidden)).toBe(false);
  });

  it("fails closed without throwing on malformed script URLs", () => {
    const evaluate = () => hasForbiddenScriptHost('<script src="http://[invalid"></script>', forbidden);
    expect(evaluate).not.toThrow();
    expect(evaluate()).toBe(true);
  });
});