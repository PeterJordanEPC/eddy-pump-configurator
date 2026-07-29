import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/app.jsx", import.meta.url), "utf8");

test("Dredge Sled explains its ideal operating environment", () => {
  assert.match(
    source,
    /label: "Dredge Sled", desc: "Skid-mounted pump winched across the bottom\. Ideal for lagoons or small bodies of water\."/,
  );
});

test("mobile card descriptions remain fully visible", () => {
  assert.doesNotMatch(source, /-webkit-line-clamp/);
});
