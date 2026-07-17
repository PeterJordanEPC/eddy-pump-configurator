import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { RAILWAY_API_BASE, resolveSiteConfig } from "../build-config.js";

describe("build API configuration", () => {
  it("uses the reachable Railway production origin when no override is supplied", () => {
    expect(resolveSiteConfig({})).toMatchObject({ apiBase: RAILWAY_API_BASE, fallbackApiBase: RAILWAY_API_BASE });
  });

  it("allows an HTTPS origin override while retaining Railway as fallback", () => {
    expect(resolveSiteConfig({ CONFIGURATOR_API_BASE: "https://preview.example.com/" })).toMatchObject({
      apiBase: "https://preview.example.com", fallbackApiBase: RAILWAY_API_BASE,
    });
  });

  it("rejects non-HTTPS or path-bearing overrides", () => {
    expect(() => resolveSiteConfig({ CONFIGURATOR_API_BASE: "http://localhost:8000" })).toThrow(/HTTPS origin/);
    expect(() => resolveSiteConfig({ CONFIGURATOR_API_BASE: "https://example.com/api" })).toThrow(/HTTPS origin/);
  });

  it("does not claim unsupported frame-ancestor protection in a meta CSP", () => {
    const template = readFileSync("index.template.html", "utf8");
    expect(template).not.toContain("frame-ancestors");
  });

  it("uses the exact direct-contact telephone link in the privacy notice", () => {
    const privacy = readFileSync("privacy.html", "utf8");
    expect(privacy).toContain('href="tel:+16196552552"');
  });
});