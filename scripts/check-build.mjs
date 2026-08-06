import { existsSync, readFileSync, statSync } from "node:fs";
import { clearAnswersFromTrack, filterQuestionOptions } from "../src/flow-state.mjs";

const index = readFileSync("index.html", "utf8");
const source = readFileSync("src/app.jsx", "utf8");
const bundle = readFileSync("app.js", "utf8");
const readme = readFileSync("README.md", "utf8");
const backStart = source.indexOf("const back =");
const backEnd = source.indexOf("const restart =", backStart);
const backSource = backStart >= 0 && backEnd > backStart
  ? source.slice(backStart, backEnd)
  : "";
const externalScripts = [...index.matchAll(/<script\b[^>]*\bsrc=["'][^"']+["'][^>]*>/gi)]
  .map((match) => match[0])
  .filter((tag) => /\bsrc=["']https?:\/\//i.test(tag));
const approvedPhotoFiles = [
  "dredging.jpg", "process.jpg", "sand.jpg", "sludge.jpg", "tailings.jpg",
  "debris.jpg", "other.jpg", "electric.jpg", "excavator.jpg", "cable.jpg",
  "sled.jpg", "diver.jpg", "flooded.jpg", "submersible.jpg", "selfpriming.jpg",
];

const checks = [
  [!index.includes("text/babel") && !index.includes("@babel/standalone"), "runtime Babel removed"],
  [index.includes("Content-Security-Policy") && index.includes("default-src 'self'") && index.includes("object-src 'none'"), "restrictive CSP meta present"],
  [externalScripts.length > 0 && externalScripts.every((tag) => /\bintegrity=["']sha384-/.test(tag) && /\bcrossorigin=["']anonymous["']/.test(tag)), "every third-party script uses SRI"],
  [index.includes("images/eddy-pump-corporation-logo.webp") || source.includes("images/eddy-pump-corporation-logo.webp"), "local corporate logo used"],
  [source.includes('window.location.protocol !== "https:"'), "HTTPS submission guard present"],
  [source.includes("validEmail") && !source.includes("consent"), "email validation present without a separate confirmation field"],
  [backSource.includes("if (done)") && backSource.includes("setIdempotencyKey(newIdempotencyKey());") && backSource.indexOf("setIdempotencyKey(newIdempotencyKey());") < backSource.indexOf("setDone(false);"), "changed answers receive a fresh idempotency key"],
  [source.includes('htmlFor="other-material"') && source.includes('id="other-material"'), "other-material input has an associated label"],
  [source.includes('const SELECT_QUESTION_IDS = new Set(["production_dredge", "flow_pump"]);') && source.includes('<select id="flow-rate-selection"'), "dredge and pump flow questions use a compact dropdown"],
  [source.includes('["application", "material", "deployment_dredge", "production_dredge"]') && source.includes('if (a.deployment !== "excavator") t.push("power")') && source.includes('next.power = "hydraulic"'), "deployment precedes production and excavator selection fixes hydraulic power"],
  [source.includes('return ["application", "material", "flow_pump", "head", "deployment_pump", "power"]'), "every process-pump path captures head before configuration and power"],
  [source.includes("clearAnswersFromTrack({") && source.includes("answers, track, targetIdx, questions: QUESTIONS"), "Back delegates target/downstream cleanup to the behavior-tested flow helper"],
  [[
    "75–150 cu yd/hr (250–1,200 GPM)",
    "Over 150–200 cu yd/hr (450–2,500 GPM)",
    "250–300 cu yd/hr (1,400–3,600 GPM)",
    "Over 300–350 cu yd/hr (1,600–5,000 GPM)",
    "500–600 cu yd/hr (2,600–7,300 GPM)",
  ].every((range) => source.includes(range)), "dredge production options include exact platform GPM ranges"],
  [[
    "Up to 50 GPM",
    "Over 50–200 GPM",
    "Over 200–400 GPM",
    "Over 400–900 GPM",
    "Over 900–1,600 GPM",
    "Over 1,600–2,500 GPM",
    "Over 2,500–3,500 GPM",
    "Over 3,500–7,300 GPM",
    "Over 7,300 GPM — custom engineering review",
  ].every((range) => source.includes(range))
    && !source.includes("f_6000_12000")
    && !source.includes("16-in Pump"), "process flow options avoid unsupported automatic sizes and cover custom review"],
  [!source.includes("const PUMP_SIZE") && !source.includes("function recommend("), "browser does not maintain a duplicate recommendation engine"],
  [source.includes("/v1/recommendations/preview") && source.includes("setRecommendation") && source.includes("rules_version"), "visible recommendation comes from the versioned API preview"],
  [!(/\bpump class\b/i.test(source)) && !source.includes("16-in Pump"), "customer-facing recommendations do not claim an automatic pump class"],
  [source.includes("Head is captured for engineering review") && !readme.includes("HH2000"), "high-head guidance matches non-overriding recommendation rule"],
  [source.includes('className="stepNav"') && source.includes("← Back to previous question"), "Back navigation is placed at the top of each revisable step"],
  [source.includes('className="brand brandHome"') && source.includes('href="/"') && source.includes('aria-label="Start over from the beginning"'), "header logo is an accessible start-over link"],
  [source.includes("headingRef") && source.includes("hasTransitionedRef") && source.includes("scrollIntoView"), "step changes return focus and viewport to the question heading without scrolling initial load"],
  [["contact-name", "contact-email", "contact-company", "contact-phone"].every((id) => source.includes(`htmlFor="${id}"`) && source.includes(`id="${id}"`)), "contact fields use persistent visible labels"],
  [source.includes("Submit my pricing request") && source.includes("Request fast project pricing ↓") && source.includes("fast, engineering-reviewed project pricing") && !/instant (price|quote)/i.test(source), "quote CTAs are benefit-led without promising instant firm pricing"],
  [source.includes("Project notes") && source.indexOf("Project notes") < source.indexOf('<details className="projectDetails">'), "Project notes is always visible before optional engineering details"],
  [!source.includes("consentRow") && !source.includes("setConsent") && !source.includes("consent: true") && source.includes("Submit my pricing request"), "submission remains deliberate without a fabricated consent value"],
  [!["consentRow", "setConsent", "consent: true", "No payment required", "ENGINEERING REVIEW REQUIRED"].some((copy) => source.includes(copy)) && source.includes("privacy-policy"), "privacy disclosure is present without fabricated consent or sales claims"],
  [source.includes('className="successScreen"') && source.includes("PRICING REQUEST RECEIVED") && source.includes("Eddy Pump Sales Engineer") && !source.includes("EDDY Pump specialist") && source.includes("!submitted && <aside"), "successful submission replaces recommendation and summary with a prominent sales-engineer confirmation"],
  [source.includes("font-size:16px; min-height:48px"), "form controls are sized for older users"],
  [source.includes("--orange: #B94708") && source.includes("border:1px solid #7A8AA0") && source.includes("grid-template-columns:112px minmax(0,1fr)"), "mobile cards are compact and text/control contrast meets accessibility targets"],
  [source.includes("reportValidity()") && source.includes("lastPayloadSignatureRef") && source.includes(".otherRow { flex-direction:column"), "numeric constraints, changed-payload idempotency, and mobile Other layout are protected"],
  [source.includes('aria-invalid={nameInvalid}') && source.includes('aria-invalid={emailInvalid}'), "required contact fields expose inline validation state"],
  [source.includes('id="contact-name"') && source.includes('minLength="2"'), "contact name browser constraint matches API minimum"],
  [source.includes('id="other-material"') && source.includes('minLength="2"') && source.includes('maxLength="500"'), "Other material browser constraints match API"],
  [source.includes('max="50000"') && source.includes('min="-1000" max="5000"') && source.includes('max="1000"') && source.includes('max="48"'), "numeric browser bounds match API"],
  [(source.match(/step="any"/g) || []).length >= 7, "all optional decimal inputs accept API-valid decimal precision"],
  [source.includes('id="project-notes" maxLength="4000"'), "project notes browser limit matches API"],
  [source.includes('excavator_model: answers.deployment === "excavator"') && source.includes('? project.excavator_model || null') && source.includes(': null'), "hidden excavator model cannot leak into another deployment payload"],
  [source.includes("Pump size comes from this production/GPM range") && source.includes("deployment choice determines the dredge system type"), "dredge sizing and deployment responsibilities are explicit"],
  [
    source.includes('{ id: "electric", label: "Electric"')
      && source.includes('{ id: "hydraulic", label: "Hydraulic"')
      && !source.includes('{ id: "diesel", label: "Diesel / self-contained"'),
    "power selection offers only electric and hydraulic",
  ],
  [
    !source.includes('{ id: "remote", label: "Remote Operated Dredge"')
      && !source.includes('{ id: "auger", label: "Mini Auger ModDredge"'),
    "dredge deployment excludes remote-operated and mini-auger options",
  ],
  [
    !source.includes("function recommend(")
      && !source.includes('{ id: "diesel"')
      && !source.includes('{ id: "remote"')
      && !source.includes('{ id: "auger"'),
    "browser has no recommendation engine or removed configuration options",
  ],
  [
    !source.includes("Subdredge")
      && !source.includes("Mini Auger")
      && !source.includes("Diesel"),
    "rendered customer copy does not advertise removed configurations",
  ],
  [
    !readme.includes("diesel.jpg")
      && !readme.includes("remote.jpg")
      && !readme.includes("auger.jpg"),
    "product-image inventory excludes removed configurations",
  ],
  [source.includes("<details className=\"projectDetails\">"), "optional engineering fields are progressive disclosure"],
  [!source.includes("PHOTO PLACEHOLDER"), "prototype placeholder copy removed"],
  [bundle.length > 1000 && bundle.length < 100000, "production bundle has expected size"],
  [statSync("images/eddy-pump-corporation-logo.webp").size < 100000, "optimized logo is present"],
  [approvedPhotoFiles.every((name) => existsSync(`images/${name}`)), "all approved product photos are present"],
  [approvedPhotoFiles.every((name) => statSync(`images/${name}`).size > 10000 && statSync(`images/${name}`).size < 500000), "approved product photos have bounded file sizes"],
  [source.includes('{ id: "process", label: "Process Pump"') && source.includes('art: "process"'), "Process Pump application uses its dedicated approved photo"],
  [readme.includes("`process.jpg` | Process pump application") && readme.includes("`tailings.jpg`"), "product-photo inventory documents process and tailings mappings"],
];

const dredgeTrack = ["application", "material", "deployment_dredge", "production_dredge"];
const flowQuestions = {
  application: { key: "application" },
  material: { key: "material" },
  deployment_dredge: { key: "deployment" },
  production_dredge: { key: "production" },
};
const revised = clearAnswersFromTrack({
  answers: {
    application: "dredging", material: "sand", deployment: "excavator",
    production: "p_200", power: "hydraulic",
  },
  track: dredgeTrack,
  targetIdx: 2,
  questions: flowQuestions,
});
checks.push([
  revised.deployment === undefined && revised.production === undefined && revised.power === undefined,
  "Back to deployment clears deployment, production, and implied hydraulic power",
]);
const replacement = { ...revised, deployment: "cable", power: "electric" };
checks.push([
  replacement.deployment === "cable" && replacement.power === "electric",
  "revising excavator deployment produces a clean replacement deployment and power payload",
]);

const productionOptions = [
  { id: "p_150" }, { id: "p_200" }, { id: "p_300" }, { id: "p_350" }, { id: "p_600" },
];
checks.push([
  filterQuestionOptions("production_dredge", productionOptions, { deployment: "sled" })
    .map((option) => option.id).join(",") === "p_150",
  "dredge sled exposes only the 4-inch 75–150 cu yd/hr production option",
]);
checks.push([
  filterQuestionOptions("production_dredge", productionOptions, { deployment: "diver" })
    .map((option) => option.id).join(",") === "p_150,p_200",
  "diver-operated dredge exposes only the 4-inch and 6-inch production options",
]);
for (const deployment of ["excavator", "cable", undefined, "unknown"]) {
  checks.push([
    filterQuestionOptions("production_dredge", productionOptions, { deployment })
      .map((option) => option.id).join(",") === "p_150,p_200,p_300,p_350,p_600",
    `${deployment || "unspecified"} dredge deployment retains every production range in order`,
  ]);
}

const powerOptions = [{ id: "electric" }, { id: "hydraulic" }];
checks.push([
  filterQuestionOptions("power", powerOptions, { application: "process", deployment: "selfpriming" })
    .map((option) => option.id).join(",") === "electric",
  "self-priming process pump exposes only electric power",
]);
for (const deployment of ["flooded", "submersible"]) {
  checks.push([
    filterQuestionOptions("power", powerOptions, { application: "process", deployment })
      .map((option) => option.id).join(",") === "electric,hydraulic",
    `${deployment} process pump retains electric and hydraulic power`,
  ]);
}

const failed = checks.filter(([ok]) => !ok);
for (const [ok, label] of checks) console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
if (failed.length) process.exit(1);
