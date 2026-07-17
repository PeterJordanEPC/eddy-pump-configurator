import React from "react";
import { CardImage } from "./CardImage.jsx";
import { ContactForm } from "./ContactForm.jsx";

export function Result({ recommendation, answers, rulesVersion, reconciled, submitting, submitError, onSubmit, headingRef }) {
  const art = answers.application === "process" ? answers.deployment : answers.deployment || "dredging";
  return <div className="result">
    <p className="eyebrow">PRELIMINARY RECOMMENDATION</p>
    {reconciled && <p className="reconciledNotice">The displayed recommendation was updated to match the final authoritative submission result.</p>}
    <article className="resultCard">
      <CardImage kind={art} />
      <div className="resultBody">
        <h1 className="fam" ref={headingRef} tabIndex="-1">{recommendation.family}</h1>
        <p className="blurb">This product family comes from the authoritative EDDY Pump recommendation service.</p>
        <div className="speclist">{recommendation.specs?.map((spec) => <span key={spec} className="chip">{spec}</span>)}</div>
        {rulesVersion && <p className="rulesVersion">Rules: {rulesVersion}</p>}
        <p className="disclaimer">Final pump sizing, drive selection, and pricing require engineering review of site and material conditions.</p>
      </div>
    </article>
    <section className="leadbox" aria-label="Project pricing request"><ContactForm answers={answers} submitting={submitting} error={submitError} onSubmit={onSubmit} /></section>
  </div>;
}
