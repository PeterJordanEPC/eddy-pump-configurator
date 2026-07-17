import React from "react";
import { assetFor } from "../config/assets.js";

export function BlueprintArt({ kind }) {
  return <svg viewBox="0 0 160 115" className="cardArt" aria-hidden="true" focusable="false">
    <rect x="1" y="1" width="158" height="113" className="blueprintFrame" />
    <circle cx="70" cy="58" r="25" className="blueprintPrimary" />
    <path d="M20 88H140M70 33V18M95 58h38" className="blueprintSecondary" />
    <text x="80" y="105" textAnchor="middle" className="blueprintText">{kind?.toUpperCase()}</text>
  </svg>;
}

export function CardImage({ kind, eager = false }) {
  const src = assetFor(kind);
  return src
    ? <img className="cardArt cardPhoto" src={src} alt="" width="800" height="600" loading={eager ? "eager" : "lazy"} decoding="async" />
    : <BlueprintArt kind={kind} />;
}
