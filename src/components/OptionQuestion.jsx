import React from "react";
import { CardImage } from "./CardImage.jsx";

export function OptionQuestion({ question, options, selectMode, onPick, showOther, otherText, onOtherText, onContinueOther }) {
  return <>
    {selectMode ? <div className="flowSelect">
      <label htmlFor="flow-rate-selection">{question.key === "production" && question.eyebrow === "PRODUCTION" ? "SELECT PRODUCTION TARGET" : "SELECT FLOW-RATE RANGE"}</label>
      <select id="flow-rate-selection" defaultValue="" onChange={(event) => {
        const option = options.find(({ id }) => id === event.target.value);
        if (option) onPick(option);
      }}>
        <option value="" disabled>Choose the closest range…</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.label} — {option.desc}</option>)}
      </select>
    </div> : <div className="grid">
      {options.map((option) => <button key={option.id} className="card" type="button" onClick={() => onPick(option)} aria-label={`${option.label}. ${option.desc}`}>
        <CardImage kind={option.art} eager={question.key === "application"} />
        <h2>{option.label}</h2><p>{option.desc}</p><span className="cardCue">SELECT</span>
      </button>)}
    </div>}
    {showOther && <div className="otherBox">
      <label htmlFor="other-material">WHAT ARE YOU MOVING?</label>
      <div className="otherRow"><input id="other-material" autoFocus minLength="2" maxLength="500" value={otherText} onChange={(event) => onOtherText(event.target.value)} />
      <button className="cta noTopMargin" type="button" disabled={otherText.trim().length < 2} onClick={onContinueOther}>Continue</button></div>
    </div>}
  </>;
}
