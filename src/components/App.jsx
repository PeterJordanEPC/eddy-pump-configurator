import React, { useEffect, useMemo, useRef, useState } from "react";
import { customerSafeError, reconcileRecommendation } from "../api/client.js";
import { buildTrack, normalizeAnswers, optionsForQuestion, pruneAnswers, validateAnswers } from "../domain/configurator.js";
import { IdempotencyTracker } from "../domain/idempotency.js";
import { QUESTIONS, SELECT_QUESTION_IDS } from "../domain/questions.js";
import { OptionQuestion } from "./OptionQuestion.jsx";
import { Result } from "./Result.jsx";
import { Summary } from "./Summary.jsx";

export function App({ api }) {
  const [answers, setAnswers] = useState({});
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState("questions");
  const [otherText, setOtherText] = useState("");
  const [showOther, setShowOther] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(null);
  const [reconciled, setReconciled] = useState(false);
  const headingRef = useRef(null);
  const successRef = useRef(null);
  const transitioned = useRef(false);
  const tracker = useRef(new IdempotencyTracker());
  const previewGeneration = useRef(0);
  const submitGeneration = useRef(0);
  const track = buildTrack(answers);
  const questionId = track[stepIndex];
  const question = QUESTIONS[questionId];
  const recommendation = preview?.recommendation || null;

  useEffect(() => {
    if (!transitioned.current) { transitioned.current = true; return; }
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ block: "start" });
  }, [stepIndex, phase]);

  useEffect(() => {
    if (success) successRef.current?.focus({ preventScroll: true });
  }, [success]);

  const previewInput = useMemo(() => ({ answers, project_details: {} }), [answers]);
  const loadPreview = async () => {
    const generation = ++previewGeneration.current;
    const errors = validateAnswers(answers);
    if (errors.length) {
      setPreviewError("Please review your answers before requesting a recommendation.");
      setPhase("previewError");
      return;
    }
    setPhase("previewLoading");
    setPreviewError("");
    try {
      const result = await api.preview(previewInput);
      if (generation !== previewGeneration.current) return;
      setPreview(result);
      setPhase("result");
    } catch (error) {
      if (generation !== previewGeneration.current) return;
      setPreviewError(customerSafeError(error));
      setPhase("previewError");
    }
  };

  const advance = (rawNext) => {
    const next = normalizeAnswers(rawNext);
    setAnswers(next);
    setShowOther(false);
    setOtherText("");
    const nextTrack = buildTrack(next);
    if (stepIndex + 1 >= nextTrack.length) {
      const generation = ++previewGeneration.current;
      setTimeout(() => {
        if (generation !== previewGeneration.current) return;
        const errors = validateAnswers(next);
        if (errors.length) {
          setPreviewError("Please review your answers before requesting a recommendation.");
          setPhase("previewError");
          return;
        }
        setPhase("previewLoading");
        setPreviewError("");
        api.preview({ answers: next, project_details: {} }).then((result) => {
          if (generation !== previewGeneration.current) return;
          setPreview(result); setPhase("result");
        }).catch((error) => {
          if (generation !== previewGeneration.current) return;
          setPreviewError(customerSafeError(error)); setPhase("previewError");
        });
      }, 0);
    } else {
      setStepIndex(stepIndex + 1);
    }
  };

  const pick = (option) => {
    if (question.key === "material" && option.id === "other") { setShowOther(true); return; }
    let next = { ...answers, [question.key]: option.id };
    if (question.key === "application" && answers.application && answers.application !== option.id) next = { application: option.id };
    advance(next);
  };

  const back = () => {
    const fromResult = phase !== "questions";
    const target = fromResult ? track.length - 1 : stepIndex - 1;
    if (target < 0) return;
    submitGeneration.current += 1;
    setAnswers(pruneAnswers(answers, track, target));
    setStepIndex(target);
    setPhase("questions");
    setPreview(null); setPreviewError(""); setSubmitting(false); setSubmitError(""); setSuccess(null); setReconciled(false);
  };

  const restart = () => {
    previewGeneration.current += 1;
    submitGeneration.current += 1;
    setAnswers({}); setStepIndex(0); setPhase("questions"); setOtherText(""); setShowOther(false);
    setPreview(null); setPreviewError(""); setSubmitting(false); setSubmitError(""); setSuccess(null); setReconciled(false); tracker.current.reset();
  };

  const submit = async (submissionData) => {
    if (window.location.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(window.location.hostname)) {
      setSubmitError("Secure HTTPS is required. Please use the direct phone or email contact instead."); return;
    }
    const generation = ++submitGeneration.current;
    const key = tracker.current.keyFor(submissionData);
    setSubmitting(true); setSubmitError("");
    try {
      const result = await api.submit({ idempotency_key: key, ...submissionData });
      if (generation !== submitGeneration.current) return;
      if (result.recommendation) {
        const final = reconcileRecommendation(recommendation, result.recommendation);
        setPreview((value) => ({
          ...value,
          recommendation: final.recommendation,
          rulesVersion: result.rules_version || (final.changed ? null : value.rulesVersion),
        }));
        setReconciled(final.changed);
      }
      setSuccess({ id: result.id || "" });
    } catch (error) {
      if (generation !== submitGeneration.current) return;
      setSubmitError(customerSafeError(error));
    } finally {
      if (generation === submitGeneration.current) setSubmitting(false);
    }
  };

  const total = answers.application === "process" ? 6 : 5;
  return <div className="cfg">
    <header className="topbar"><div className="brand"><img className="logoImg" src="images/eddy-pump-corporation-logo.webp" width="800" height="166" alt="EDDY Pump Corporation" decoding="async" /><span className="productName">Pump &amp; Dredge<br />Configurator</span></div><button className="restart" type="button" onClick={restart}>START OVER</button></header>
    <div className="progress" role="progressbar" aria-label="Configurator progress" aria-valuemin="1" aria-valuemax={total} aria-valuenow={phase === "result" ? total : Math.min(stepIndex + 1, total)}>{Array.from({ length: total }, (_, index) => <span key={index} className={`tick ${index <= stepIndex ? "on" : ""}`} />)}</div>
    <main className="main"><section className="stage">
      {phase === "questions" && question && <>
        {stepIndex > 0 && <nav className="stepNav"><button className="backbtn" type="button" onClick={back}>← Back to previous question</button></nav>}
        <div ref={headingRef} tabIndex="-1"><p className="eyebrow">Step {stepIndex + 1} of {total}: {question.eyebrow}</p><h1 className="q">{question.title}</h1><p className="sub">{question.sub}</p></div>
        <OptionQuestion question={question} options={optionsForQuestion(questionId, answers)} selectMode={SELECT_QUESTION_IDS.has(questionId)} onPick={pick} showOther={showOther} otherText={otherText} onOtherText={setOtherText} onContinueOther={() => advance({ ...answers, material: "other", materialOther: otherText.trim() })} />
      </>}
      {phase === "previewLoading" && <div className="statePanel" role="status" aria-live="polite"><h1>Checking your configuration…</h1><p>We are requesting the authoritative recommendation.</p></div>}
      {phase === "previewError" && <div className="statePanel"><div role="alert"><h1>Recommendation unavailable</h1><p>{previewError}</p></div><button className="cta" type="button" onClick={loadPreview}>Retry recommendation</button><button className="backbtn secondaryAction" type="button" onClick={back}>Change answers</button></div>}
      {(phase === "result" || success) && recommendation && <>
        <nav className="stepNav"><button className="backbtn" type="button" onClick={back}>← Change my answers</button></nav>
        {success && <div ref={successRef} tabIndex="-1" className="successStatus" role="status" aria-live="polite"><h2>Configuration received ✓</h2><p>An EDDY Pump specialist will review the engineering details before confirming equipment or pricing.</p>{success.id && <p className="reference">Reference: {success.id}</p>}</div>}
        <div><Result recommendation={recommendation} answers={answers} rulesVersion={preview.rulesVersion} reconciled={reconciled} submitting={submitting} submitError={submitError} onSubmit={submit} headingRef={headingRef} /></div>
      </>}
    </section><Summary answers={answers} recommendation={recommendation} /></main>
  </div>;
}
