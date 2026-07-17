
const { useState, useMemo, useEffect, useRef } = React;
const API_BASE = "https://api-production-1940.up.railway.app";
const newIdempotencyKey = () => `web:${window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const apiErrorMessage = (detail) => {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((item) => item.msg).filter(Boolean).join(" ");
  return "We couldn't send your configuration. Please review the fields and try again.";
};

/* ============================================================
   EDDY PUMP — GUIDED PUMP & DREDGE CONFIGURATOR (PROTOTYPE)
   Two tracks: Dredging | Process Pump
   GPM ranges map directly to pump size class (no 5-in ever).
   Head is retained for engineering review and never overrides deployment or power.
   Secure lead intake posts to the Railway API; customer-facing sends remain approval-gated.
   ============================================================ */

/* ---------- Blueprint placeholder art ---------- */
const Art = ({ kind }) => {
  const s = { stroke: "#F26A21", strokeWidth: 2.5, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  const d = { stroke: "#8FA3B8", strokeWidth: 1.5, fill: "none", strokeDasharray: "4 4" };
  const art = {
    dredging: (
      <g>
        <path {...d} d="M10 55 H150" />
        <path {...s} d="M10 55 Q25 48 40 55 T70 55 T100 55 T130 55 T150 55" />
        <path {...s} d="M60 55 L60 85 M60 85 L95 85 L100 95 L55 95 Z" />
        <circle {...s} cx="77" cy="90" r="4" />
        <path {...d} d="M60 55 L45 20 L110 20 L100 55" />
      </g>
    ),
    slurry: (
      <g>
        <circle {...s} cx="70" cy="60" r="26" />
        <circle {...s} cx="70" cy="60" r="9" />
        <path {...s} d="M96 52 H140 V38 H150" />
        <path {...s} d="M70 86 V100 H30" />
        <path {...d} d="M70 60 L92 44 M70 60 L88 78 M70 60 L48 74" />
      </g>
    ),
    sand: (
      <g>
        <circle {...s} cx="50" cy="70" r="10" /><circle {...s} cx="78" cy="80" r="7" />
        <circle {...s} cx="98" cy="62" r="12" /><circle {...s} cx="70" cy="50" r="5" />
        <path {...d} d="M20 95 H140" />
      </g>
    ),
    sludge: (
      <g>
        <path {...s} d="M25 60 Q45 45 65 60 T105 60 T135 60" />
        <path {...s} d="M25 78 Q45 63 65 78 T105 78 T135 78" />
        <path {...d} d="M25 95 Q45 82 65 95 T105 95 T135 95" />
      </g>
    ),
    tailings: (
      <g>
        <path {...s} d="M30 90 L55 40 L80 90 Z" />
        <path {...s} d="M75 90 L100 55 L125 90 Z" />
        <path {...d} d="M20 90 H140" />
        <circle {...s} cx="55" cy="98" r="3" /><circle {...s} cx="100" cy="98" r="3" />
      </g>
    ),
    debris: (
      <g>
        <rect {...s} x="40" y="55" width="22" height="22" transform="rotate(15 51 66)" />
        <path {...s} d="M85 50 L105 60 L95 80 L78 72 Z" />
        <circle {...s} cx="120" cy="85" r="8" />
        <path {...d} d="M20 95 H140" />
      </g>
    ),
    other: (
      <g>
        <circle {...s} cx="80" cy="58" r="30" />
        <path {...s} d="M70 48 Q70 38 80 38 Q92 38 92 48 Q92 56 80 58 L80 66" />
        <circle {...s} cx="80" cy="76" r="1.5" />
        <path {...d} d="M20 100 H140" />
      </g>
    ),
    electric: (
      <g>
        <path {...s} d="M78 20 L58 65 H78 L68 100 L105 52 H82 L95 20 Z" />
        <path {...d} d="M30 60 H50 M112 60 H132" />
      </g>
    ),
    hydraulic: (
      <g>
        <rect {...s} x="40" y="45" width="55" height="30" rx="4" />
        <path {...s} d="M95 60 H120 M120 50 V70" />
        <path {...s} d="M50 45 V30 H85 V45" />
        <path {...d} d="M40 90 H120" />
      </g>
    ),
    diesel: (
      <g>
        <rect {...s} x="35" y="50" width="60" height="40" rx="4" />
        <path {...s} d="M50 50 V35 H60 V50" />
        <path {...s} d="M95 60 H115 L122 68 V90 H95" />
        <path {...d} d="M55 28 Q58 22 55 16 M65 28 Q68 22 65 16" />
      </g>
    ),
    excavator: (
      <g>
        <rect {...s} x="30" y="65" width="45" height="25" rx="4" />
        <circle {...s} cx="42" cy="95" r="6" /><circle {...s} cx="63" cy="95" r="6" />
        <path {...s} d="M70 65 L95 35 L120 55 L112 62" />
        <path {...s} d="M112 62 Q125 72 115 85 L105 78" />
      </g>
    ),
    cable: (
      <g>
        <path {...s} d="M75 15 Q90 40 72 60" />
        <path {...s} d="M60 60 H88 L94 82 H54 Z" />
        <path {...s} d="M62 90 Q72 84 82 90" />
        <path {...d} d="M20 70 Q45 62 70 70 T120 70 T145 70" />
      </g>
    ),
    remote: (
      <g>
        <path {...s} d="M40 65 H110 L120 78 H32 Z" />
        <circle {...s} cx="52" cy="88" r="7" /><circle {...s} cx="95" cy="88" r="7" />
        <path {...s} d="M70 65 V50 H85" />
        <path {...d} d="M90 48 Q100 40 112 44 M92 52 Q104 48 114 54" />
      </g>
    ),
    sled: (
      <g>
        <path {...s} d="M35 88 Q28 88 28 80 L28 78 M35 88 H115 M115 88 Q125 88 125 78" />
        <path {...s} d="M50 88 V72 H100 V88" />
        <path {...s} d="M60 72 L66 55 H90 L96 72" />
        <path {...d} d="M15 65 Q40 58 65 65 T115 65 T150 65" />
      </g>
    ),
    diver: (
      <g>
        <circle {...s} cx="75" cy="45" r="18" />
        <circle {...s} cx="75" cy="45" r="8" />
        <path {...s} d="M60 60 L55 90 M90 60 L95 90 M62 70 H88" />
        <path {...d} d="M15 25 Q40 18 65 25 T115 25 T150 25" />
      </g>
    ),
    auger: (
      <g>
        <path {...s} d="M40 75 H120" />
        <path {...s} d="M50 60 Q58 75 50 90 M70 60 Q78 75 70 90 M90 60 Q98 75 90 90" />
        <path {...s} d="M120 68 H135 V82 H120" />
        <path {...d} d="M15 45 Q40 38 65 45 T115 45 T150 45" />
      </g>
    ),
    flooded: (
      <g>
        <rect {...s} x="30" y="30" width="45" height="45" />
        <path {...d} d="M30 42 H75" />
        <path {...s} d="M75 65 H95" />
        <circle {...s} cx="108" cy="65" r="13" />
        <path {...s} d="M108 52 V38 H135" />
      </g>
    ),
    submersible: (
      <g>
        <path {...d} d="M15 35 Q40 28 65 35 T115 35 T150 35" />
        <path {...s} d="M62 50 H92 L98 75 H56 Z" />
        <path {...s} d="M66 85 Q77 79 88 85" />
        <path {...s} d="M77 50 V38 H110" />
      </g>
    ),
    selfpriming: (
      <g>
        <circle {...s} cx="70" cy="45" r="16" />
        <path {...s} d="M70 61 V70 L45 70 L45 90" />
        <path {...d} d="M25 90 Q40 84 55 90 H45" />
        <path {...s} d="M86 45 H120 V30" />
        <path {...d} d="M30 100 H130" />
      </g>
    ),
    flow: (
      <g>
        <path {...s} d="M25 45 H110 M25 65 H120 M25 85 H100" />
        <path {...s} d="M110 38 L122 45 L110 52 M120 58 L132 65 L120 72 M100 78 L112 85 L100 92" />
      </g>
    ),
  };
  return (
    <svg viewBox="0 0 160 115" className="cardArt" aria-hidden="true">
      {art[kind] || art.slurry}
    </svg>
  );
};

/* ---------- Photo auto-swap: drop images/<kind>.jpg to replace placeholders ---------- */
const CardImage = ({ kind }) => {
  const [usePhoto, setUsePhoto] = useState(true);
  if (!usePhoto) return <Art kind={kind} />;
  return <img className="cardArt cardPhoto" src={`images/${kind}.jpg`} alt="" onError={() => setUsePhoto(false)} />;
};

/* ---------- Questions ---------- */
const QUESTIONS = {
  application: {
    key: "application",
    eyebrow: "STEP — APPLICATION",
    title: "What's the job?",
    sub: "This sets the track for everything that follows.",
    options: [
      { id: "dredging", label: "Dredging", desc: "Ponds, harbors, canals, tailings ponds — moving material off the bottom.", art: "dredging" },
      { id: "process", label: "Process Pump", desc: "Pumping from tanks or a facility — transfer and process duty.", art: "slurry" },
    ],
  },
  material: {
    key: "material",
    eyebrow: "STEP — MATERIAL",
    title: "What are you moving?",
    sub: "Pick the closest match to your worst-case material.",
    options: [
      { id: "sand", label: "Sand & gravel", desc: "High-abrasion granular material, fast-settling.", art: "sand" },
      { id: "sludge", label: "Sludge & fines", desc: "Organics, silt, paper fines, high-viscosity muck.", art: "sludge" },
      { id: "tailings", label: "Mine tailings / slurry", desc: "Dense industrial slurry, high specific gravity.", art: "tailings" },
      { id: "debris", label: "Debris-laden material", desc: "Rock, trash, rags — large solids in the flow.", art: "debris" },
      { id: "other", label: "Other", desc: "Something else? Tell us what you're pumping.", art: "other" },
    ],
  },
  production_dredge: {
    key: "production",
    eyebrow: "STEP — PRODUCTION",
    title: "How much material per hour?",
    sub: "Rough solids production target. We'll size the family, engineering confirms the number.",
    options: [
      { id: "p_150", label: "75–150 cu yd/hr (250–1,200 GPM)", desc: "Small ponds, maintenance dredging.", art: "flow" },
      { id: "p_200", label: "150–200 cu yd/hr (450–2,500 GPM)", desc: "Mid-size projects, canals, marinas.", art: "flow" },
      { id: "p_300", label: "250–300 cu yd/hr (1,400–3,600 GPM)", desc: "Sustained production dredging.", art: "flow" },
      { id: "p_350", label: "300–350 cu yd/hr (1,600–5,000 GPM)", desc: "High-production projects.", art: "flow" },
      { id: "p_600", label: "500–600 cu yd/hr (2,600–7,300 GPM)", desc: "Maximum production duty.", art: "flow" },
    ],
  },
  flow_pump: {
    key: "production",
    eyebrow: "STEP — FLOW",
    title: "What flow rate do you need?",
    sub: "Ballpark is fine — this maps directly to a pump size.",
    options: [
      { id: "f_5_50", label: "5–50 GPM (1-in Pump)", desc: "Light transfer duty.", art: "flow" },
      { id: "f_50_200", label: "50–200 GPM (2-in Pump)", desc: "Small process lines.", art: "flow" },
      { id: "f_200_400", label: "200–400 GPM (3-in Pump)", desc: "Light plant duty.", art: "flow" },
      { id: "f_400_900", label: "400–900 GPM (4-in Pump)", desc: "Typical plant transfer.", art: "flow" },
      { id: "f_900_1600", label: "900–1,600 GPM (6-in Pump)", desc: "Heavy plant duty.", art: "flow" },
      { id: "f_1600_2500", label: "1,600–2,500 GPM (8-in Pump)", desc: "High-volume transfer.", art: "flow" },
      { id: "f_2500_3500", label: "2,500–3,500 GPM (10-in Pump)", desc: "High-volume transfer.", art: "flow" },
      { id: "f_3500_6000", label: "3,500–6,000 GPM (12-in Pump)", desc: "Major process lines.", art: "flow" },
      { id: "f_6000_12000", label: "6,000–12,000 GPM (16-in Pump)", desc: "Maximum-volume duty.", art: "flow" },
    ],
  },
  head: {
    key: "head",
    eyebrow: "STEP — DISCHARGE HEAD",
    title: "What's your total discharge head?",
    sub: "Head is captured for engineering review; it does not change the flow-sized pump, selected configuration, or power.",
    options: [
      { id: "h_under", label: "Under 120 ft", desc: "Standard discharge head.", art: "flow" },
      { id: "h_over", label: "Over 120 ft", desc: "High-head duty.", art: "flow" },
    ],
  },
  power: {
    key: "power",
    eyebrow: "STEP — POWER",
    title: "What power is available on site?",
    sub: "Choose the power source available at your site.",
    options: [
      { id: "electric", label: "Electric", desc: "Plant power or generator on site.", art: "electric" },
      { id: "hydraulic", label: "Hydraulic", desc: "Excavator or hydraulic power unit available.", art: "hydraulic" },
      { id: "diesel", label: "Diesel / self-contained", desc: "No site power — bring the power with the unit.", art: "diesel" },
    ],
  },
  deployment_dredge: {
    key: "deployment",
    eyebrow: "STEP — DEPLOYMENT",
    title: "How will the dredge reach the material?",
    sub: "Deployment method decides the product family.",
    options: [
      { id: "excavator", label: "Excavator Attachment", desc: "Mounts to the stick of an excavator you already run.", art: "excavator" },
      { id: "cable", label: "Cable Deployed", desc: "Lowered by crane or cable from shore, barge, or gantry.", art: "cable" },
      { id: "remote", label: "Remote Operated Dredge", desc: "Crewless, self-propelled unit driven from shore.", art: "remote" },
      { id: "sled", label: "Dredge Sled", desc: "Skid-mounted pump winched across the bottom.", art: "sled" },
      { id: "diver", label: "Diver Operated Dredge", desc: "Diver-guided pump for precise, confined work.", art: "diver" },
      { id: "auger", label: "Mini Auger ModDredge", desc: "Compact auger dredge for lagoons and tight footprints.", art: "auger" },
    ],
  },
  deployment_pump: {
    key: "deployment",
    eyebrow: "STEP — CONFIGURATION",
    title: "How will the pump be installed?",
    sub: "Pick the configuration that matches your setup.",
    options: [
      { id: "flooded", label: "Flooded Suction Pump", desc: "Pump sits below the tank — gravity-fed suction.", art: "flooded" },
      { id: "submersible", label: "Submersible Pump", desc: "Pump goes into the liquid.", art: "submersible" },
      { id: "selfpriming", label: "Self-Priming Pump", desc: "Pump sits above — lifts the material itself.", art: "selfpriming" },
    ],
  },
};

/* ---------- Dynamic track (head question only for 50–200 GPM) ---------- */
function buildTrack(a) {
  if (a.application === "dredging") return ["application", "material", "production_dredge", "power", "deployment_dredge"];
  if (a.application === "process") {
    const t = ["application", "material", "flow_pump"];
    if (a.production === "f_50_200") t.push("head");
    t.push("power", "deployment_pump");
    return t;
  }
  return ["application"];
}

const SELECT_QUESTION_IDS = new Set(["production_dredge", "flow_pump"]);

/* ---------- Recommendation engine ---------- */
/* GPM -> pump size class. NOTE: 5-in pump intentionally never recommended. */
const PUMP_SIZE = {
  f_5_50: "1-in", f_50_200: "2-in", f_200_400: "3-in", f_400_900: "4-in",
  f_900_1600: "6-in", f_1600_2500: "8-in", f_2500_3500: "10-in",
  f_3500_6000: "12-in", f_6000_12000: "16-in",
};
const PROCESS_POWER = { electric: "Electric", hydraulic: "Hydraulic", diesel: "Diesel-Powered" };

function recommend(a) {
  const { application, production, power, deployment, head } = a;
  const drive = power === "diesel" ? "Diesel drive package" : power === "hydraulic" ? "Hydraulic drive package" : "Electric motor drive";

  if (application === "dredging") {
    /* Production (cu yd/hr) -> pump size class, per EDDY Pump platform specs */
    const ds = {
      p_150: { size: "4-in", exf: "EXF-4000", gpm: "250–1,200 GPM", prod: "75–150 cu yd/hr" },
      p_200: { size: "6-in", exf: "EXF-6000", gpm: "450–2,500 GPM", prod: "150–200 cu yd/hr" },
      p_300: { size: "8-in", exf: "EXF-8000", gpm: "1,400–3,600 GPM", prod: "250–300 cu yd/hr" },
      p_350: { size: "10-in", exf: "EXF-10000", gpm: "1,600–5,000 GPM", prod: "300–350 cu yd/hr" },
      p_600: { size: "12-in", exf: "EXF-12000", gpm: "2,600–7,300 GPM", prod: "500–600 cu yd/hr" },
    }[production] || { size: "8-in", exf: "EXF-8000", gpm: "1,400–3,600 GPM", prod: "250–300 cu yd/hr" };
    const sizeSpecs = [ds.size + " discharge class", ds.gpm + " flow range"];
    const fam = {
      excavator: { family: ds.exf + " Excavator Dredge Pump Attachment (" + ds.size + ")", art: "excavator", blurb: "Mounts to the stick of your excavator and turns it into a production dredge. Hydraulic drive runs straight off the machine's auxiliary circuit.", specs: [...sizeSpecs, "Runs off excavator hydraulics", "Cutterhead options for hard-packed material"] },
      cable: { family: "Cable-Deployed Dredge Pump — " + ds.size + " Class", art: "cable", blurb: "Lowered by crane or cable from shore, barge, or gantry. Available in electric or hydraulic drive with water-jetting rings for fast-settling material.", specs: [...sizeSpecs, drive, "Optional water jetting ring"] },
      remote: { family: "Subdredge™ Remote-Operated Dredge — " + ds.size + " Class", art: "remote", blurb: "A crewless, self-propelled dredge driven from shore — built around the EDDY Pump non-clog design for high-solids production without divers or support boats.", specs: [...sizeSpecs, "Remote operation from shore", "EDDY Pump non-clog rotor"] },
      sled: { family: "Dredge Sled — " + ds.size + " Class", art: "sled", blurb: "The EDDY Pump mounted on a skid frame, winched across the bottom from shore — steady production with a minimal equipment footprint.", specs: [...sizeSpecs, "Winch-guided from shore", "Low equipment footprint"] },
      diver: { family: "Diver-Operated Dredge — " + ds.size + " Class", art: "diver", blurb: "A diver-guided EDDY Pump for precise removal in confined or sensitive areas where larger equipment can't work.", specs: [...sizeSpecs, "Precise, diver-directed dredging", "Confined and sensitive areas"] },
      auger: { family: "Mini Auger ModDredge — " + ds.size + " Class", art: "auger", blurb: "A compact auger dredge for lagoons, small ponds, and tight footprints — the auger feeds settled material straight into the EDDY Pump.", specs: [...sizeSpecs, "Compact footprint", "Auger-fed for settled solids"] },
    }[deployment];
    return fam || { family: "EDDY Dredge System", art: "dredging", blurb: "Our engineering team will match the right dredge configuration to your project.", specs: sizeSpecs };
  }

  // Process pump path: flow sets size; deployment and power remain authoritative.
  const size = PUMP_SIZE[production] || "4-in";
  const config = { flooded: { label: "Flooded Suction Pump", art: "flooded" }, submersible: { label: "Submersible Pump", art: "submersible" }, selfpriming: { label: "Self-Priming Pump", art: "selfpriming" } }[deployment] || { label: "Process Pump", art: "slurry" };
  const headSpecs = head === "h_over" ? ["120+ ft head — engineering review required"] : [];
  return {
    family: `EDDY Pump ${size} ${config.label} — ${PROCESS_POWER[a.power] || "Specified drive"}`,
    art: config.art,
    blurb: "The core EDDY Pump design: a geometrically induced eddy current instead of a close-tolerance impeller — high solids tolerance, low wear, no clogging on the material you described.",
    specs: [`${size} discharge class`, config.label + " configuration", drive, ...headSpecs, "Passes large solids without clogging"],
  };
}

function labelFor(qid, optId) {
  const q = QUESTIONS[qid];
  const o = q?.options.find((x) => x.id === optId);
  return o ? o.label : optId;
}

const SHEET_ROWS = [
  { key: "application", label: "APPLICATION" },
  { key: "material", label: "MATERIAL" },
  { key: "production", label: "PRODUCTION" },
  { key: "head", label: "HEAD" },
  { key: "power", label: "POWER" },
  { key: "deployment", label: "DEPLOYMENT" },
];

function EddyConfigurator() {
  const [answers, setAnswers] = useState({});
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [showOther, setShowOther] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [lead, setLead] = useState({ name: "", email: "", company: "", phone: "" });
  const [touched, setTouched] = useState({ name: false, email: false });
  const [project, setProject] = useState({ discharge_distance_ft: "", elevation_gain_ft: "", water_depth_ft: "", solids_size_in: "", specific_gravity: "", percent_solids: "", excavator_model: "", pipe_diameter_in: "", notes: "" });
  const [website, setWebsite] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submissionId, setSubmissionId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const stepTopRef = useRef(null);
  const headingRef = useRef(null);
  const quoteRef = useRef(null);
  const lastPayloadSignatureRef = useRef(null);
  const hasTransitionedRef = useRef(false);

  const track = buildTrack(answers);
  const currentQid = track[stepIdx];
  const question = QUESTIONS[currentQid];
  const totalSteps = answers.application ? track.length : 5;

  const rec = useMemo(() => (done ? recommend(answers) : null), [done, answers]);
  const nameInvalid = touched.name && !lead.name.trim();
  const emailInvalid = touched.email && !validEmail(lead.email);

  useEffect(() => {
    if (!hasTransitionedRef.current) {
      hasTransitionedRef.current = true;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    stepTopRef.current?.scrollIntoView({ block: "start" });
  }, [stepIdx, done]);

  const goToQuote = () => {
    if (!quoteRef.current) return;
    quoteRef.current.scrollIntoView({ block: "start" });
    quoteRef.current.focus({ preventScroll: true });
  };

  const advance = (next) => {
    setAnswers(next);
    setShowOther(false);
    setOtherText("");
    const newTrack = buildTrack(next);
    if (stepIdx + 1 >= newTrack.length) setDone(true);
    else setStepIdx(stepIdx + 1);
  };

  const pick = (opt) => {
    const q = QUESTIONS[currentQid];
    if (q.key === "material" && opt.id === "other") { setShowOther(true); return; }
    let next = { ...answers, [q.key]: opt.id };
    if (q.key === "application" && answers.application && answers.application !== opt.id) next = { application: opt.id };
    if (q.key === "production" && opt.id !== "f_50_200") delete next.head;
    advance(next);
  };

  const continueOther = () => {
    if (!otherText.trim()) return;
    advance({ ...answers, material: "other", materialOther: otherText.trim() });
  };

  const back = () => {
    const targetIdx = done ? track.length - 1 : stepIdx - 1;
    if (targetIdx < 0) return;

    const next = { ...answers };
    track.slice(targetIdx).forEach((qid) => {
      delete next[QUESTIONS[qid].key];
    });
    if (!next.material) delete next.materialOther;
    setAnswers(next);
    setShowOther(false);
    setOtherText("");

    if (done) {
      setIdempotencyKey(newIdempotencyKey());
      setSubmissionId("");
      setSubmitError("");
    }
    setDone(false);
    setSubmitted(false);
    setStepIdx(targetIdx);
  };

  const restart = () => {
    setAnswers({});
    setStepIdx(0);
    setDone(false);
    setSubmitted(false);
    setShowOther(false);
    setOtherText("");
    setLead({ name: "", email: "", company: "", phone: "" });
    setTouched({ name: false, email: false });
    setProject({ discharge_distance_ft: "", elevation_gain_ft: "", water_depth_ft: "", solids_size_in: "", specific_gravity: "", percent_solids: "", excavator_model: "", pipe_diameter_in: "", notes: "" });
    setWebsite("");
    setSubmitError("");
    setSubmissionId("");
    setIdempotencyKey(newIdempotencyKey());
    lastPayloadSignatureRef.current = null;
  };

  const numberOrNull = (value) => value === "" ? null : Number(value);

  const handleSubmit = async () => {
    if (!lead.name.trim() || !validEmail(lead.email) || submitting) return;
    if (window.location.protocol !== "https:") {
      setSubmitError("Secure HTTPS is required before project information can be submitted. Please contact EDDY Pump directly while the secure connection is being provisioned.");
      return;
    }

    const submissionData = {
      customer: { ...lead, name: lead.name.trim(), email: lead.email.trim() },
      answers: {
        application: answers.application,
        material: answers.material,
        materialOther: answers.material === "other" ? answers.materialOther : null,
        production: answers.production,
        head: answers.head || null,
        power: answers.power,
        deployment: answers.deployment,
      },
      project_details: {
        discharge_distance_ft: numberOrNull(project.discharge_distance_ft),
        elevation_gain_ft: numberOrNull(project.elevation_gain_ft),
        water_depth_ft: numberOrNull(project.water_depth_ft),
        solids_size_in: numberOrNull(project.solids_size_in),
        specific_gravity: numberOrNull(project.specific_gravity),
        percent_solids: numberOrNull(project.percent_solids),
        excavator_model: project.excavator_model || null,
        pipe_diameter_in: numberOrNull(project.pipe_diameter_in),
        notes: project.notes || null,
      },
      website,
    };
    const payloadSignature = JSON.stringify(submissionData);
    let requestKey = idempotencyKey;
    if (lastPayloadSignatureRef.current && lastPayloadSignatureRef.current !== payloadSignature) {
      requestKey = newIdempotencyKey();
      setIdempotencyKey(requestKey);
    }
    lastPayloadSignatureRef.current = payloadSignature;

    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch(`${API_BASE}/v1/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotency_key: requestKey, ...submissionData }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(apiErrorMessage(result.detail));
      setSubmissionId(result.id || "");
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const sheetValue = (key) => {
    if (key === "material" && answers.material === "other" && answers.materialOther) return answers.materialOther;
    const qid = { application: "application", material: "material", production: answers.application === "process" ? "flow_pump" : "production_dredge", head: "head", power: "power", deployment: answers.application === "process" ? "deployment_pump" : "deployment_dredge" }[key];
    return labelFor(qid, answers[key]);
  };
  const answeredRows = SHEET_ROWS.filter((r) => answers[r.key]);

  return (
    <div className="cfg">
      <style>{`
        .cfg { min-height: 100vh; background: #ffffff; color: #1C2B3A; font-family: 'Barlow', sans-serif;
               --blue: #244A9E; --orange: #B94708; --steel: #6B7A8D; --panel: #F5F7FA; --line: #DCE3EC; --paper: #1C2B3A; }
        .cfg * { box-sizing: border-box; }

        .topbar { display:flex; align-items:center; justify-content:space-between; gap:24px; padding: 12px 28px; border-bottom: 3px solid var(--blue); background: #ffffff; }
        .brand { display:flex; align-items:center; gap:18px; min-width:0; }
        .logoImg { width: 260px; max-width:42vw; height:auto; display:block; }
        .brandDivider { width:1px; height:36px; background:var(--line); }
        .productName { font-family:'IBM Plex Mono'; font-size:10px; letter-spacing:0.18em; line-height:1.55; color:var(--steel); text-transform:uppercase; }
        .restart { background:none; border:1px solid var(--line); color:var(--blue); font-family:'IBM Plex Mono'; font-size:13px; letter-spacing:0.08em; min-height:44px; padding:10px 16px; cursor:pointer; transition: border-color .2s, color .2s; }
        .restart:hover, .restart:focus-visible { border-color: var(--orange); color: var(--paper); outline:3px solid rgba(242,106,33,.20); outline-offset:2px; }

        .progress { display:flex; gap:6px; padding: 0 28px; margin-top:18px; }
        .tick { height:3px; flex:1; background: var(--line); }
        .tick.on { background: var(--orange); }

        .main { display:flex; gap:0; align-items:flex-start; max-width: 1180px; margin: 0 auto; padding: 34px 28px 80px; }
        .stage { flex: 1 1 auto; min-width: 0; }

        .stepTop { scroll-margin-top:18px; }
        .stepNav { min-height:48px; display:flex; align-items:center; margin:0 0 16px; }
        .eyebrow { font-family:'IBM Plex Mono'; font-size:13px; letter-spacing:0.2em; color: var(--orange); margin-bottom: 10px; }
        h1.q { color: var(--blue); font-family:'Barlow Condensed'; font-weight:600; font-size: clamp(34px, 4.5vw, 48px); line-height:1.08; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 0.015em; }
        h1.q:focus, h2.fam:focus { outline:none; }
        .sub { color: #445468; font-size: 18px; line-height:1.5; margin: 0 0 22px; max-width: 58ch; }
        .selectionHelp { color:var(--paper); font-size:16px; font-weight:600; margin:0 0 14px; }

        .trustLine { display:flex; flex-wrap:wrap; gap:10px 20px; margin:-6px 0 24px; color:#526477; font-family:'IBM Plex Mono'; font-size:13px; letter-spacing:.04em; }
        .trustLine span::before { content:'✓'; color:var(--orange); margin-right:7px; font-weight:700; }
        .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 16px; }
        .card { text-align:left; background: var(--panel); border: 1px solid var(--line); padding: 0 0 18px; cursor:pointer; color: inherit; font-family:inherit;
                transition: transform .15s ease, border-color .15s ease, background .15s ease; display:flex; flex-direction:column; min-height:100%; }
        .card:hover { border-color: var(--orange); background:#FFF9F5; transform: translateY(-3px); }
        .card:focus-visible { border-color: var(--orange); outline:3px solid rgba(242,106,33,.28); outline-offset:2px; }
        .cardArt { width:100%; height:auto; display:block; background: #EEF2F7; border-bottom:1px solid var(--line); }
        .cardPhoto { aspect-ratio: 160/115; object-fit: cover; }
        .card h3 { font-family:'Barlow Condensed'; font-size: 24px; font-weight:600; letter-spacing:0.02em; margin: 14px 16px 4px; text-transform: uppercase; }
        .card p { margin: 0 16px; font-size: 16px; color:#445468; line-height:1.5; }
        .cardCue { margin-top:auto; padding:14px 16px 0; font-family:'IBM Plex Mono'; font-size:13px; letter-spacing:.06em; color:var(--blue); }
        .cardCue::after { content:'  →'; color:var(--orange); }

        .flowSelect { max-width:620px; padding:22px; background:var(--panel); border:1px solid var(--line); }
        .flowSelect label { display:block; margin-bottom:10px; color:var(--blue); font-family:'IBM Plex Mono'; font-size:14px; letter-spacing:.08em; }
        .flowSelect select { width:100%; min-height:52px; padding:12px 44px 12px 14px; border:1px solid var(--line); border-radius:0; background:#FFFFFF; color:var(--paper); font-family:'Barlow'; font-size:18px; cursor:pointer; }
        .flowSelect select:focus-visible { outline:3px solid rgba(242,106,33,.28); outline-offset:2px; border-color:var(--orange); }
        .flowHint { margin:12px 0 0; color:#526477; font-size:16px; line-height:1.5; }

        .otherBox { margin-top: 20px; background: var(--panel); border: 1px solid var(--orange); padding: 18px 20px; max-width: 520px; }
        .otherBox label { display:block; font-family:'IBM Plex Mono'; font-size: 14px; letter-spacing:0.08em; color: var(--orange); margin-bottom: 10px; }
        .otherRow { display:flex; gap: 10px; }
        .otherRow input { flex:1; background:#FFFFFF; border:1px solid var(--line); color: var(--paper); padding: 11px 12px; font-family:'Barlow'; font-size: 16px; min-height:48px; }
        .otherRow input:focus-visible { outline:none; border-color: var(--orange); }

        .backbtn { background:#FFFFFF; border:1px solid var(--line); color:var(--blue); font-family:'IBM Plex Mono'; font-size:14px; font-weight:600; letter-spacing:0.04em; cursor:pointer; min-height:48px; padding:11px 15px; }
        .backbtn:hover, .backbtn:focus-visible { border-color:var(--orange); color:var(--paper); outline:3px solid rgba(242,106,33,.20); outline-offset:2px; }

        .sheet { width: 270px; flex: 0 0 270px; margin-left: 36px; background: var(--panel); border:1px solid var(--line); position: sticky; top: 24px; }
        .sheet .head { padding: 14px 18px; border-bottom: 1px dashed var(--line); font-family:'IBM Plex Mono'; font-size: 13px; letter-spacing: 0.12em; color: var(--orange); }
        .sheet .row { display:flex; justify-content:space-between; gap:10px; padding: 13px 18px; border-bottom: 1px solid var(--line); font-family:'IBM Plex Mono'; font-size: 13px; line-height:1.45; }
        .sheet .row .k { color: #526477; letter-spacing:0.04em; }
        .sheet .row .v { color: var(--paper); text-align:right; }
        .sheet .empty { padding: 16px 18px; color: #526477; font-family:'IBM Plex Mono'; font-size: 13px; line-height: 1.6; }

        .result { max-width: 760px; }
        .resultActions { margin:0 0 16px; }
        .quoteJump { background:var(--orange); border:none; color:#FFFFFF; font-family:'Barlow Condensed'; font-size:18px; font-weight:700; letter-spacing:.04em; min-height:52px; padding:13px 20px; text-transform:uppercase; cursor:pointer; }
        .quoteJump:hover, .quoteJump:focus-visible { filter:brightness(.95); outline:3px solid rgba(201,79,10,.24); outline-offset:2px; }
        .resultCard { background: var(--panel); border: 1px solid var(--line); border-top: 3px solid var(--orange); padding: 0; }
        .resultCard .cardArt { border-bottom: 1px solid var(--line); height:220px; object-fit:cover; }
        .resultBody { padding: 22px 26px 26px; }
        h2.fam { color: var(--blue); font-family:'Barlow Condensed'; font-weight:700; font-size: 36px; line-height:1.1; margin: 0 0 8px; text-transform:uppercase; letter-spacing:0.02em; }
        .blurb { color:#3E4F63; line-height: 1.55; margin: 0 0 16px; font-size: 17px; }
        .speclist { display:flex; flex-wrap: wrap; gap: 8px; margin-bottom: 4px; }
        .chip { font-family:'IBM Plex Mono'; font-size: 13px; letter-spacing:0.03em; border: 1px solid var(--line); color:#445468; padding: 8px 11px; }
        .disclaimer { font-size: 14px; color: #5F7084; line-height:1.6; margin-top: 18px; border-left: 3px solid var(--line); padding-left: 12px; }

        .leadbox { margin-top: 22px; background: var(--panel); border: 1px solid var(--line); border-top:3px solid var(--blue); padding: 24px 26px; scroll-margin-top:16px; }
        .leadbox:focus { outline:3px solid rgba(36,74,158,.24); outline-offset:3px; }
        .leadbox h3 { color: var(--blue); font-family:'Barlow Condensed'; text-transform:uppercase; font-size: 28px; line-height:1.12; margin: 0 0 8px; letter-spacing:0.02em; }
        .leadbox p { color:#445468; font-size: 16px; line-height:1.5; margin: 0 0 18px; }
        .sectionLabel { grid-column: 1 / -1; font-family:'IBM Plex Mono'; font-size:13px; letter-spacing:.1em; color:var(--orange); margin-top:4px; }
        .fields { display:grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .fieldGroup { display:flex; flex-direction:column; gap:7px; }
        .fieldGroup label { color:var(--paper); font-size:15px; font-weight:600; }
        .fieldGroup label span { color:#526477; font-weight:400; margin-left:4px; }
        .fieldError { color:#9B1C13; font-size:14px; font-weight:600; line-height:1.35; }
        .fields input, .fields textarea { background:#FFFFFF; border:1px solid #7A8AA0; color: var(--paper); padding: 11px 12px; font-family:'Barlow'; font-size:16px; min-height:48px; width:100%; }
        .fields textarea { grid-column: 1 / -1; min-height:96px; resize:vertical; }
        .fields input:focus-visible, .fields textarea:focus-visible { outline:3px solid rgba(242,106,33,.22); outline-offset:1px; border-color: var(--orange); }
        .mainNotes { grid-column:1 / -1; }
        .submissionNotice { margin:16px 0 0 !important; color:#33465A !important; font-size:14px !important; line-height:1.5; }
        .formHelp { margin:8px 0 0 !important; color:#526477 !important; font-size:14px !important; }
        .formReassurance { margin-top:12px; color:var(--blue); font-size:14px; font-weight:600; line-height:1.5; }
        .secureNote { margin-top:10px; font-family:'IBM Plex Mono'; font-size:12px; color:#5F7084; line-height:1.5; }
        .submitError { margin-top:12px; padding:12px 14px; border-left:3px solid #B42318; background:#FFF1F0; color:#8A1C13; font-size:15px; line-height:1.45; }
        .honeypot { position:absolute !important; left:-10000px !important; width:1px !important; height:1px !important; overflow:hidden !important; }
        .cta { margin-top: 16px; background: var(--orange); border:none; color:#FFFFFF; font-family:'Barlow Condensed'; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; font-size:18px; min-height:52px; padding:14px 28px; cursor:pointer; }
        .cta:disabled { opacity: 0.45; cursor: default; }
        .cta:not(:disabled):hover, .cta:not(:disabled):focus-visible { filter: brightness(1.05); outline:3px solid rgba(242,106,33,.24); outline-offset:2px; }
        .thanks { font-family:'IBM Plex Mono'; color: var(--orange); font-size: 16px; letter-spacing:0.03em; line-height:1.7; }
        .reference { color:#526477; font-size:13px; }
        .projectDetails { grid-column:1 / -1; margin-top:6px; border-top:1px solid var(--line); border-bottom:1px solid var(--line); }
        .projectDetails summary { cursor:pointer; padding:16px 2px; color:var(--blue); font-family:'Barlow'; font-weight:600; font-size:15px; line-height:1.4; list-style:none; }
        .projectDetails summary::-webkit-details-marker { display:none; }
        .projectDetails summary::before { content:'+'; color:var(--orange); display:inline-block; width:20px; font-weight:700; }
        .projectDetails[open] summary::before { content:'−'; }
        .projectGrid { display:grid; grid-template-columns:1fr 1fr; gap:14px; padding:0 0 16px; }
        .projectGrid .notes { grid-column:1 / -1; }

        @media (max-width: 860px) {
          .main { flex-direction: column; }
          .sheet { width: 100%; flex: none; margin: 28px 0 0; position: static; }
          .fields { grid-template-columns: 1fr; }
          .resultCard .cardArt { height:260px; }
        }
        @media (max-width: 620px) {
          .topbar { padding:10px 16px; gap:12px; }
          .logoImg { width:200px; max-width:58vw; }
          .brandDivider, .productName { display:none; }
          .restart { padding:10px 12px; font-size:12px; }
          .progress { padding:0 16px; }
          .main { padding:20px 16px 56px; }
          .stepNav { margin-bottom:12px; }
          .backbtn { width:100%; text-align:left; }
          .sub { font-size:17px; }
          .grid { gap:12px; }
          .card { display:grid; grid-template-columns:112px minmax(0,1fr); grid-template-rows:auto auto 1fr; min-height:138px; padding:0; }
          .card .cardArt { grid-column:1; grid-row:1 / 4; width:112px; height:100%; min-height:138px; object-fit:cover; border-right:1px solid var(--line); border-bottom:none; }
          .card h3 { grid-column:2; grid-row:1; margin:14px 14px 3px; font-size:21px; }
          .card p { grid-column:2; grid-row:2; margin:0 14px; font-size:15px; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
          .cardCue { grid-column:2; grid-row:3; align-self:end; padding:10px 14px 13px; font-size:12px; }
          .otherRow { flex-direction:column; }
          .otherRow input { min-width:0; width:100%; }
          .resultCard .cardArt { height:150px; }
          .resultBody, .leadbox { padding:20px 18px; }
          h2.fam { font-size:32px; }
          .cta, .quoteJump { width:100%; }
          .projectGrid { grid-template-columns:1fr; }
          .projectGrid .notes { grid-column:auto; }
        }
        @media (prefers-reduced-motion: reduce) { .card, .card:hover { transition:none; transform:none; } }
      `}</style>

      <header className="topbar">
        <div className="brand">
          <img className="logoImg" src="images/eddy-pump-corporation-logo.webp" width="800" height="166" alt="EDDY Pump Corporation" />
          <span className="brandDivider" aria-hidden="true"></span>
          <span className="productName">Pump &amp; Dredge<br />Configurator</span>
        </div>
        <button className="restart" onClick={restart}>START OVER</button>
      </header>

      <div className="progress" role="progressbar" aria-label="Configurator progress" aria-valuemin="1" aria-valuenow={done ? totalSteps : stepIdx + 1} aria-valuemax={totalSteps}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className={`tick ${done || i <= stepIdx ? "on" : ""}`} />
        ))}
      </div>

      <div className="main">
        <div className="stage">
          {!done && question && (
            <>
              <div className="stepTop" ref={stepTopRef}>
                {stepIdx > 0 && (
                  <div className="stepNav">
                    <button className="backbtn" onClick={back}>← Back to previous question</button>
                  </div>
                )}
                <div className="eyebrow">Step {stepIdx + 1} of {totalSteps}: {question.eyebrow.replace("STEP — ", "")}</div>
                <h1 className="q" ref={headingRef} tabIndex="-1">{question.title}</h1>
                {question.sub && <p className="sub">{question.sub}</p>}
                {stepIdx === 0 && <div className="trustLine" aria-label="Configurator benefits"><span>About 2 minutes</span><span>No account required</span><span>Engineering-reviewed</span></div>}
                <p className="selectionHelp">{SELECT_QUESTION_IDS.has(currentQid) ? "Choose the closest range to continue." : "Choose one option to continue."}</p>
              </div>
              {SELECT_QUESTION_IDS.has(currentQid) ? (
                <div className="flowSelect">
                  <label htmlFor="flow-rate-selection">
                    {currentQid === "production_dredge" ? "SELECT PRODUCTION TARGET" : "SELECT FLOW-RATE RANGE"}
                  </label>
                  <select id="flow-rate-selection" value="" onChange={(event) => {
                    const option = question.options.find((item) => item.id === event.target.value);
                    if (option) pick(option);
                  }}>
                    <option value="" disabled>Choose the closest range…</option>
                    {question.options.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.label} — {opt.desc}</option>
                    ))}
                  </select>
                  <p className="flowHint">
                    {currentQid === "production_dredge"
                      ? "Pump size comes from this production/GPM range; your deployment choice determines the dredge system type—excavator attachment, cable-deployed pump, Subdredge, dredge sled, diver-operated dredge, or Mini Auger ModDredge."
                      : "Flow rate determines pump size. Your deployment choice determines the pump configuration. An EDDY Pump engineer will confirm the final duty point."}
                  </p>
                </div>
              ) : (
                <div className="grid">
                  {question.options.map((opt) => (
                    <button key={opt.id} className="card" onClick={() => pick(opt)}>
                      <CardImage kind={opt.art} />
                      <h3>{opt.label}</h3>
                      <p>{opt.desc}</p>
                      <div className="cardCue">SELECT</div>
                    </button>
                  ))}
                </div>
              )}
              {showOther && (
                <div className="otherBox">
                  <label htmlFor="other-material">WHAT ARE YOU MOVING?</label>
                  <div className="otherRow">
                    <input id="other-material" autoFocus placeholder="e.g. drilling mud, fly ash, fish waste…" value={otherText}
                      onChange={(e) => setOtherText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") continueOther(); }} />
                    <button className="cta" style={{marginTop: 0}} disabled={!otherText.trim()} onClick={continueOther}>Continue</button>
                  </div>
                </div>
              )}
            </>
          )}

          {done && rec && (
            <div className="result" ref={stepTopRef}>
              <div className="stepNav">
                <button className="backbtn" onClick={back}>← Change my answers</button>
              </div>
              <div className="eyebrow">PRELIMINARY RECOMMENDATION</div>
              <div className="resultActions">
                <button className="quoteJump" onClick={goToQuote}>Request fast project pricing ↓</button>
              </div>
              <div className="resultCard">
                <CardImage kind={rec.art} />
                <div className="resultBody">
                  <h2 className="fam" ref={headingRef} tabIndex="-1">{rec.family}</h2>
                  <p className="blurb">{rec.blurb}</p>
                  <div className="speclist">
                    {rec.specs.map((s) => <span key={s} className="chip">{s}</span>)}
                  </div>
                  <p className="disclaimer">
                    This recommendation identifies the right product family for your application.
                    Final pump sizing, drive selection, and pricing are confirmed by an EDDY Pump
                    sales engineer based on your site conditions, pumping distance, and material analysis.
                  </p>
                </div>
              </div>

              <div className="leadbox" ref={quoteRef} tabIndex="-1" aria-label="Project pricing request">
                {!submitted ? (
                  <form onSubmit={(event) => { event.preventDefault(); if (event.currentTarget.reportValidity()) handleSubmit(); }}>
                    <h3>Get fast project pricing &amp; a spec sheet</h3>
                    <p>Send this preliminary configuration to request fast, engineering-reviewed project pricing and a matching spec sheet.</p>
                    <div className="fields">
                      <div className="sectionLabel">YOUR CONTACT INFORMATION</div>
                      <div className="fieldGroup">
                        <label htmlFor="contact-name">Full name <span>(required)</span></label>
                        <input id="contact-name" autoComplete="name" maxLength="120" required aria-invalid={nameInvalid} aria-describedby={nameInvalid ? "contact-name-error" : undefined} value={lead.name} onBlur={() => setTouched({ ...touched, name: true })} onChange={(e) => setLead({ ...lead, name: e.target.value })} />
                        {nameInvalid && <span className="fieldError" id="contact-name-error" role="alert">Enter your name.</span>}
                      </div>
                      <div className="fieldGroup">
                        <label htmlFor="contact-email">Work email <span>(required)</span></label>
                        <input id="contact-email" autoComplete="email" maxLength="254" required type="email" aria-invalid={emailInvalid} aria-describedby={emailInvalid ? "contact-email-error" : undefined} value={lead.email} onBlur={() => setTouched({ ...touched, email: true })} onChange={(e) => setLead({ ...lead, email: e.target.value })} />
                        {emailInvalid && <span className="fieldError" id="contact-email-error" role="alert">Enter a valid email address.</span>}
                      </div>
                      <div className="fieldGroup">
                        <label htmlFor="contact-company">Company <span>(optional)</span></label>
                        <input id="contact-company" autoComplete="organization" maxLength="160" value={lead.company} onChange={(e) => setLead({ ...lead, company: e.target.value })} />
                      </div>
                      <div className="fieldGroup">
                        <label htmlFor="contact-phone">Phone <span>(optional)</span></label>
                        <input id="contact-phone" autoComplete="tel" maxLength="40" type="tel" value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} />
                      </div>
                      <div className="fieldGroup mainNotes"><label htmlFor="project-notes">Project notes <span>(optional)</span></label><textarea id="project-notes" maxLength="2000" placeholder="Material, site conditions, schedule, voltage, viscosity, abrasiveness, or anything else we should know" value={project.notes} onChange={(e) => setProject({ ...project, notes: e.target.value })} /></div>

                      <details className="projectDetails">
                        <summary>Add optional project details for a faster, more accurate review</summary>
                        <div className="projectGrid">
                          <div className="fieldGroup"><label htmlFor="project-distance">Discharge distance (ft)</label><input id="project-distance" inputMode="decimal" type="number" min="0" max="100000" value={project.discharge_distance_ft} onChange={(e) => setProject({ ...project, discharge_distance_ft: e.target.value })} /></div>
                          <div className="fieldGroup"><label htmlFor="project-elevation">Elevation gain (ft)</label><input id="project-elevation" inputMode="decimal" type="number" min="-10000" max="10000" value={project.elevation_gain_ft} onChange={(e) => setProject({ ...project, elevation_gain_ft: e.target.value })} /></div>
                          <div className="fieldGroup"><label htmlFor="project-depth">Water depth (ft)</label><input id="project-depth" inputMode="decimal" type="number" min="0" max="10000" value={project.water_depth_ft} onChange={(e) => setProject({ ...project, water_depth_ft: e.target.value })} /></div>
                          <div className="fieldGroup"><label htmlFor="project-solids">Maximum solids size (in)</label><input id="project-solids" inputMode="decimal" type="number" min="0" max="100" value={project.solids_size_in} onChange={(e) => setProject({ ...project, solids_size_in: e.target.value })} /></div>
                          <div className="fieldGroup"><label htmlFor="project-gravity">Specific gravity</label><input id="project-gravity" inputMode="decimal" type="number" min="0.1" max="10" step="0.01" value={project.specific_gravity} onChange={(e) => setProject({ ...project, specific_gravity: e.target.value })} /></div>
                          <div className="fieldGroup"><label htmlFor="project-percent">Percent solids</label><input id="project-percent" inputMode="decimal" type="number" min="0" max="100" step="0.1" value={project.percent_solids} onChange={(e) => setProject({ ...project, percent_solids: e.target.value })} /></div>
                          <div className="fieldGroup"><label htmlFor="project-pipe">Pipe diameter (in)</label><input id="project-pipe" inputMode="decimal" type="number" min="0.25" max="100" value={project.pipe_diameter_in} onChange={(e) => setProject({ ...project, pipe_diameter_in: e.target.value })} /></div>
                          {answers.deployment === "excavator" && <div className="fieldGroup"><label htmlFor="project-excavator">Excavator model</label><input id="project-excavator" maxLength="120" value={project.excavator_model} onChange={(e) => setProject({ ...project, excavator_model: e.target.value })} /></div>}
                        </div>
                      </details>
                      <label className="honeypot" aria-hidden="true">Website<input tabIndex="-1" autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
                    </div>
                    <p className="submissionNotice">By submitting, you ask EDDY Pump to contact you about this project. This does not subscribe you to marketing emails.</p>
                    <p className="formHelp">Name and a valid work email are required to request pricing.</p>
                    <div className="formReassurance">No payment required · No account needed · Secure submission</div>
                    <div className="secureNote">ENGINEERING REVIEW REQUIRED BEFORE FIRM EQUIPMENT SELECTION OR PRICING</div>
                    {submitError && <div className="submitError" role="alert">{submitError}</div>}
                    <button className="cta" type="submit" disabled={!lead.name.trim() || !validEmail(lead.email) || submitting}>
                      {submitting ? "Sending securely…" : "Submit my pricing request"}
                    </button>
                  </form>
                ) : (
                  <div className="thanks">
                    CONFIGURATION RECEIVED ✓<br />
                    An EDDY Pump specialist will review the engineering details before confirming equipment or pricing.
                    {submissionId && <><br /><span className="reference">REFERENCE: {submissionId}</span></>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="sheet">
          <div className="head">CONFIGURATION SUMMARY</div>
          {answeredRows.length === 0 && (
            <div className="empty">YOUR SELECTIONS WILL APPEAR HERE AS YOU BUILD THE APPLICATION.</div>
          )}
          {answeredRows.map((r) => (
            <div className="row" key={r.key}>
              <span className="k">{r.key === "production" && answers.application === "process" ? "FLOW TARGET" : r.label}</span>
              <span className="v">{sheetValue(r.key)}</span>
            </div>
          ))}
          {done && rec && (
            <div className="row"><span className="k">FAMILY</span><span className="v">{rec.family}</span></div>
          )}
        </aside>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<EddyConfigurator />);
