import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/app.jsx", import.meta.url), "utf8");
const ruleBodies = (selector) => [
  ...source.matchAll(new RegExp(`${selector.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")} \\{([^}]*)\\}`, "g")),
].map((match) => match[1]);

const resultCardRules = ruleBodies(".resultCard");
const resultImageRules = ruleBodies(".resultCard .cardArt");

test("desktop recommendation uses a compact image-and-details row", () => {
  assert.ok(
    resultCardRules.some(
      (rule) => /display:\s*grid/.test(rule) && /grid-template-columns:/.test(rule),
    ),
    "desktop recommendation should place the image beside its details",
  );
  assert.ok(
    resultImageRules.some(
      (rule) => /object-fit:\s*contain/.test(rule) && /max-height:\s*(?:2\d\d|300)px/.test(rule),
    ),
    "desktop recommendation image should remain fully visible in a frame no taller than 300px",
  );
});

test("mobile recommendation keeps the full image in a short frame", () => {
  assert.match(
    source,
    /@media \(max-width:\s*620px\)[\s\S]*?\.resultCard \.cardArt \{[^}]*height:\s*160px;[^}]*object-fit:\s*contain;/,
  );
});

test("selection card photos retain their compact crop", () => {
  assert.match(source, /\.cardPhoto \{[^}]*aspect-ratio:\s*160\/115;[^}]*object-fit:\s*cover;/);
});
