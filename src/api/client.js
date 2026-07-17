export class ApiError extends Error {
  constructor(code, status = 0) {
    super(code);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

const recommendationKey = (value) => JSON.stringify(value || null);

function isRecommendation(value) {
  return Boolean(value)
    && typeof value === "object"
    && typeof value.code === "string"
    && typeof value.family === "string"
    && Array.isArray(value.specs) && value.specs.every((item) => typeof item === "string")
    && typeof value.review_required === "boolean"
    && Array.isArray(value.missing_engineering_inputs)
    && value.missing_engineering_inputs.every((item) => typeof item === "string");
}

function isSubmissionResponse(value) {
  return Boolean(value)
    && typeof value === "object"
    && typeof value.id === "string"
    && typeof value.status === "string"
    && isRecommendation(value.recommendation);
}

export function reconcileRecommendation(preview, finalRecommendation) {
  const changed = recommendationKey(preview) !== recommendationKey(finalRecommendation);
  return { recommendation: changed ? finalRecommendation : preview, changed };
}

export function customerSafeError(error) {
  if (error instanceof ApiError) {
    if (error.code === "timeout") return "The request took too long. Please try again; an unchanged retry will not create a duplicate.";
    if (error.status === 422 || error.code === "validation") return "Please review the highlighted fields and try again.";
    if (error.status === 429 || error.code === "rate_limit") return "Too many requests were sent. Please wait a moment and try again.";
    if (error.status === 409) return "Your answers changed during the request. Please review them and submit again.";
  }
  return "We couldn't reach the secure configurator service. Please try again or contact EDDY Pump directly.";
}

async function readJson(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = response.status === 422 ? "validation" : response.status === 429 ? "rate_limit" : "request_failed";
    throw new ApiError(code, response.status);
  }
  return body;
}

async function post(fetchImpl, url, body, { timeoutMs } = {}) {
  const controller = new AbortController();
  const timer = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return await readJson(response);
  } catch (error) {
    if (error?.name === "AbortError") throw new ApiError("timeout");
    if (error instanceof ApiError) throw error;
    throw new ApiError("network");
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function createApiClient({ apiBase, fallbackApiBase = "", fetchImpl = fetch, previewTimeoutMs = 12000, submissionTimeoutMs = 20000 }) {
  const bases = [apiBase, fallbackApiBase].filter((value, index, all) => value && all.indexOf(value) === index);
  const request = async (path, body, timeoutMs) => {
    let lastError;
    for (const base of bases) {
      try {
        return await post(fetchImpl, `${base}${path}`, body, { timeoutMs });
      } catch (error) {
        lastError = error;
        if (!(error instanceof ApiError) || error.code !== "network") throw error;
      }
    }
    throw lastError || new ApiError("network");
  };
  return {
    async preview(input) {
      const result = await request("/v1/recommendations/preview", input, previewTimeoutMs);
      if (typeof result.rules_version !== "string" || !result.rules_version || !isRecommendation(result.recommendation)) {
        throw new ApiError("invalid_response");
      }
      return { rulesVersion: result.rules_version, recommendation: result.recommendation };
    },
    async submit(payload) {
      const result = await request("/v1/submissions", payload, submissionTimeoutMs);
      if (!isSubmissionResponse(result)) throw new ApiError("invalid_response");
      return result;
    },
  };
}
