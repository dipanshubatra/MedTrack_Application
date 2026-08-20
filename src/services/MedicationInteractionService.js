/**
 * MedicationInteractionService
 * Client-side medication interaction engine with drug database, interaction rules,
 * severity scoring, and simulated patient medication profiles.
 */

/* ── Drug Database ───────────────────────────────────────────────────────── */

export const DRUG_DATABASE = [
  { id: "warfarin", name: "Warfarin", class: "Anticoagulant", route: "Oral", color: "rose" },
  { id: "aspirin", name: "Aspirin", class: "Antiplatelet", route: "Oral", color: "orange" },
  { id: "clopidogrel", name: "Clopidogrel", class: "Antiplatelet", route: "Oral", color: "amber" },
  { id: "metformin", name: "Metformin", class: "Biguanide", route: "Oral", color: "blue" },
  { id: "lisinopril", name: "Lisinopril", class: "ACE Inhibitor", route: "Oral", color: "teal" },
  { id: "amlodipine", name: "Amlodipine", class: "Calcium Channel Blocker", route: "Oral", color: "cyan" },
  { id: "atorvastatin", name: "Atorvastatin", class: "Statin", route: "Oral", color: "emerald" },
  { id: "omeprazole", name: "Omeprazole", class: "Proton Pump Inhibitor", route: "Oral", color: "violet" },
  { id: "amiodarone", name: "Amiodarone", class: "Antiarrhythmic", route: "Oral/IV", color: "fuchsia" },
  { id: "simvastatin", name: "Simvastatin", class: "Statin", route: "Oral", color: "emerald" },
  { id: "metoprolol", name: "Metoprolol", class: "Beta Blocker", route: "Oral", color: "sky" },
  { id: "digoxin", name: "Digoxin", class: "Cardiac Glycoside", route: "Oral", color: "pink" },
  { id: "fluconazole", name: "Fluconazole", class: "Antifungal", route: "Oral/IV", color: "purple" },
  { id: "ciprofloxacin", name: "Ciprofloxacin", class: "Fluoroquinolone", route: "Oral/IV", color: "indigo" },
  { id: "ibuprofen", name: "Ibuprofen", class: "NSAID", route: "Oral", color: "red" },
  { id: "apixaban", name: "Apixaban", class: "DOAC", route: "Oral", color: "rose" },
  { id: "methotrexate", name: "Methotrexate", class: "Antifolate", route: "Oral/IV", color: "red" },
  { id: "lithium", name: "Lithium", class: "Mood Stabilizer", route: "Oral", color: "yellow" },
  { id: "potassium", name: "Potassium chloride", class: "Electrolyte", route: "Oral/IV", color: "lime" },
  { id: "spironolactone", name: "Spironolactone", class: "K-Sparing Diuretic", route: "Oral", color: "green" },
];

/* ── Interaction Rules ───────────────────────────────────────────────────── */

