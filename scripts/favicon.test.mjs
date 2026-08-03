import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");

function pngDimensions(filename) {
  const data = readFileSync(new URL(`../${filename}`, import.meta.url));
  assert.deepEqual([...data.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
}

test("index declares browser and Apple favicon assets", () => {
  assert.match(index, /rel="icon" href="favicon\.ico\?v=20260730" sizes="any"/);
  assert.match(index, /rel="icon" type="image\/png" sizes="32x32" href="favicon-32x32\.png\?v=20260730"/);
  assert.match(index, /rel="icon" type="image\/png" sizes="16x16" href="favicon-16x16\.png\?v=20260730"/);
  assert.match(index, /rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon\.png\?v=20260730"/);
});

test("favicon PNG assets have their declared dimensions", () => {
  assert.deepEqual(pngDimensions("favicon-16x16.png"), [16, 16]);
  assert.deepEqual(pngDimensions("favicon-32x32.png"), [32, 32]);
  assert.deepEqual(pngDimensions("apple-touch-icon.png"), [180, 180]);
});

test("favicon.ico contains three icon layers", () => {
  const data = readFileSync(new URL("../favicon.ico", import.meta.url));
  assert.equal(data.readUInt16LE(0), 0);
  assert.equal(data.readUInt16LE(2), 1);
  assert.equal(data.readUInt16LE(4), 3);
});
