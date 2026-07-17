import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "../src/components/App.jsx";

const recommendation = {
  code: "CABLE-4-in", family: "Cable-Deployed Dredge Pump — 4-in Class", specs: ["4-in discharge class"],
  review_required: true, missing_engineering_inputs: ["material analysis"],
};
const makeApi = () => ({
  preview: vi.fn().mockResolvedValue({ rulesVersion: "rules-7", recommendation }),
  submit: vi.fn().mockResolvedValue({ id: "submission-123", recommendation }),
});

async function choose(user, name) {
  await user.click(screen.getByRole("button", { name: new RegExp(name, "i") }));
}

async function completeDredge(user, deployment = "Cable Deployed") {
  await choose(user, "Dredging");
  await choose(user, "Sand & gravel");
  await user.selectOptions(screen.getByLabelText(/select production target/i), "p_150");
  await choose(user, deployment);
  if (deployment === "Excavator Attachment") await choose(user, "Hydraulic");
  else await choose(user, "Electric");
}

describe("configurator behavior", () => {
  it("runs deployment before power and limits excavators to hydraulic", async () => {
    const user = userEvent.setup();
    render(<App api={makeApi()} />);
    await choose(user, "Dredging");
    await choose(user, "Sand & gravel");
    await user.selectOptions(screen.getByLabelText(/select production target/i), "p_150");
    expect(screen.getByRole("heading", { name: /how will the dredge reach/i })).toBeInTheDocument();
    await choose(user, "Excavator Attachment");
    expect(screen.getByRole("button", { name: /hydraulic/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /electric/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /diesel/i })).not.toBeInTheDocument();
  });

  it("asks head for low and high process ranges and back prunes downstream answers", async () => {
    const user = userEvent.setup();
    render(<App api={makeApi()} />);
    await choose(user, "Process Pump");
    await choose(user, "Sludge & fines");
    await user.selectOptions(screen.getByLabelText(/select flow-rate range/i), "f_5_50");
    expect(screen.getByRole("heading", { name: /total discharge head/i })).toBeInTheDocument();
    await choose(user, "Under 120 ft");
    await choose(user, "Electric");
    await user.click(screen.getByRole("button", { name: /back to previous/i }));
    expect(screen.getByRole("heading", { name: /compatible power/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/configuration summary/i)).not.toHaveTextContent("POWER Electric");
  });

  it("shows preview loading, safe error, and retries the same answers", async () => {
    const user = userEvent.setup();
    let rejectPreview;
    const api = makeApi();
    api.preview.mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectPreview = reject; }));
    render(<App api={api} />);
    await completeDredge(user);
    expect(screen.getByRole("status")).toHaveTextContent(/checking your configuration/i);
    rejectPreview(new Error("private stack trace"));
    expect(await screen.findByRole("alert")).toHaveTextContent(/try again or contact/i);
    await user.click(screen.getByRole("button", { name: /retry recommendation/i }));
    expect(await screen.findByRole("heading", { level: 1, name: recommendation.family })).toBeInTheDocument();
    expect(api.preview).toHaveBeenCalledTimes(2);
    expect(api.preview.mock.calls[0][0]).toEqual(api.preview.mock.calls[1][0]);
  });

  it("keeps start over final when an abandoned preview resolves", async () => {
    const user = userEvent.setup();
    let resolvePreview;
    const api = makeApi();
    api.preview.mockImplementationOnce(() => new Promise((resolve) => { resolvePreview = resolve; }));
    render(<App api={api} />);
    await completeDredge(user);
    expect(screen.getByRole("status")).toHaveTextContent(/checking your configuration/i);

    await user.click(screen.getByRole("button", { name: /start over/i }));
    resolvePreview({ rulesVersion: "rules-7", recommendation });

    await waitFor(() => expect(screen.getByRole("heading", { name: /what's the job/i })).toBeInTheDocument());
    expect(screen.queryByRole("heading", { level: 1, name: recommendation.family })).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps start over final when an abandoned submission resolves", async () => {
    const user = userEvent.setup();
    let resolveSubmission;
    const api = makeApi();
    api.submit.mockImplementationOnce(() => new Promise((resolve) => { resolveSubmission = resolve; }));
    render(<App api={api} />);
    await completeDredge(user);
    await screen.findByRole("heading", { level: 1, name: recommendation.family });
    await user.type(screen.getByLabelText(/full name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/work email/i), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /submit my pricing request/i }));

    await user.click(screen.getByRole("button", { name: /start over/i }));
    resolveSubmission({ id: "abandoned-submission", recommendation });
    await completeDredge(user);
    await screen.findByRole("heading", { level: 1, name: recommendation.family });

    expect(screen.queryByRole("heading", { name: /configuration received/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/abandoned-submission/i)).not.toBeInTheDocument();
  });

  it("does not surface an abandoned submission error after start over", async () => {
    const user = userEvent.setup();
    let rejectSubmission;
    const api = makeApi();
    api.submit.mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectSubmission = reject; }));
    render(<App api={api} />);
    await completeDredge(user);
    await screen.findByRole("heading", { level: 1, name: recommendation.family });
    await user.type(screen.getByLabelText(/full name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/work email/i), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /submit my pricing request/i }));

    await user.click(screen.getByRole("button", { name: /start over/i }));
    rejectSubmission(new Error("abandoned request"));
    await completeDredge(user);
    await screen.findByRole("heading", { level: 1, name: recommendation.family });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps changed answers final when an abandoned submission resolves", async () => {
    const user = userEvent.setup();
    let resolveSubmission;
    const api = makeApi();
    api.submit.mockImplementationOnce(() => new Promise((resolve) => { resolveSubmission = resolve; }));
    render(<App api={api} />);
    await completeDredge(user);
    await screen.findByRole("heading", { level: 1, name: recommendation.family });
    await user.type(screen.getByLabelText(/full name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/work email/i), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /submit my pricing request/i }));

    await user.click(screen.getByRole("button", { name: /change my answers/i }));
    expect(screen.getByRole("heading", { name: /compatible power/i })).toBeInTheDocument();
    await choose(user, "Electric");
    await screen.findByRole("heading", { level: 1, name: recommendation.family });
    expect(screen.getByRole("button", { name: /submit my pricing request/i })).toBeEnabled();

    resolveSubmission({ id: "abandoned-submission", recommendation });
    await waitFor(() => expect(screen.queryByText(/abandoned-submission/i)).not.toBeInTheDocument());
    expect(screen.queryByRole("heading", { name: /configuration received/i })).not.toBeInTheDocument();
  });

  it("does not surface an abandoned submission error after changing answers", async () => {
    const user = userEvent.setup();
    let rejectSubmission;
    const api = makeApi();
    api.submit.mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectSubmission = reject; }));
    render(<App api={api} />);
    await completeDredge(user);
    await screen.findByRole("heading", { level: 1, name: recommendation.family });
    await user.type(screen.getByLabelText(/full name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/work email/i), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /submit my pricing request/i }));

    await user.click(screen.getByRole("button", { name: /change my answers/i }));
    expect(screen.getByRole("heading", { name: /compatible power/i })).toBeInTheDocument();
    await choose(user, "Electric");
    await screen.findByRole("heading", { level: 1, name: recommendation.family });
    expect(screen.getByRole("button", { name: /submit my pricing request/i })).toBeEnabled();

    rejectSubmission(new Error("abandoned request"));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("rejects an obvious no-dot email domain and accepts a deliverable-domain address", async () => {
    const user = userEvent.setup();
    const api = makeApi();
    render(<App api={api} />);
    await completeDredge(user);
    await screen.findByRole("heading", { level: 1, name: recommendation.family });
    await user.type(screen.getByLabelText(/full name/i), "Ada Lovelace");
    const email = screen.getByLabelText(/work email/i);
    await user.type(email, "a@b");
    expect(email.validity.valid).toBe(true);

    await user.click(screen.getByRole("button", { name: /submit my pricing request/i }));
    expect(api.submit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/complete email address/i);

    await user.clear(email);
    await user.type(email, "ada@example.com");
    await user.click(screen.getByRole("button", { name: /submit my pricing request/i }));
    await waitFor(() => expect(api.submit).toHaveBeenCalledTimes(1));
  });

  it("uses the exact direct-contact telephone link", async () => {
    const user = userEvent.setup();
    render(<App api={makeApi()} />);
    await completeDredge(user);
    await screen.findByRole("heading", { level: 1, name: recommendation.family });

    expect(screen.getByRole("link", { name: "+1 619-655-2552" })).toHaveAttribute("href", "tel:+16196552552");
  });

  it("uses native email validity and canonical text limits", async () => {
    const user = userEvent.setup();
    const api = makeApi();
    render(<App api={api} />);
    await completeDredge(user);
    await screen.findByRole("heading", { level: 1, name: recommendation.family });
    const name = screen.getByLabelText(/full name/i);
    const email = screen.getByLabelText(/work email/i);
    const otherLimits = document.querySelectorAll('[maxlength="500"]');
    expect(otherLimits.length).toBeGreaterThanOrEqual(1);
    expect(name).toHaveAttribute("minlength", "2");
    await user.type(name, "A");
    await user.type(email, "not-an-email");
    expect(email.validity.valid).toBe(false);
    await user.click(screen.getByRole("button", { name: /submit my pricing request/i }));
    expect(api.submit).not.toHaveBeenCalled();
  });

  it("mirrors every hardened backend project-detail bound", async () => {
    const user = userEvent.setup();
    render(<App api={makeApi()} />);
    await completeDredge(user);
    await screen.findByRole("heading", { level: 1, name: recommendation.family });
    await user.click(screen.getByText(/add optional project details/i));
    const expected = [
      [/discharge distance/i, "0", "50000"], [/elevation gain/i, "-1000", "5000"],
      [/water depth/i, "0", "1000"], [/maximum solids size/i, "0", "48"],
      [/specific gravity/i, "0.1", "10"], [/percent solids/i, "0", "100"],
      [/pipe diameter/i, "0.25", "48"],
    ];
    for (const [label, min, max] of expected) {
      expect(screen.getByLabelText(label)).toHaveAttribute("min", min);
      expect(screen.getByLabelText(label)).toHaveAttribute("max", max);
    }
  });

  it("reconciles the final recommendation and focuses an accessible success status", async () => {
    const user = userEvent.setup();
    const api = makeApi();
    api.submit.mockResolvedValue({
      id: "submission-123",
      recommendation: { code: "FINAL", family: "Authoritative Final Family", specs: ["Final spec"] },
    });
    render(<App api={api} />);
    await completeDredge(user);
    await screen.findByRole("heading", { level: 1, name: recommendation.family });
    await user.type(screen.getByLabelText(/full name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/work email/i), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /submit my pricing request/i }));
    const status = await screen.findByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveFocus();
    expect(screen.getByRole("heading", { name: /configuration received/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: /authoritative final family/i })).toBeInTheDocument();
    expect(screen.getByText(/updated to match the final/i)).toBeInTheDocument();
    expect(screen.queryByText(/rules: rules-7/i)).not.toBeInTheDocument();
    expect(api.submit).toHaveBeenCalledWith(expect.objectContaining({
      idempotency_key: expect.stringMatching(/^web:/),
      customer: { name: "Ada Lovelace", email: "ada@example.com", company: "", phone: "" },
      answers: {
        application: "dredging", material: "sand", materialOther: null, production: "p_150",
        head: null, power: "electric", deployment: "cable",
      },
      project_details: {
        discharge_distance_ft: null, elevation_gain_ft: null, water_depth_ft: null, solids_size_in: null,
        specific_gravity: null, percent_solids: null, excavator_model: null, pipe_diameter_in: null, notes: null,
      },
      website: "",
    }));
  });
});
