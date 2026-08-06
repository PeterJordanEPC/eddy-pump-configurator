import assert from "node:assert/strict";
import test from "node:test";

import {
  createRequestDeadline,
  parseSubmissionResponse,
  submissionErrorMessage,
} from "../src/submission-state.mjs";

const validRecommendation = {
  code: "EXF-4000-HYD",
  family: "EXF-4000 Excavator Dredge Pump Attachment (4-in)",
  specs: ["4-in discharge class"],
  review_required: true,
  missing_engineering_inputs: ["material analysis"],
};

const validResponse = {
  id: "5de3d78a-7b3d-4dd8-a403-c4a14427ee95",
  status: "received",
  recommendation: validRecommendation,
};

test("parseSubmissionResponse accepts the complete public receipt", () => {
  assert.deepEqual(parseSubmissionResponse(validResponse), validResponse);
});

test("parseSubmissionResponse rejects malformed successful responses", () => {
  for (const malformed of [
    {},
    { ...validResponse, id: "" },
    { ...validResponse, id: "   " },
    { ...validResponse, status: "" },
    { ...validResponse, status: "   " },
    { ...validResponse, status: "rejected" },
    { ...validResponse, status: "processing" },
    { ...validResponse, recommendation: null },
    { ...validResponse, recommendation: { ...validRecommendation, specs: "4-in" } },
    { ...validResponse, recommendation: { ...validRecommendation, review_required: "yes" } },
  ]) {
    assert.throws(() => parseSubmissionResponse(malformed), /confirm.*receipt/i);
  }
});

test("submissionErrorMessage never renders arbitrary server text", () => {
  assert.equal(submissionErrorMessage(429, "internal limiter details"), "Too many requests. Please wait a moment and try again.");
  assert.equal(submissionErrorMessage(422, [{ msg: "database table customers missing" }]), "Some fields could not be accepted. Please review your entries and try again.");
  assert.equal(submissionErrorMessage(503, "postgres connection string leaked"), "The pricing-request service is temporarily unavailable. Please try again shortly.");
  assert.equal(submissionErrorMessage(400, "unexpected internals"), "We couldn't send your configuration. Please review the fields and try again.");
});

test("createRequestDeadline aborts after its deadline and can be cleared", async () => {
  const expired = createRequestDeadline(5);
  await new Promise((resolve) => setTimeout(resolve, 15));
  assert.equal(expired.signal.aborted, true);
  assert.equal(expired.timedOut(), true);

  const cleared = createRequestDeadline(5);
  cleared.clear();
  await new Promise((resolve) => setTimeout(resolve, 15));
  assert.equal(cleared.signal.aborted, false);
  assert.equal(cleared.timedOut(), false);
});
