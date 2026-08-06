const RECEIPT_FALLBACK = "We couldn't confirm the pricing-request receipt. Please retry with the same information.";

function validRecommendation(value) {
  return value
    && typeof value.code === "string"
    && value.code.length > 0
    && typeof value.family === "string"
    && value.family.length > 0
    && Array.isArray(value.specs)
    && value.specs.every((item) => typeof item === "string")
    && typeof value.review_required === "boolean"
    && Array.isArray(value.missing_engineering_inputs)
    && value.missing_engineering_inputs.every((item) => typeof item === "string");
}

export function parseSubmissionResponse(payload) {
  const valid = payload
    && typeof payload.id === "string"
    && payload.id.length > 0
    && typeof payload.status === "string"
    && payload.status.length > 0
    && validRecommendation(payload.recommendation);
  if (!valid) throw new Error(RECEIPT_FALLBACK);
  return payload;
}

export function submissionErrorMessage(status) {
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status === 422) return "Some fields could not be accepted. Please review your entries and try again.";
  if (status >= 500) return "The pricing-request service is temporarily unavailable. Please try again shortly.";
  return "We couldn't send your configuration. Please review the fields and try again.";
}

export function createRequestDeadline(milliseconds) {
  const controller = new AbortController();
  let expired = false;
  const timer = setTimeout(() => {
    expired = true;
    controller.abort();
  }, milliseconds);
  return {
    signal: controller.signal,
    abort: () => controller.abort(),
    clear: () => clearTimeout(timer),
    timedOut: () => expired,
  };
}
