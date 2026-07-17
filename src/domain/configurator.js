import { POWER_OPTIONS, QUESTIONS } from "./questions.js";

const DREDGE_PRODUCTION = new Set(QUESTIONS.production_dredge.options.map(({ id }) => id));
const PROCESS_PRODUCTION = new Set(QUESTIONS.flow_pump.options.map(({ id }) => id));
const DREDGE_DEPLOYMENT = new Set(QUESTIONS.deployment_dredge.options.map(({ id }) => id));
const PROCESS_DEPLOYMENT = new Set(QUESTIONS.deployment_pump.options.map(({ id }) => id));
const MATERIALS = new Set(QUESTIONS.material.options.map(({ id }) => id));
const POWERS = new Set(POWER_OPTIONS.map(({ id }) => id));

export function buildTrack(answers) {
  if (answers.application === "dredging") {
    return ["application", "material", "production_dredge", "deployment_dredge", "power"];
  }
  if (answers.application === "process") {
    return ["application", "material", "flow_pump", "head", "power", "deployment_pump"];
  }
  return ["application"];
}

export function compatiblePowerOptions(answers) {
  return answers.application === "dredging" && answers.deployment === "excavator"
    ? POWER_OPTIONS.filter(({ id }) => id === "hydraulic")
    : POWER_OPTIONS;
}

export function optionsForQuestion(questionId, answers) {
  return questionId === "power" ? compatiblePowerOptions(answers) : QUESTIONS[questionId]?.options || [];
}

export function normalizeAnswers(answers) {
  const next = { ...answers };
  if (next.application === "dredging") delete next.head;
  if (next.application === "dredging" && next.deployment === "excavator" && next.power !== "hydraulic") delete next.power;
  return next;
}

export function validateAnswers(answers) {
  const errors = [];
  if (!["dredging", "process"].includes(answers.application)) errors.push("Choose a valid application.");
  if (!MATERIALS.has(answers.material)) errors.push("Choose a valid material.");
  const otherLength = answers.materialOther?.trim().length || 0;
  if (answers.material === "other" && (otherLength < 2 || otherLength > 500)) errors.push("Describe the other material in 2 to 500 characters.");
  if (answers.application === "dredging") {
    if (!DREDGE_PRODUCTION.has(answers.production)) errors.push("Choose a valid dredging production range.");
    if (!DREDGE_DEPLOYMENT.has(answers.deployment)) errors.push("Choose a valid dredging deployment.");
    if (answers.deployment === "excavator" && answers.power !== "hydraulic") errors.push("Excavator deployments require hydraulic power.");
  }
  if (answers.application === "process") {
    if (!PROCESS_PRODUCTION.has(answers.production)) errors.push("Choose a valid process flow range.");
    if (!PROCESS_DEPLOYMENT.has(answers.deployment)) errors.push("Choose a valid process pump configuration.");
    if (!["h_under", "h_over"].includes(answers.head)) errors.push("Choose a discharge-head range.");
  }
  if (!POWERS.has(answers.power)) errors.push("Choose a valid power source.");
  return errors;
}

export function pruneAnswers(answers, track, targetIndex) {
  const next = { ...answers };
  for (const questionId of track.slice(targetIndex)) delete next[QUESTIONS[questionId].key];
  if (!next.material) delete next.materialOther;
  return normalizeAnswers(next);
}

export function labelFor(questionId, value) {
  return QUESTIONS[questionId]?.options.find(({ id }) => id === value)?.label || value || "";
}
