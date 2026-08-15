import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dna,
  Database,
  Users,
  ShieldCheck,
  AlertTriangle,
  Search,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle2,
  X,
  Sliders,
  Sparkles,
  Server,
  Layers,
  Activity,
  Radio,
  FileText,
  Clock,
  FlaskConical,
  Microscope,
  Stethoscope,
  ChevronRight,
  Filter
} from "lucide-react";

/**
 * GenomicClinicalTrialsHubPage Component
 *
 * High-Assurance Genomic Clinical Trials & Patient Cohort Analytics Overwatch.
 * Enforces ICH GCP E6 (Good Clinical Practice), VCF (Variant Call Format) DNA Mutation Alignment,
 * Precision Oncology CRISPR Target Validation, and Automated Trial Enrollment Sandboxing.
 */
export default function GenomicClinicalTrialsHubPage() {
  // Clinical Trials State
  const [trials, setTrials] = useState([
    {
      trialId: "GCT-PHASE3-009",
      trialTitle: "Precision Oncology CRISPR-Cas9 Target Validation in EGFRvIII Glioblastoma",
      phase: "PHASE_III_CLINICAL_TRIAL",
      enrolledPatients: 342,
      targetCohortSize: 500,
      genomicBiomarker: "EGFRvIII (Exon 2-7 Deletion Mutation)",
      status: "RECRUITING_ACTIVE",
      leadInvestigator: "Dr. Evelyn Vance, MD, PhD (Genomics Institute)",
      complianceStatus: "ICH_GCP_E6_FULLY_COMPLIANT",
      adverseEventsLogged: 2
    },
    {
      trialId: "GCT-PHASE2-104",
      trialTitle: "AAV Gene Therapy Vector Delivery for Spinal Muscular Atrophy",
      phase: "PHASE_II_CLINICAL_TRIAL",
      enrolledPatients: 84,
      targetCohortSize: 100,
      genomicBiomarker: "SMN1 Gene Replacement (rAAV9 Vector)",
      status: "RECRUITING_ACTIVE",
      leadInvestigator: "Dr. Alexander Thorne, PhD (Molecular Therapy)",
      complianceStatus: "ICH_GCP_E6_FULLY_COMPLIANT",
      adverseEventsLogged: 0
    },
    {
      trialId: "GCT-PHASE1-302",
      trialTitle: "mRNA Neoantigen Personalized Cancer Vaccine in Metastatic Melanoma",
      phase: "PHASE_I_SAFETY_TRIAL",
      enrolledPatients: 18,
      targetCohortSize: 24,
      genomicBiomarker: "Patient-Specific HLA-A*02:01 Neoepitopes",
      status: "COHORT_FULL_EVALUATION",
      leadInvestigator: "Dr. Maria Santos, MD (Immunooncology)",
      complianceStatus: "ICH_GCP_E6_FULLY_COMPLIANT",
      adverseEventsLogged: 1
    }
  ]);

  const [activeTab, setActiveTab] = useState("TRIALS_OVERWATCH"); // "TRIALS_OVERWATCH" | "VCF_ALIGNMENT" | "COHORT_BUILDER"
  const [searchTerm, setSearchTerm] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("ALL");
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [newTrialModalOpen, setNewTrialModalOpen] = useState(false);
  const [inspectTrial, setInspectTrial] = useState(null);

  // VCF Simulator State
  const [dnaSeqInput, setDnaSeqInput] = useState("");
  const [vcfResult, setVcfResult] = useState(null);
  const [aligning, setAligning] = useState(false);

  // Form State
  const [trialForm, setTrialForm] = useState({
    trialId: "GCT-PHASE1-409",
    trialTitle: "",
    phase: "PHASE_I_SAFETY_TRIAL",
    targetCohortSize: 50,
    genomicBiomarker: "BRCA1 / BRCA2 Homologous Recombination Deficiency",
    leadInvestigator: "Dr. Evelyn Vance, MD"
  });

  // VCF DNA Alignment Handler
  const handleVCFAlignment = (e) => {
    e.preventDefault();
    if (!dnaSeqInput.trim()) return;
    setAligning(true);

    setTimeout(() => {
      setVcfResult({
        variantId: "rs121913529",
        chromosomeLocation: "Chr17:43044295 (GRCh38.p13)",
        refAllele: "C",
        altAllele: "T (Pathogenic Missense Mutation)",
        geneSymbol: "BRCA1",
        clinicalSignificance: "HIGH_PENETRANCE_ONCOGENIC",
        readDepth: "1284x Next-Gen Sequencing Depth"
      });
      setAligning(false);
    }, 650);
  };

  // Add Trial Handler
  const handleAddTrial = (e) => {
    e.preventDefault();
    if (!trialForm.trialTitle.trim()) {
      setNotification({ type: "error", message: "Trial title is required." });
      return;
    }

    const newTrial = {
      trialId: trialForm.trialId,
      trialTitle: trialForm.trialTitle.trim(),
      phase: trialForm.phase,
      enrolledPatients: 0,
      targetCohortSize: parseInt(trialForm.targetCohortSize, 10) || 50,
      genomicBiomarker: trialForm.genomicBiomarker,
      status: "RECRUITING_ACTIVE",
      leadInvestigator: trialForm.leadInvestigator,
      complianceStatus: "ICH_GCP_E6_FULLY_COMPLIANT",
      adverseEventsLogged: 0
    };

    setTrials((prev) => [newTrial, ...prev]);
    setNewTrialModalOpen(false);
    setNotification({
      type: "success",
      message: `Genomic Trial '${newTrial.trialId}' registered and opened for cohort screening!`
    });
  };

  // Filtered Trials List
  const filteredTrials = useMemo(() => {
    return trials.filter((t) => {
      const matchSearch =
        t.trialTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.trialId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.genomicBiomarker.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPhase =
        phaseFilter === "ALL" ||
        (phaseFilter === "PHASE3" && t.phase.includes("PHASE_III")) ||
        (phaseFilter === "PHASE2" && t.phase.includes("PHASE_II")) ||
        (phaseFilter === "PHASE1" && t.phase.includes("PHASE_I"));
      return matchSearch && matchPhase;
    });
  }, [trials, searchTerm, phaseFilter]);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 space-y-6">
      
      {/* 1. Page Header */}
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Dna size={13} className="animate-spin" /> GENOMIC TRIALS OVERWATCH
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1">
                <ShieldCheck size={13} /> ICH GCP E6 COMPLIANT
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Genomic Clinical Trials & Patient Cohort Analytics Hub
            </h1>
            <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
              Precision oncology trial control plane managing VCF DNA variant alignment, CRISPR-Cas9 target validation, synthetic cohort screening, and Good Clinical Practice (GCP) audit logging.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setNewTrialModalOpen(true)}
              className="w-full lg:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Register Clinical Trial
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {notification.message && (
          <div className="mt-6 p-4 rounded-2xl text-xs font-bold flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification({ type: "", message: "" })}
              className="text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* 2. Navigation Tabs */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {[
            { id: "TRIALS_OVERWATCH", label: "Active Clinical Trials", icon: FlaskConical },
            { id: "VCF_ALIGNMENT", label: "VCF DNA Mutation Alignment", icon: Dna },
            { id: "COHORT_BUILDER", label: "Patient Cohort Sandboxing", icon: Users }
          ].map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <IconComp size={15} /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 w-full md:w-auto justify-end">
          <div>Active Cohorts: <strong className="text-emerald-400">444 Enrolled Patients</strong></div>
          <div>NGS Sequencing Depth: <strong className="text-white">1000x High-Throughput</strong></div>
        </div>
      </div>

      {/* 3. TAB CONTENT: TRIALS OVERWATCH */}
      {activeTab === "TRIALS_OVERWATCH" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search trial ID, title, or biomarker..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Filter Trial Phase:</span>
              <select
                value={phaseFilter}
                onChange={(e) => setPhaseFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">ALL CLINICAL PHASES</option>
                <option value="PHASE3">PHASE III</option>
                <option value="PHASE2">PHASE II</option>
                <option value="PHASE1">PHASE I</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrials.map((t) => (
              <div
                key={t.trialId}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl hover:border-indigo-500/40 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 text-[11px] font-bold font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                      {t.trialId}
                    </span>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      {t.phase}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white font-mono leading-snug">{t.trialTitle}</h3>
                    <p className="text-[11px] text-slate-400 font-sans mt-1">{t.leadInvestigator}</p>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[10px]">Genomic Biomarker:</span>
                      <strong className="text-indigo-300 truncate max-w-[150px]">{t.genomicBiomarker}</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-400 text-[11px]">
                      <span>Enrolled Cohort:</span>
                      <span className="text-white font-bold">{t.enrolledPatients} / {t.targetCohortSize}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Adverse Events:</span>
                      <span className="text-amber-400 font-bold">{t.adverseEventsLogged} Logged</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Compliance:</span>
                      <span className="text-emerald-400 font-bold">{t.complianceStatus}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectTrial(t)}
                    className="flex-1 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Microscope size={13} /> Cohort Telemetry
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: VCF ALIGNMENT */}
      {activeTab === "VCF_ALIGNMENT" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Dna size={18} className="text-indigo-400" /> Variant Call Format (VCF) DNA Mutation Alignment Engine
            </h3>
            <p className="text-xs text-slate-400">
              Input raw FASTQ/BAM sequence strings or VCF lines to align against GRCh38 human reference genome and flag oncogenic driver mutations.
            </p>

            <form onSubmit={handleVCFAlignment} className="space-y-3">
              <input
                type="text"
                placeholder="Enter VCF line or DNA string (e.g. chr17 43044295 rs121913529 C T 100 PASS BRCA1_MUTATION)"
                value={dnaSeqInput}
                onChange={(e) => setDnaSeqInput(e.target.value)}
                className="w-full p-4 bg-slate-950 border border-slate-700 rounded-2xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={aligning}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  {aligning ? <RefreshCw size={14} className="animate-spin" /> : <Dna size={14} />}
                  {aligning ? "Aligning GRCh38..." : "Align VCF Sequence"}
                </button>
              </div>
            </form>

            {vcfResult && (
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-3 font-mono">
                <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800 pb-2">
                  <span>Gene: {vcfResult.geneSymbol}</span>
                  <span>Depth: {vcfResult.readDepth}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Locus Position</span>
                  <span className="text-indigo-300 font-bold">{vcfResult.chromosomeLocation}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Reference vs Alternate Allele</span>
                  <span className="text-white font-bold">{vcfResult.refAllele} ➔ {vcfResult.altAllele}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: COHORT BUILDER */}
      {activeTab === "COHORT_BUILDER" && (
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users size={18} className="text-indigo-400" /> Synthetic Genomic Cohort Screening Matrix
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              {[
                { stage: "1. BIOMARKER FILTER", desc: "Filter by HLA typing, BRCA status, or TMB (Tumor Mutational Burden)." },
                { stage: "2. CONSENT AUDIT", desc: "Verify e-Consent and HIPAA de-identification cryptographic signatures." },
                { stage: "3. TRIAL ENROLLMENT", desc: "Automate inclusion/exclusion protocol matching in real time." }
              ].map((s, idx) => (
                <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="text-indigo-400 font-bold">{s.stage}</div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Trial Modal */}
      {newTrialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FlaskConical size={18} className="text-indigo-400" /> Register Genomic Clinical Trial
              </h3>
              <button type="button" onClick={() => setNewTrialModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTrial} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Trial Title</label>
                <input
                  type="text"
                  placeholder="e.g. Phase I Solid Tumor mRNA Targeted Immunotherapy"
                  value={trialForm.trialTitle}
                  onChange={(e) => setTrialForm({ ...trialForm, trialTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Genomic Biomarker Filter</label>
                <input
                  type="text"
                  value={trialForm.genomicBiomarker}
                  onChange={(e) => setTrialForm({ ...trialForm, genomicBiomarker: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setNewTrialModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition shadow-lg shadow-indigo-600/20"
                >
                  Open Trial Protocol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Trial Modal */}
      {inspectTrial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-sans">{inspectTrial.trialId} - Details</h3>
              <button type="button" onClick={() => setInspectTrial(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-2">
              <div>Title: <strong className="text-indigo-300 font-sans">{inspectTrial.trialTitle}</strong></div>
              <div>Investigator: <span className="text-slate-300">{inspectTrial.leadInvestigator}</span></div>
              <div>Cohort Enrolled: <span className="text-emerald-400 font-bold">{inspectTrial.enrolledPatients} / {inspectTrial.targetCohortSize}</span></div>
              <div>Biomarker: <span className="text-purple-300">{inspectTrial.genomicBiomarker}</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectTrial(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs font-sans"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