export const INTERACTION_RULES = [
  {
    drugA: "warfarin",
    drugB: "aspirin",
    severity: "critical",
    mechanism: "Synergistic anticoagulation — aspirin inhibits platelet aggregation while warfarin suppresses clotting factor synthesis.",
    clinicalEffect: "Significantly elevated bleeding risk including GI hemorrhage and intracranial bleeding.",
    recommendation: "Avoid combination unless specifically indicated (e.g., mechanical heart valve). Monitor INR closely.",
    evidenceLevel: "A",
  },
  {
    drugA: "warfarin",
    drugB: "amiodarone",
    severity: "high",
    mechanism: "Amiodarone inhibits CYP2C9, reducing warfarin metabolism and increasing plasma concentration.",
    clinicalEffect: "Markedly elevated INR with increased hemorrhagic risk.",
    recommendation: "Reduce warfarin dose by 30-50% when initiating amiodarone. Monitor INR weekly.",
    evidenceLevel: "A",
  },
  {
    drugA: "warfarin",
    drugB: "fluconazole",
    severity: "high",
    mechanism: "Fluconazole potently inhibits CYP2C9, the primary enzyme metabolizing S-warfarin.",
    clinicalEffect: "INR may double within days of co-administration.",
    recommendation: "Avoid combination if possible. If necessary, reduce warfarin dose and monitor INR within 3 days.",
    evidenceLevel: "A",
  },
  {
    drugA: "simvastatin",
    drugB: "amiodarone",
    severity: "critical",
    mechanism: "Amiodarone inhibits CYP3A4, dramatically increasing simvastatin plasma levels.",
    clinicalEffect: "Elevated risk of rhabdomyolysis and severe myopathy.",
    recommendation: "Do not exceed simvastatin 20 mg/day when co-administered with amiodarone.",
    evidenceLevel: "A",
  },
  {
    drugA: "metformin",
    drugB: "ciprofloxacin",
    severity: "moderate",
    mechanism: "Fluoroquinolones may alter gut flora affecting metformin absorption; rare reports of hypo/hyperglycemia.",
    clinicalEffect: "Unpredictable glycemic control fluctuations.",
    recommendation: "Monitor blood glucose closely during and after antibiotic course.",
    evidenceLevel: "B",
  },
  {
    drugA: "lisinopril",
    drugB: "potassium",
    severity: "high",
    mechanism: "ACE inhibitors reduce aldosterone secretion, impairing potassium excretion.",
    clinicalEffect: "Risk of life-threatening hyperkalemia (K⁺ > 6.0 mEq/L).",
    recommendation: "Avoid potassium supplements with ACE inhibitors unless hypokalemia is documented. Monitor serum K⁺.",
    evidenceLevel: "A",
  },
  {
    drugA: "lisinopril",
    drugB: "spironolactone",
    severity: "high",
    mechanism: "Dual RAAS blockade — ACE inhibitor + K-sparing diuretic synergistically raises potassium.",
    clinicalEffect: "High risk of symptomatic hyperkalemia with cardiac arrhythmia potential.",
    recommendation: "Only combine in heart failure with close K⁺ and renal function monitoring.",
    evidenceLevel: "A",
  },
  {
    drugA: "ibuprofen",
    drugB: "warfarin",
    severity: "high",
    mechanism: "NSAIDs inhibit platelet function and damage GI mucosa, compounding warfarin's anticoagulant effect.",
    clinicalEffect: "Two- to three-fold increased risk of GI bleeding.",
    recommendation: "Use acetaminophen for analgesia. If NSAID required, use lowest dose for shortest duration with GI protection.",
    evidenceLevel: "A",
  },
  {
    drugA: "metoprolol",
    drugB: "amiodarone",
    severity: "moderate",
    mechanism: "Both suppress cardiac conduction; additive effect on heart rate and AV node.",
    clinicalEffect: "Risk of symptomatic bradycardia and heart block.",
    recommendation: "Monitor heart rate and ECG. Consider dose reduction of metoprolol.",
    evidenceLevel: "B",
  },
  {
    drugA: "digoxin",
    drugB: "amiodarone",
    severity: "high",
    mechanism: "Amiodarone inhibits P-glycoprotein and renal clearance of digoxin.",
    clinicalEffect: "Digoxin levels may rise 70-100%, causing toxicity (nausea, visual changes, arrhythmias).",
    recommendation: "Reduce digoxin dose by 50% and monitor serum levels.",
    evidenceLevel: "A",
  },
  {
    drugA: "lithium",
    drugB: "ibuprofen",
    severity: "critical",
    mechanism: "NSAIDs reduce renal lithium clearance by 15-25%, causing accumulation.",
    clinicalEffect: "Lithium toxicity — tremor, ataxia, seizures, renal failure.",
    recommendation: "Avoid NSAIDs in lithium-treated patients. Use acetaminophen instead. Monitor lithium levels if unavoidable.",
    evidenceLevel: "A",
  },
  {
    drugA: "methotrexate",
    drugB: "ibuprofen",
    severity: "critical",
    mechanism: "NSAIDs reduce renal methotrexate clearance and displace it from plasma protein binding.",
    clinicalEffect: "Methotrexate toxicity — pancytopenia, mucositis, hepatotoxicity.",
    recommendation: "Avoid NSAIDs during high-dose methotrexate therapy. Use with extreme caution in low-dose regimens.",
    evidenceLevel: "A",
  },
  {
    drugA: "clopidogrel",
    drugB: "omeprazole",
    severity: "moderate",
    mechanism: "Omeprazole inhibits CYP2C19, which converts clopidogrel prodrug to its active metabolite.",
    clinicalEffect: "Reduced antiplatelet effect, potentially increasing cardiovascular event risk.",
    recommendation: "Use pantoprazole instead of omeprazole if PPI co-therapy is needed.",
    evidenceLevel: "B",
  },
  {
    drugA: "amlodipine",
    drugB: "simvastatin",
    severity: "moderate",
    mechanism: "Amlodipine weakly inhibits CYP3A4, increasing simvastatin exposure by ~50%.",
    clinicalEffect: "Increased risk of statin-related myopathy at higher simvastatin doses.",
    recommendation: "Limit simvastatin to 20 mg/day when combined with amlodipine.",
    evidenceLevel: "B",
  },
  {
    drugA: "ciprofloxacin",
    drugB: "metoprolol",
    severity: "moderate",
    mechanism: "Ciprofloxacin inhibits CYP1A2; minor effect on metoprolol metabolism via CYP2D6 pathway modulation.",
    clinicalEffect: "Modest increase in metoprolol levels; risk of enhanced bradycardia.",
    recommendation: "Monitor heart rate during concurrent use. Be cautious in patients with pre-existing conduction disease.",
    evidenceLevel: "C",
  },
];

/* ── Severity Meta ───────────────────────────────────────────────────────── */

