import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/app.jsx", import.meta.url), "utf8");
const contactStart = source.indexOf('<div className="sectionLabel">YOUR CONTACT INFORMATION</div>');
const optionalStart = source.indexOf('<details className="projectDetails">', contactStart);
const optionalEnd = source.indexOf("</details>", optionalStart);
const visibleContactFields = source.slice(contactStart, optionalStart);
const optionalDetails = source.slice(optionalStart, optionalEnd);

test("excavator model is visible with the primary contact fields", () => {
  assert.match(
    visibleContactFields,
    /\{answers\.deployment === "excavator" &&[\s\S]*htmlFor="project-excavator"[\s\S]*id="project-excavator"/,
  );
});

test("excavator model is not hidden in optional project details", () => {
  assert.doesNotMatch(optionalDetails, /project-excavator/);
});
