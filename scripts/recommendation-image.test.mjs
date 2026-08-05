import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/app.jsx", import.meta.url), "utf8");
const resultImageRules = [...source.matchAll(/\.resultCard \.cardArt \{([^}]*)\}/g)]
  .map((match) => match[1]);

test("recommendation image shows the complete approved photo", () => {
  assert.ok(resultImageRules.length > 0, "recommendation image needs a dedicated result-card rule");
  assert.ok(
    resultImageRules.some((rule) => /object-fit:\s*contain/.test(rule)),
    "recommendation image should contain rather than crop the photo",
  );
  for (const rule of resultImageRules) {
    assert.doesNotMatch(
      rule,
      /height:\s*\d+px/,
      "recommendation image must not use a fixed desktop or mobile height",
    );
  }
});

test("selection card photos retain their compact crop", () => {
  assert.match(source, /\.cardPhoto \{[^}]*aspect-ratio:\s*160\/115;[^}]*object-fit:\s*cover;/);
});
