export const POWER_OPTIONS = [
  { id: "electric", label: "Electric", desc: "Plant power or generator on site.", art: "electric" },
  { id: "hydraulic", label: "Hydraulic", desc: "Excavator or hydraulic power unit available.", art: "hydraulic" },
  { id: "diesel", label: "Diesel / self-contained", desc: "No site power — bring the power with the unit.", art: "diesel" },
];

export const QUESTIONS = {
  application: { key: "application", eyebrow: "APPLICATION", title: "What's the job?", sub: "This sets the track for everything that follows.", options: [
    { id: "dredging", label: "Dredging", desc: "Ponds, harbors, canals, and tailings ponds.", art: "dredging" },
    { id: "process", label: "Process Pump", desc: "Transfer and process duty from tanks or facilities.", art: "slurry" },
  ] },
  material: { key: "material", eyebrow: "MATERIAL", title: "What are you moving?", sub: "Pick the closest match to your worst-case material.", options: [
    { id: "sand", label: "Sand & gravel", desc: "High-abrasion granular material.", art: "sand" },
    { id: "sludge", label: "Sludge & fines", desc: "Silt, organics, and viscous muck.", art: "sludge" },
    { id: "tailings", label: "Mine tailings / slurry", desc: "Dense industrial slurry.", art: "tailings" },
    { id: "debris", label: "Debris-laden material", desc: "Rock, trash, rags, and large solids.", art: "debris" },
    { id: "other", label: "Other", desc: "Tell us what you're pumping.", art: "other" },
  ] },
  production_dredge: { key: "production", eyebrow: "PRODUCTION", title: "How much material per hour?", sub: "Choose the closest solids-production target.", options: [
    { id: "p_150", label: "75–150 cu yd/hr (250–1,200 GPM)", desc: "Small ponds and maintenance dredging.", art: "flow" },
    { id: "p_200", label: "150–200 cu yd/hr (450–2,500 GPM)", desc: "Canals and marinas.", art: "flow" },
    { id: "p_300", label: "250–300 cu yd/hr (1,400–3,600 GPM)", desc: "Sustained production dredging.", art: "flow" },
    { id: "p_350", label: "300–350 cu yd/hr (1,600–5,000 GPM)", desc: "High-production projects.", art: "flow" },
    { id: "p_600", label: "500–600 cu yd/hr (2,600–7,300 GPM)", desc: "Maximum production duty.", art: "flow" },
  ] },
  deployment_dredge: { key: "deployment", eyebrow: "DEPLOYMENT", title: "How will the dredge reach the material?", sub: "Choose deployment first so we only show compatible power.", options: [
    { id: "excavator", label: "Excavator Attachment", desc: "Mounts to an excavator stick; hydraulic power only.", art: "excavator" },
    { id: "cable", label: "Cable Deployed", desc: "Lowered by crane or cable.", art: "cable" },
    { id: "remote", label: "Remote Operated Dredge", desc: "Self-propelled and driven from shore.", art: "remote" },
    { id: "sled", label: "Dredge Sled", desc: "Winched across the bottom.", art: "sled" },
    { id: "diver", label: "Diver Operated Dredge", desc: "Diver-guided for precise work.", art: "diver" },
    { id: "auger", label: "Mini Auger ModDredge", desc: "Compact auger dredge.", art: "auger" },
  ] },
  flow_pump: { key: "production", eyebrow: "FLOW", title: "What flow rate do you need?", sub: "Choose the closest range; engineering confirms the duty point.", options: [
    ["f_5_50", "5–50 GPM (1-in Pump)"], ["f_50_200", "50–200 GPM (2-in Pump)"],
    ["f_200_400", "200–400 GPM (3-in Pump)"], ["f_400_900", "400–900 GPM (4-in Pump)"],
    ["f_900_1600", "900–1,600 GPM (6-in Pump)"], ["f_1600_2500", "1,600–2,500 GPM (8-in Pump)"],
    ["f_2500_3500", "2,500–3,500 GPM (10-in Pump)"], ["f_3500_6000", "3,500–6,000 GPM (12-in Pump)"],
    ["f_6000_12000", "6,000–12,000 GPM (16-in Pump)"],
  ].map(([id, label]) => ({ id, label, desc: "Flow-sized pump class.", art: "flow" })) },
  head: { key: "head", eyebrow: "DISCHARGE HEAD", title: "What's your total discharge head?", sub: "Head is review context for every process range; it never changes flow-sized equipment, power, or configuration.", options: [
    { id: "h_under", label: "Under 120 ft", desc: "Standard head context.", art: "flow" },
    { id: "h_over", label: "Over 120 ft", desc: "Engineering review required.", art: "flow" },
  ] },
  power: { key: "power", eyebrow: "POWER", title: "What compatible power is available?", sub: "Options are limited by the deployment you selected.", options: POWER_OPTIONS },
  deployment_pump: { key: "deployment", eyebrow: "CONFIGURATION", title: "How will the pump be installed?", sub: "Pick the configuration that matches your setup.", options: [
    { id: "flooded", label: "Flooded Suction Pump", desc: "Gravity-fed suction.", art: "flooded" },
    { id: "submersible", label: "Submersible Pump", desc: "Pump goes into the liquid.", art: "submersible" },
    { id: "selfpriming", label: "Self-Priming Pump", desc: "Pump sits above the liquid.", art: "selfpriming" },
  ] },
};

export const SELECT_QUESTION_IDS = new Set(["production_dredge", "flow_pump"]);
