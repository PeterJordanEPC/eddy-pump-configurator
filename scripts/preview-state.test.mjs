import assert from "node:assert/strict";
import test from "node:test";

import { parsePreviewResponse, previewErrorMessage, shouldShowLeadCapture } from "../src/preview-state.mjs";

const valid = {
  rules_version: "2026-07-28.3",
  recommendation: {
    code: "PUMP-ENG-SUB-ELEC",
    family: "EDDY Pump Submersible Pump — Electric",
    specs: ["Engineering will select the exact pump size"],
    review_required: true,
    missing_engineering_inputs: ["exact GPM and TDH"],
  },
};

test("lead capture stays visible regardless of preview outcome", () => {
  for (const previewStatus of ["loading", "error", "ready"]) {
    assert.equal(
      shouldShowLeadCapture({ done: true, submitted: false, previewStatus }),
      true,
    );
  }
  assert.equal(shouldShowLeadCapture({ done: false, submitted: false }), false);
  assert.equal(shouldShowLeadCapture({ done: true, submitted: true }), false);
});

test("parsePreviewResponse accepts a complete authoritative response", () => {
  assert.deepEqual(parsePreviewResponse(valid), valid);
});

test("parsePreviewResponse rejects malformed successful responses", () => {
  for (const malformed of [
    {},
    { ...valid, recommendation: null },
    { ...valid, recommendation: { ...valid.recommendation, family: null } },
    { ...valid, recommendation: { ...valid.recommendation, specs: "not-an-array" } },
    { ...valid, recommendation: { ...valid.recommendation, specs: [1] } },
  ]) {
    assert.throws(() => parsePreviewResponse(malformed), /verify.*recommendation/i);
  }
});

test("previewErrorMessage describes preview failure without implying submission", () => {
  assert.equal(
    previewErrorMessage(undefined),
    "We couldn't verify a preliminary recommendation right now. You can still send your project for engineering review below.",
  );
  assert.equal(previewErrorMessage("Unsupported combination"), "Unsupported combination");
});
