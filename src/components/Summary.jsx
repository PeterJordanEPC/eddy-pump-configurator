import React from "react";
import { labelFor } from "../domain/configurator.js";

const rows = ["application", "material", "production", "head", "deployment", "power"];

export function Summary({ answers, recommendation }) {
  const questionFor = (key) => key === "production" ? (answers.application === "process" ? "flow_pump" : "production_dredge")
    : key === "deployment" ? (answers.application === "process" ? "deployment_pump" : "deployment_dredge") : key;
  return <aside className="sheet" aria-label="Configuration summary">
    <div className="head">CONFIGURATION SUMMARY</div>
    {!rows.some((key) => answers[key]) && <p className="empty">YOUR SELECTIONS WILL APPEAR HERE.</p>}
    {rows.filter((key) => answers[key]).map((key) => <div className="row" key={key}>
      <span className="k">{key.toUpperCase()}</span><span className="v">{key === "material" && answers.materialOther ? answers.materialOther : labelFor(questionFor(key), answers[key])}</span>
    </div>)}
    {recommendation && <div className="row"><span className="k">FAMILY</span><span className="v">{recommendation.family}</span></div>}
  </aside>;
}