export const SEVERITY_META = {
  critical: { label: "Critical", color: "rose", icon: "Skull", bg: "bg-rose-500/10 border-rose-500/30", text: "text-rose-400", pulse: true },
  high: { label: "High", color: "amber", icon: "AlertTriangle", bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400", pulse: false },
  moderate: { label: "Moderate", color: "sky", icon: "AlertCircle", bg: "bg-sky-500/10 border-sky-500/30", text: "text-sky-400", pulse: false },
  low: { label: "Low", color: "slate", icon: "Info", bg: "bg-slate-500/10 border-slate-500/30", text: "text-slate-400", pulse: false },
};

/* ── Mock Patient Profiles ───────────────────────────────────────────────── */

export const PATIENT_PROFILES = [
  {
    id: "pt-1001",
    name: "Eleanor Vance",
    age: 72,
    mrn: "MRN-2024-1001",
    diagnosis: "Atrial Fibrillation, Hypertension, Type 2 Diabetes",
    medications: ["warfarin", "lisinopril", "metformin", "amiodarone"],
    allergies: ["Penicillin"],
    lastUpdated: new Date(Date.now() - 2 * 3600_000).toISOString(),
  },
  {
    id: "pt-1002",
    name: "Marcus Chen",
    age: 58,
    mrn: "MRN-2024-1002",
    diagnosis: "Hyperlipidemia, Coronary Artery Disease, GERD",
    medications: ["simvastatin", "aspirin", "clopidogrel", "omeprazole", "metoprolol"],
    allergies: ["Sulfa drugs"],
    lastUpdated: new Date(Date.now() - 6 * 3600_000).toISOString(),
  },
  {
    id: "pt-1003",
    name: "Priya Sharma",
    age: 45,
    mrn: "MRN-2024-1003",
    diagnosis: "Rheumatoid Arthritis, Bipolar Disorder",
    medications: ["methotrexate", "lithium", "ibuprofen", "omeprazole"],
    allergies: [],
    lastUpdated: new Date(Date.now() - 12 * 3600_000).toISOString(),
  },
  {
    id: "pt-1004",
    name: "James Okafor",
    age: 67,
    mrn: "MRN-2024-1004",
    diagnosis: "Heart Failure, Atrial Fibrillation, Hypokalemia",
    medications: ["warfarin", "digoxin", "spironolactone", "lisinopril", "potassium"],
    allergies: ["Aspirin"],
    lastUpdated: new Date(Date.now() - 1 * 3600_000).toISOString(),
  },
];

/* ── Core Engine Functions ───────────────────────────────────────────────── */

/**
 * Returns all known interactions for a given set of medication IDs.
 * Checks every pair combination against the rule database.
 */
export function detectInteractions(medicationIds) {
  const results = [];
  const idSet = new Set(medicationIds);

  for (const rule of INTERACTION_RULES) {
    if (idSet.has(rule.drugA) && idSet.has(rule.drugB)) {
      results.push({ ...rule, id: `${rule.drugA}+${rule.drugB}` });
    }
  }

  return results.sort((a, b) => {
    const order = { critical: 0, high: 1, moderate: 2, low: 3 };
    return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
  });
}

/**
 * Calculates an aggregate risk score (0-100) for a medication list.
 * Critical interactions contribute most, low severity the least.
 */
export function calculateRiskScore(medicationIds) {
  const interactions = detectInteractions(medicationIds);
  if (interactions.length === 0) return 0;

  const weights = { critical: 35, high: 20, moderate: 10, low: 5 };
  let score = 0;
  for (const ix of interactions) {
    score += weights[ix.severity] ?? 0;
  }
  return Math.min(100, score);
}

/**
 * Looks up drug info by ID.
 */
export function getDrugInfo(drugId) {
  return DRUG_DATABASE.find((d) => d.id === drugId) || null;
}

/**
 * Searches the drug database by name or class (case-insensitive).
 */
export function searchDrugs(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return DRUG_DATABASE.filter(
    (d) => d.name.toLowerCase().includes(q) || d.class.toLowerCase().includes(q)
  );
}

/**
 * Generates a timeline of alert events for a patient based on their medication list.
 * Simulates alerts firing at different times in the past.
 */
export function generateAlertTimeline(patientMedications) {
  const interactions = detectInteractions(patientMedications);
  const now = Date.now();

  return interactions.map((ix, i) => {
    const offsetMinutes = (i + 1) * Math.floor(Math.random() * 30 + 10);
    return {
      id: `alert-${ix.id}-${i}`,
      timestamp: new Date(now - offsetMinutes * 60_000).toISOString(),
      drugA: getDrugInfo(ix.drugA),
      drugB: getDrugInfo(ix.drugB),
      severity: ix.severity,
      mechanism: ix.mechanism,
      recommendation: ix.recommendation,
      status: i === 0 ? "active" : i < interactions.length - 1 ? "acknowledged" : "resolved",
      acknowledgedBy: i > 0 ? "Dr. Patel" : null,
    };
  });
}
