const PREVIEW_FALLBACK = "We couldn't verify a preliminary recommendation right now. You can still send your project for engineering review below.";

export function shouldShowLeadCapture({ done, submitted }) {
  return Boolean(done && !submitted);
}

export function parsePreviewResponse(payload) {
  const recommendation = payload?.recommendation;
  const valid = payload
    && typeof payload.rules_version === "string"
    && payload.rules_version.length > 0
    && recommendation
    && typeof recommendation.code === "string"
    && recommendation.code.length > 0
    && typeof recommendation.family === "string"
    && recommendation.family.length > 0
    && Array.isArray(recommendation.specs)
    && recommendation.specs.every((item) => typeof item === "string")
    && typeof recommendation.review_required === "boolean"
    && Array.isArray(recommendation.missing_engineering_inputs)
    && recommendation.missing_engineering_inputs.every((item) => typeof item === "string");
  if (!valid) throw new Error(PREVIEW_FALLBACK);
  return payload;
}

export function previewErrorMessage(detail) {
  if (typeof detail === "string" && detail.trim()) return detail.trim();
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (typeof item?.msg === "string" ? item.msg.trim() : ""))
      .filter(Boolean);
    if (messages.length) return messages.join(" ");
  }
  return PREVIEW_FALLBACK;
}
