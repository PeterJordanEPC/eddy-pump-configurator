import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/app.jsx", "utf8");

test("preview and submission requests use bounded deadlines", () => {
  assert.match(source, /createRequestDeadline\(15000\)/);
  assert.match(source, /createRequestDeadline\(20000\)/);
});

test("submission success is parsed and stale attempts are ignored", () => {
  assert.match(source, /parseSubmissionResponse\(result\)/);
  assert.match(source, /submissionAttemptRef/);
  assert.match(source, /if \(attempt !== submissionAttemptRef\.current\) return/);
});

test("success copy uses the immutable submitted email snapshot", () => {
  assert.match(source, /submittedEmail/);
  assert.match(source, /setSubmittedEmail\(submissionData\.customer\.email\)/);
  assert.doesNotMatch(source, /lead\.email && <p className="successFollowup"/);
});

test("preview completion does not steal focus from the lead form", () => {
  assert.doesNotMatch(source, /\[stepIdx, done, submitted, previewStatus\]/);
  assert.match(source, /\[stepIdx, done, submitted\]/);
});

test("pricing form exposes the existing EDDY Pump privacy policy", () => {
  assert.match(source, /https:\/\/eddypump\.com\/privacy-policy\//);
  assert.match(source, />Privacy Policy</);
});

test("recommendation heading is the page-level heading", () => {
  assert.match(source, /<h1 className="fam"/);
  assert.doesNotMatch(source, /<h2 className="fam"/);
});

test("submit remains actionable so native validation can explain missing fields", () => {
  assert.match(source, /disabled=\{submitting\}/);
  assert.doesNotMatch(source, /disabled=\{!validName\(lead\.name\) \|\| !validEmail\(lead\.email\) \|\| submitting\}/);
});
