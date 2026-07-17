import { readFileSync, statSync, existsSync } from "node:fs";
import pkg from "../package.json" with { type: "json" };
import { SITE_CONFIG } from "../build-config.js";
import { hasForbiddenScriptHost } from "./html-policy.mjs";

const index = readFileSync("index.html", "utf8");
const bundle = readFileSync("app.js", "utf8");
const css = readFileSync("styles.css", "utf8");
const app = readFileSync("src/components/App.jsx", "utf8");
const form = readFileSync("src/components/ContactForm.jsx", "utf8");
const domain = readFileSync("src/domain/configurator.js", "utf8");
const api = readFileSync("src/api/client.js", "utf8");
const manifest = readFileSync("src/config/assets.js", "utf8");
const forbiddenScriptHosts = new Set(["unpkg.com"]);
const checks = [
  [!hasForbiddenScriptHost(index, forbiddenScriptHosts) && !index.includes("unsafe-inline") && !index.includes("<style") && !index.includes("<script defer crossorigin"), "React is bundled locally and inline CSP allowances are removed"],
  [index.includes('script-src \'self\'') && index.includes('style-src \'self\'') && index.includes("styles.css"), "self-hosted scripts and external CSS are enforced"],
  [index.includes(SITE_CONFIG.apiBase) && index.includes(SITE_CONFIG.fallbackApiBase), "generated CSP contains central API origins"],
  [bundle.includes(SITE_CONFIG.apiBase) && bundle.includes(SITE_CONFIG.fallbackApiBase), "bundle contains central primary and fallback API origins"],
  [api.includes("/v1/recommendations/preview") && api.includes("rules_version") && !domain.includes("PUMP_SIZE") && !domain.includes("DREDGE_SIZE") && !domain.includes("function recommend"), "authoritative preview replaces local recommendation truth"],
  [domain.includes('["application", "material", "production_dredge", "deployment_dredge", "power"]') && domain.includes('["application", "material", "flow_pump", "head", "power", "deployment_pump"]'), "canonical question tracks are present"],
  [domain.includes('answers.deployment === "excavator"') && domain.includes('id === "hydraulic"'), "excavator power compatibility is enforced"],
  [form.includes('minLength="2"') && form.includes('maxLength="500"') && form.includes('type="email"')
    && form.includes('emailDomain.includes(".")') && form.includes('!emailDomain.startsWith(".")')
    && form.includes('!emailDomain.endsWith(".")') && form.includes("event.currentTarget.reportValidity()")
    && !app.includes("validEmail"), "canonical name/material limits, native email validity, and obvious domain completeness are enforced"],
  [[
    'max="50000"', 'min="-1000" max="5000"', 'max="1000"', 'max="48"', 'max="10"',
    'max="100"', 'min="0.25" max="48"', 'maxLength="4000"',
  ].every((constraint) => form.includes(constraint)), "project constraints match the backend schema"],
  [api.includes("AbortController") && api.includes("submissionTimeoutMs") && app.includes("IdempotencyTracker"), "timeouts and payload-aware idempotency are included"],
  [app.includes('role="status"') && app.includes('aria-live="polite"') && app.includes("successRef") && readFileSync("src/components/Result.jsx", "utf8").includes('<h1 className="fam"'), "success and result accessibility semantics are present"],
  [manifest.includes("images/dredging.webp") && !manifest.includes(".jpg") && existsSync("images/dredging.webp") && !existsSync("images/dredging.jpg"), "explicit asset manifest uses the real WebP extension"],
  [index.includes(`release-id\" content=\"${SITE_CONFIG.releaseId}`) && !bundle.includes("sourceMappingURL") && !existsSync("app.js.map"), "release ID and no-production-source-map policy are enforced"],
  [pkg.dependencies.react === "18.3.1" && pkg.dependencies["react-dom"] === "18.3.1", "exact React dependencies are local"],
  [css.includes("min-height:48px") && css.includes("@media(max-width:620px)"), "older-user controls and mobile layout are retained"],
  [statSync("images/eddy-pump-corporation-logo.webp").size < 100000 && statSync("images/dredging.webp").size < 250000, "optimized local images are bounded"],
  [bundle.length > 100000 && bundle.length < 250000, "production bundle has expected bundled-React size"],
];
for (const [ok, label] of checks) console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
if (checks.some(([ok]) => !ok)) process.exit(1);
