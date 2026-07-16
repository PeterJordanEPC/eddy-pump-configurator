import { readFileSync, statSync } from "node:fs";

const index = readFileSync("index.html", "utf8");
const source = readFileSync("src/app.jsx", "utf8");
const bundle = readFileSync("app.js", "utf8");

const checks = [
  [!index.includes("text/babel") && !index.includes("@babel/standalone"), "runtime Babel removed"],
  [index.includes("Content-Security-Policy"), "CSP meta present"],
  [index.includes("integrity=\"sha384-"), "third-party scripts use SRI"],
  [index.includes("images/eddy-pump-corporation-logo.webp") || source.includes("images/eddy-pump-corporation-logo.webp"), "local corporate logo used"],
  [source.includes('window.location.protocol !== "https:"'), "HTTPS submission guard present"],
  [source.includes("validEmail") && source.includes("consent"), "email and consent validation present"],
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
  [source.includes("<details className=\"projectDetails\">"), "optional engineering fields are progressive disclosure"],
  [!source.includes("PHOTO PLACEHOLDER"), "prototype placeholder copy removed"],
  [bundle.length > 1000 && bundle.length < 100000, "production bundle has expected size"],
  [statSync("images/eddy-pump-corporation-logo.webp").size < 100000, "optimized logo is present"],
];

const failed = checks.filter(([ok]) => !ok);
for (const [ok, label] of checks) console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
if (failed.length) process.exit(1);
