import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, createApiClient, customerSafeError, reconcileRecommendation } from "../src/api/client.js";
import { IdempotencyTracker } from "../src/domain/idempotency.js";

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json" },
});

afterEach(() => vi.useRealTimers());

describe("authoritative API client", () => {
  it("requests preview with the strict recommendation contract", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({
      rules_version: "2026-07-16", recommendation: {
        code: "EXF-4000", family: "Excavator", specs: ["Hydraulic"], review_required: true,
        missing_engineering_inputs: ["material analysis"],
      },
    }));
    const api = createApiClient({ apiBase: "https://api.example.com", fetchImpl });
    const input = { answers: { application: "dredging" }, project_details: {} };

    await expect(api.preview(input)).resolves.toMatchObject({ rulesVersion: "2026-07-16", recommendation: { code: "EXF-4000" } });
    expect(fetchImpl).toHaveBeenCalledWith("https://api.example.com/v1/recommendations/preview", expect.objectContaining({
      method: "POST", body: JSON.stringify(input),
    }));
  });

  it("rejects preview responses missing hardened schema fields", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({
      rules_version: "2026-07-16", recommendation: { code: "EXF-4000", family: "Excavator", specs: [] },
    }));
    const api = createApiClient({ apiBase: "https://api.example.com", fetchImpl });
    await expect(api.preview({ answers: {}, project_details: {} })).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("accepts only the hardened public submission response", async () => {
    const validRecommendation = {
      code: "EXF-4000", family: "Excavator", specs: ["Hydraulic"], review_required: true,
      missing_engineering_inputs: [],
    };
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ id: "submission-1", status: "received", recommendation: validRecommendation }, 201))
      .mockResolvedValueOnce(jsonResponse({ id: "submission-1", recommendation: validRecommendation }, 201));
    const api = createApiClient({ apiBase: "https://api.example.com", fetchImpl });
    await expect(api.submit({ idempotency_key: "web:1234567890123456" })).resolves.toEqual({
      id: "submission-1", status: "received", recommendation: validRecommendation,
    });
    await expect(api.submit({ idempotency_key: "web:1234567890123456" })).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("uses AbortController for a timed-out submission", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }));
    const api = createApiClient({ apiBase: "https://api.example.com", fetchImpl, submissionTimeoutMs: 25 });
    const assertion = expect(api.submit({ idempotency_key: "web:1234567890123456" })).rejects.toMatchObject({ code: "timeout" });
    await vi.advanceTimersByTimeAsync(25);
    await assertion;
    expect(fetchImpl.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it("maps backend and network details to customer-safe messages", () => {
    expect(customerSafeError(new ApiError("validation", 422))).toMatch(/review the highlighted fields/i);
    expect(customerSafeError(new Error("postgres password leaked"))).not.toContain("postgres");
    expect(customerSafeError(new ApiError("rate_limit", 429))).toMatch(/wait a moment/i);
  });

  it("reconciles final authority when submission differs from preview", () => {
    const preview = { code: "OLD", family: "Old family", specs: [] };
    const final = { code: "FINAL", family: "Final family", specs: ["Authoritative"] };
    expect(reconcileRecommendation(preview, final)).toEqual({ recommendation: final, changed: true });
    expect(reconcileRecommendation(final, { ...final })).toEqual({ recommendation: final, changed: false });
  });
});

describe("idempotency tracker", () => {
  it("preserves a key for unchanged retries and rotates it after edits", () => {
    let serial = 0;
    const tracker = new IdempotencyTracker(() => `web:key-${++serial}-1234567890123456`);
    const first = tracker.keyFor({ answer: "a" });
    expect(tracker.keyFor({ answer: "a" })).toBe(first);
    expect(tracker.keyFor({ answer: "b" })).not.toBe(first);
  });
});
