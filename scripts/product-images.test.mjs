import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const approvedPhotoFiles = [
  "dredging.jpg", "process.jpg", "sand.jpg", "sludge.jpg", "tailings.jpg",
  "debris.jpg", "other.jpg", "electric.jpg", "excavator.jpg", "cable.jpg",
  "sled.jpg", "diver.jpg", "flooded.jpg", "submersible.jpg", "selfpriming.jpg",
];

function jpegDimensions(buffer) {
  assert.equal(buffer[0], 0xff, "JPEG must start with FF");
  assert.equal(buffer[1], 0xd8, "JPEG must start with D8");
  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    const length = buffer.readUInt16BE(offset);
    assert.ok(length >= 2, `invalid JPEG segment length at ${offset}`);
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
    }
    offset += length;
  }
  throw new Error("JPEG dimensions not found");
}

test("approved configurator photos are normalized landscape JPEGs", async () => {
  for (const name of approvedPhotoFiles) {
    const data = await readFile(new URL(`../images/${name}`, import.meta.url));
    assert.deepEqual(jpegDimensions(data), { width: 1280, height: 920 }, name);
    assert.ok(data.length > 10_000 && data.length < 500_000, `${name} has an unexpected size: ${data.length}`);
  }
});

test("unsupported Drive alternates are not exposed as active assets", async () => {
  for (const name of ["auger.jpg", "remote.jpg", "remote1.jpg", "dredging1.jpg", "dredging2.jpg"]) {
    await assert.rejects(readFile(new URL(`../images/${name}`, import.meta.url)), { code: "ENOENT" });
  }
});
