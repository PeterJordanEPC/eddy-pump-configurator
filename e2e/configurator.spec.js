import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const recommendation = {
  code: "CABLE-4-in",
  family: "Cable-Deployed Dredge Pump — 4-in Class",
  specs: ["4-in discharge class"],
  review_required: true,
  missing_engineering_inputs: ["material analysis"],
};

const submissionResponse = {
  id: "e2e-submission-1",
  status: "received",
  recommendation,
};

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

async function installDeferredRoute(page, pattern) {
  const requested = deferred();
  const response = deferred();
  const settled = deferred();
  await page.route(pattern, async (route) => {
    requested.resolve();
    const fulfillment = await response.promise;
    await route.fulfill(fulfillment);
    settled.resolve();
  });
  return { requested, response, settled };
}

async function completeDredge(page) {
  await page.getByRole("button", { name: /dredging/i }).click();
  await page.getByRole("button", { name: /sand & gravel/i }).click();
  await page.getByLabel(/select production target/i).selectOption("p_150");
  await page.getByRole("button", { name: /cable deployed/i }).click();
  await page.getByRole("button", { name: /^electric/i }).click();
}

async function completeContact(page) {
  await page.getByLabel(/full name/i).fill("Ada Lovelace");
  await page.getByLabel(/work email/i).fill("ada@example.com");
  await page.getByRole("button", { name: /submit my pricing request/i }).click();
}

test("entry and recommendation screens are usable without serious accessibility violations", async ({ page }) => {
  await page.route("**/v1/recommendations/preview", async (route) => {
    await route.fulfill({ json: { rules_version: "e2e-rules-1", recommendation } });
  });
  await page.goto("/");
  const entryHeading = page.getByRole("heading", { name: "What's the job?" });
  await expect(entryHeading).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");

  const entryResults = await new AxeBuilder({ page }).analyze();
  expect(entryResults.violations.filter(({ impact }) => ["serious", "critical"].includes(impact))).toEqual([]);

  await page.getByRole("button", { name: /dredging/i }).click();
  await page.getByRole("button", { name: /sand & gravel/i }).click();
  await page.getByLabel(/select production target/i).selectOption("p_150");
  await page.getByRole("button", { name: /cable deployed/i }).click();
  await page.getByRole("button", { name: /^electric/i }).click();
  const recommendationHeading = page.getByRole("heading", { level: 1, name: recommendation.family });
  await expect(recommendationHeading).toBeVisible();
  await expect(recommendationHeading).toBeFocused();
  await expect(page.getByText("Rules: e2e-rules-1")).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(({ impact }) => ["serious", "critical"].includes(impact))).toEqual([]);
});

test("Start over remains final when a pending preview later resolves", async ({ page }) => {
  const preview = await installDeferredRoute(page, "**/v1/recommendations/preview");
  await page.goto("/");
  await completeDredge(page);
  await preview.requested.promise;
  await expect(page.getByRole("status")).toContainText("Checking your configuration");

  await page.getByRole("button", { name: /start over/i }).click();
  await expect(page.getByRole("heading", { name: "What's the job?" })).toBeVisible();
  preview.response.resolve({ json: { rules_version: "stale-preview", recommendation } });
  await preview.settled.promise;

  await expect(page.getByRole("heading", { name: "What's the job?" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: recommendation.family })).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /dredging/i })).toBeEnabled();
});

test("Start over remains final when a pending submission later succeeds", async ({ page }) => {
  await page.route("**/v1/recommendations/preview", (route) => route.fulfill({ json: { rules_version: "e2e-rules-1", recommendation } }));
  const submission = await installDeferredRoute(page, "**/v1/submissions");
  await page.goto("/");
  await completeDredge(page);
  await expect(page.getByRole("heading", { level: 1, name: recommendation.family })).toBeVisible();
  await completeContact(page);
  await submission.requested.promise;
  await expect(page.getByRole("button", { name: /sending securely/i })).toBeDisabled();

  await page.getByRole("button", { name: /start over/i }).click();
  submission.response.resolve({ json: submissionResponse });
  await submission.settled.promise;

  await expect(page.getByRole("heading", { name: "What's the job?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /configuration received/i })).toHaveCount(0);
  await expect(page.getByText("e2e-submission-1")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /dredging/i })).toBeEnabled();
});

test("Change my answers remains final when a pending submission later fails", async ({ page }) => {
  await page.route("**/v1/recommendations/preview", (route) => route.fulfill({ json: { rules_version: "e2e-rules-1", recommendation } }));
  const submission = await installDeferredRoute(page, "**/v1/submissions");
  await page.goto("/");
  await completeDredge(page);
  await expect(page.getByRole("heading", { level: 1, name: recommendation.family })).toBeVisible();
  await completeContact(page);
  await submission.requested.promise;
  await expect(page.getByRole("button", { name: /sending securely/i })).toBeDisabled();

  await page.getByRole("button", { name: /change my answers/i }).click();
  await expect(page.getByRole("heading", { name: /compatible power/i })).toBeVisible();
  submission.response.resolve({ status: 503, json: { detail: "private delayed failure" } });
  await submission.settled.promise;

  await expect(page.getByRole("heading", { name: /compatible power/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /configuration received/i })).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^electric/i })).toBeEnabled();
  await expect(page.getByRole("button", { name: /start over/i })).toBeEnabled();
});
