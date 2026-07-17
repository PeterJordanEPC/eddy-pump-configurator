import { describe, expect, it } from "vitest";
import { buildTrack, compatiblePowerOptions, normalizeAnswers, validateAnswers } from "../src/domain/configurator.js";

describe("canonical configurator domain", () => {
  it("asks deployment before compatible power for dredging", () => {
    expect(buildTrack({ application: "dredging" })).toEqual([
      "application", "material", "production_dredge", "deployment_dredge", "power",
    ]);
  });

  it("asks head context for every process flow range", () => {
    for (const production of ["f_5_50", "f_50_200", "f_6000_12000"]) {
      expect(buildTrack({ application: "process", production })).toEqual([
        "application", "material", "flow_pump", "head", "power", "deployment_pump",
      ]);
    }
  });

  it("offers and accepts only hydraulic power for excavators", () => {
    const answers = { application: "dredging", deployment: "excavator", power: "diesel" };
    expect(compatiblePowerOptions(answers).map(({ id }) => id)).toEqual(["hydraulic"]);
    expect(normalizeAnswers(answers).power).toBeUndefined();
    expect(validateAnswers({ ...answers, power: "diesel" })).toContain("Excavator deployments require hydraulic power.");
  });

  it("rejects non-canonical tracks and impossible values", () => {
    expect(validateAnswers({
      application: "process", material: "sand", production: "f_5_50", head: "h_under",
      power: "electric", deployment: "excavator",
    })).toContain("Choose a valid process pump configuration.");
    expect(validateAnswers({
      application: "dredging", material: "sand", production: "f_5_50", deployment: "cable", power: "electric",
    })).toContain("Choose a valid dredging production range.");
  });

  it("requires trimmed other-material text to match the backend minimum", () => {
    const answers = {
      application: "dredging", material: "other", materialOther: " x ", production: "p_150",
      deployment: "cable", power: "electric",
    };
    expect(validateAnswers(answers)).toContain("Describe the other material in 2 to 500 characters.");
    expect(validateAnswers({ ...answers, materialOther: undefined })).toContain("Describe the other material in 2 to 500 characters.");
    expect(validateAnswers({ ...answers, materialOther: " ash " })).toEqual([]);
  });
});
