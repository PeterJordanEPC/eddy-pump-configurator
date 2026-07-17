import { readFileSync, statSync } from "node:fs";

const index = readFileSync("index.html", "utf8");
const source = readFileSync("src/app.jsx", "utf8");
const bundle = readFileSync("app.js", "utf8");
const readme = readFileSync("README.md", "utf8");

const checks = [
  [!index.includes("text/babel") && !index.includes("@babel/standalone"), "runtime Babel removed"],
  [index.includes("Content-Security-Policy"), "CSP meta present"],
  [index.includes("integrity=\"sha384-"), "third-party scripts use SRI"],
  [index.includes("images/eddy-pump-corporation-logo.webp") || source.includes("images/eddy-pump-corporation-logo.webp"), "local corporate logo used"],
  [source.includes('window.location.protocol !== "https:"'), "HTTPS submission guard present"],
  [source.includes("validEmail") && !source.includes("consent"), "email validation present without a separate confirmation field"],
  [/if \(done\) \{[\s\S]*?setIdempotencyKey\(newIdempotencyKey\(\)\);[\s\S]*?setDone\(false\);[\s\S]*?return;/.test(source), "changed answers receive a fresh idempotency key"],
  [source.includes('htmlFor="other-material"') && source.includes('id="other-material"'), "other-material input has an associated label"],
  [source.includes('const SELECT_QUESTION_IDS = new Set(["production_dredge", "flow_pump"]);') && source.includes('<select id="flow-rate-selection"'), "dredge and pump flow questions use a compact dropdown"],
  [/track\.slice\(targetIdx\)[\s\S]*?delete next\[QUESTIONS\[qid\]\.key\][\s\S]*?setAnswers\(next\)/.test(source), "Back removes the target and downstream selections"],
  [[
    "75–150 cu yd/hr (250–1,200 GPM)",
    "150–200 cu yd/hr (450–2,500 GPM)",
    "250–300 cu yd/hr (1,400–3,600 GPM)",
    "300–350 cu yd/hr (1,600–5,000 GPM)",
    "500–600 cu yd/hr (2,600–7,300 GPM)",
  ].every((range) => source.includes(range)), "dredge production options include exact platform GPM ranges"],
  [[
    "5–50 GPM (1-in Pump)",
    "50–200 GPM (2-in Pump)",
    "200–400 GPM (3-in Pump)",
    "400–900 GPM (4-in Pump)",
    "900–1,600 GPM (6-in Pump)",
    "1,600–2,500 GPM (8-in Pump)",
    "2,500–3,500 GPM (10-in Pump)",
    "3,500–6,000 GPM (12-in Pump)",
    "6,000–12,000 GPM (16-in Pump)",
  ].every((range) => source.includes(range)) && !source.includes("(5-in Pump)"), "process flow options include exact pump sizes and exclude 5-in"],
  [!source.includes("HH2000") && source.includes("${PROCESS_POWER[a.power] || \"Specified drive\"}"), "process recommendation preserves deployment and includes selected power without HH2000 override"],
  [source.includes("Head is captured for engineering review") && !readme.includes("HH2000"), "high-head guidance matches non-overriding recommendation rule"],
  [source.includes('className="stepNav"') && source.includes("← Back to previous question"), "Back navigation is placed at the top of each revisable step"],
  [source.includes("headingRef") && source.includes("hasTransitionedRef") && source.includes("scrollIntoView"), "step changes return focus and viewport to the question heading without scrolling initial load"],
  [["contact-name", "contact-email", "contact-company", "contact-phone"].every((id) => source.includes(`htmlFor="${id}"`) && source.includes(`id="${id}"`)), "contact fields use persistent visible labels"],
  [source.includes("Submit my pricing request") && source.includes("Request fast project pricing ↓") && source.includes("fast, engineering-reviewed project pricing") && !/instant (price|quote)/i.test(source), "quote CTAs are benefit-led without promising instant firm pricing"],
  [source.includes("Project notes") && source.indexOf("Project notes") < source.indexOf('<details className="projectDetails">'), "Project notes is always visible before optional engineering details"],
  [!source.includes("consentRow") && !source.includes("setConsent") && !source.includes("consent: true") && source.includes("By submitting, you ask EDDY Pump to contact you about this project"), "submission uses a clear contact notice without a confirmation checkbox"],
  [source.includes("Name and a valid work email are required") && source.includes("No payment required"), "contact form explains requirements and reassurance"],
  [source.includes("font-size:16px; min-height:48px"), "form controls are sized for older users"],
  [source.includes("--orange: #B94708") && source.includes("border:1px solid #7A8AA0") && source.includes("grid-template-columns:112px minmax(0,1fr)"), "mobile cards are compact and text/control contrast meets accessibility targets"],
  [source.includes("reportValidity()") && source.includes("lastPayloadSignatureRef") && source.includes(".otherRow { flex-direction:column"), "numeric constraints, changed-payload idempotency, and mobile Other layout are protected"],
  [source.includes('aria-invalid={nameInvalid}') && source.includes('aria-invalid={emailInvalid}'), "required contact fields expose inline validation state"],
  [source.includes("Pump size comes from this production/GPM range") && source.includes("deployment choice determines the dredge system type"), "dredge sizing and deployment responsibilities are explicit"],
  [source.includes("<details className=\"projectDetails\">"), "optional engineering fields are progressive disclosure"],
  [!source.includes("PHOTO PLACEHOLDER"), "prototype placeholder copy removed"],
  [bundle.length > 1000 && bundle.length < 100000, "production bundle has expected size"],
  [statSync("images/eddy-pump-corporation-logo.webp").size < 100000, "optimized logo is present"],
];

const failed = checks.filter(([ok]) => !ok);
for (const [ok, label] of checks) console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
if (failed.length) process.exit(1);
