import React, { useState, useMemo, useCallback } from "react";
import {
  Activity, AlertTriangle, Clock, Download, Filter, HeartPulse, Layers, Pill,
  RefreshCw, Search, ShieldCheck, Skull, Users, Zap,
} from "lucide-react";
import { StatCard } from "../../components/common/StatCard";
import { TabsBar } from "../../components/common/TabsBar";
import ToastStack, { useToasts } from "../../components/common/ToastStack";
import InteractionAlertCard from "../../components/pharmacy/InteractionAlertCard";
import MedicationSearchPanel from "../../components/pharmacy/MedicationSearchPanel";
import InteractionTimeline from "../../components/pharmacy/InteractionTimeline";
import {
  detectInteractions, calculateRiskScore, DRUG_DATABASE, SEVERITY_META,
  PATIENT_PROFILES, generateAlertTimeline, getDrugInfo,
} from "../../services/MedicationInteractionService";

/* ── Tab Definitions ─────────────────────────────────────────────────────── */

const TABS = [
  { key: "alerts", label: "Alert Console", icon: AlertTriangle, blurb: "Live drug-drug interaction detection and severity scoring" },
  { key: "patients", label: "Patient Profiles", icon: Users, blurb: "Pre-configured medication profiles for rapid analysis" },
  { key: "timeline", label: "Interaction Timeline", icon: Clock, blurb: "Chronological audit trail of alert events and dispositions" },
];

const SEVERITY_FILTERS = ["all", "critical", "high", "moderate", "low"];

/* ── Helper ──────────────────────────────────────────────────────────────── */

function generateMockTimeline() {
  return PATIENT_PROFILES.flatMap((pt) => {
    const events = generateAlertTimeline(pt.medications);
    return events.map((e) => ({ ...e, patientId: pt.id, patientName: pt.name }));
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/* ── Page Component ──────────────────────────────────────────────────────── */

export default function MedicationInteractionAlertEnginePage({ onNavigate }) {
  const [activeTab, setActiveTab] = useState("alerts");
  const [selectedMeds, setSelectedMeds] = useState(["warfarin", "amiodarone", "lisinopril", "spironolactone"]);
  const [sevFilter, setSevFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [timelineEvents] = useState(() => generateMockTimeline());
  const { toasts, addToast } = useToasts();

  /* ── Derived State ────────────────────────────────────────────── */

  const interactions = useMemo(() => detectInteractions(selectedMeds), [selectedMeds]);
  const riskScore = useMemo(() => calculateRiskScore(selectedMeds), [selectedMeds]);

  const filteredInteractions = useMemo(() => {
    if (sevFilter === "all") return interactions;
    return interactions.filter((i) => i.severity === sevFilter);
  }, [interactions, sevFilter]);

  const criticalCount = interactions.filter((i) => i.severity === "critical").length;
  const highCount = interactions.filter((i) => i.severity === "high").length;
  const moderateCount = interactions.filter((i) => i.severity === "moderate").length;

  const patientTimeline = useMemo(() => {
    if (!selectedPatient) return timelineEvents;
    return timelineEvents.filter((e) => e.patientId === selectedPatient);
  }, [selectedPatient, timelineEvents]);

  /* ── Handlers ─────────────────────────────────────────────────── */

  const handleAddMed = useCallback((drugId) => {
    setSelectedMeds((prev) => [...prev, drugId]);
    const drug = getDrugInfo(drugId);
    addToast(`Added ${drug?.name || drugId} to analysis`, "info");
  }, [addToast]);

  const handleRemoveMed = useCallback((drugId) => {
    setSelectedMeds((prev) => prev.filter((id) => id !== drugId));
  }, []);

  const handleLoadPatient = useCallback((patient) => {
    setSelectedMeds([...patient.medications]);
    setSelectedPatient(patient.id);
    setActiveTab("alerts");
    addToast(`Loaded medications for ${patient.name}`, "success");
  }, [addToast]);

  const handleAcknowledge = useCallback((interaction) => {
    addToast(`Acknowledged: ${interaction.drugA?.name} × ${interaction.drugB?.name}`, "success");
  }, [addToast]);

  const handleDismiss = useCallback((interaction) => {
    addToast(`Override requested for ${interaction.drugA?.name} × ${interaction.drugB?.name} — sent to pharmacy review`, "warning");
  }, [addToast]);

  const riskColor = riskScore > 60 ? "text-rose-400" : riskScore > 30 ? "text-amber-400" : "text-emerald-400";
  const riskBg = riskScore > 60 ? "from-rose-500/10" : riskScore > 30 ? "from-amber-500/10" : "from-emerald-500/10";

  /* ── Render ───────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <ToastStack toasts={toasts} />

      {/* Header */}
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-r ${riskBg} to-transparent pointer-events-none`} />
        <div className="max-w-[1440px] mx-auto px-6 pt-10 pb-6 relative">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <Pill size={20} className="text-sky-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                Medication Interaction <span className="text-sky-400">Alert Engine</span>
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Real-time drug-drug interaction detection, severity scoring & clinical decision support
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 pb-16">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Activity} label="Risk Score" value={`${riskScore}`} suffix="/100" tone={riskColor} />
          <StatCard icon={Skull} label="Critical" value={`${criticalCount}`} tone={criticalCount > 0 ? "text-rose-400" : "text-emerald-400"} />
          <StatCard icon={AlertTriangle} label="High Severity" value={`${highCount}`} tone={highCount > 0 ? "text-amber-400" : "text-emerald-400"} />
          <StatCard icon={Pill} label="Active Meds" value={`${selectedMeds.length}`} tone="text-sky-400" />
        </div>

        {/* Tab Bar */}
        <div className="mb-8">
          <TabsBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
        </div>

        {/* ── Alert Console Tab ──────────────────────────────────── */}
        {activeTab === "alerts" && (
          <div className="grid lg:grid-cols-[360px_1fr] gap-6">
            {/* Left: Medication Search */}
            <div className="space-y-6">
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Search size={14} className="text-sky-400" />
                  Add Medications
                </h3>
                <p className="text-slate-500 text-[11px] mb-4">Search the drug database to build the analysis set</p>
                <MedicationSearchPanel
                  selectedIds={selectedMeds}
                  onAdd={handleAddMed}
                  onRemove={handleRemoveMed}
                />
              </div>

              {/* Quick Load Patient */}
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Users size={14} className="text-violet-400" />
                  Quick Load Patient
                </h3>
                <div className="space-y-2">
                  {PATIENT_PROFILES.map((pt) => (
                    <button
                      key={pt.id}
                      onClick={() => handleLoadPatient(pt)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all text-xs ${
                        selectedPatient === pt.id
                          ? "bg-sky-500/10 border-sky-500/30 text-sky-300"
                          : "bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/5 hover:border-white/10"
                      }`}
                    >
                      <p className="font-bold">{pt.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{pt.medications.length} medications · {pt.diagnosis.split(",")[0]}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Interaction Results */}
            <div>
              {/* Severity Filter */}
              <div className="flex items-center gap-2 mb-4">
                <Filter size={14} className="text-slate-500" />
                <div className="flex gap-1.5">
                  {SEVERITY_FILTERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setSevFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all border ${
                        sevFilter === f
                          ? "bg-white/10 border-white/20 text-white"
                          : "bg-transparent border-transparent text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <span className="ml-auto text-xs text-slate-500">
                  {filteredInteractions.length} interaction{filteredInteractions.length !== 1 ? "s" : ""} detected
                </span>
              </div>

              {/* Interaction Cards */}
              {filteredInteractions.length > 0 ? (
                <div className="grid gap-4">
                  {filteredInteractions.map((ix) => (
                    <InteractionAlertCard
                      key={ix.id}
                      interaction={ix}
                      onAcknowledge={handleAcknowledge}
                      onDismiss={handleDismiss}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-12 text-center">
                  <ShieldCheck size={40} className="text-emerald-500/40 mx-auto mb-4" />
                  <p className="text-slate-300 font-bold text-lg mb-1">
                    {selectedMeds.length < 2 ? "Add at least 2 medications" : "No interactions found"}
                  </p>
                  <p className="text-slate-500 text-sm">
                    {selectedMeds.length < 2
                      ? "Search and add medications to begin interaction analysis"
                      : "The selected medication combination has no known interactions in the database"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Patient Profiles Tab ───────────────────────────────── */}
        {activeTab === "patients" && (
          <div className="grid md:grid-cols-2 gap-5">
            {PATIENT_PROFILES.map((pt) => {
              const score = calculateRiskScore(pt.medications);
              const ixCount = detectInteractions(pt.medications).length;
              return (
                <div
                  key={pt.id}
                  className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.05] transition-all cursor-pointer group"
                  onClick={() => handleLoadPatient(pt)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-white font-bold text-lg">{pt.name}</h3>
                      <p className="text-slate-400 text-xs mt-0.5">Age {pt.age} · {pt.mrn}</p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-xl text-sm font-black border ${
                      score > 60 ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                        : score > 30 ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    }`}>
                      Risk: {score}
                    </div>
                  </div>
                  <p className="text-slate-300 text-xs mb-4">
                    <span className="text-slate-500 font-semibold">Diagnosis:</span> {pt.diagnosis}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {pt.medications.map((mid) => {
                      const drug = getDrugInfo(mid);
                      return (
                        <span key={mid} className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-semibold text-slate-300">
                          {drug?.name || mid}
                        </span>
                      );
                    })}
                  </div>
                  {pt.allergies.length > 0 && (
                    <div className="flex items-center gap-1.5 text-rose-400 text-[10px] font-semibold">
                      <AlertTriangle size={10} />
                      Allergies: {pt.allergies.join(", ")}
                    </div>
                  )}
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-slate-500 text-[10px]">{ixCount} interaction{ixCount !== 1 ? "s" : ""} found</span>
                    <span className="text-sky-400 text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      Load Profile →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Timeline Tab ───────────────────────────────────────── */}
        {activeTab === "timeline" && (
          <div className="grid lg:grid-cols-[280px_1fr] gap-6">
            {/* Patient selector */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Users size={14} className="text-violet-400" />
                Filter by Patient
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedPatient(null)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    !selectedPatient ? "bg-sky-500/10 border-sky-500/30 text-sky-300" : "bg-transparent border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  All Patients
                </button>
                {PATIENT_PROFILES.map((pt) => (
                  <button
                    key={pt.id}
                    onClick={() => setSelectedPatient(pt.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                      selectedPatient === pt.id ? "bg-sky-500/10 border-sky-500/30 text-sky-300" : "bg-transparent border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    {pt.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
                <Clock size={14} className="text-sky-400" />
                Alert Event Timeline
                <span className="ml-auto text-[10px] text-slate-500 font-normal">{patientTimeline.length} events</span>
              </h3>
              <InteractionTimeline events={patientTimeline} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
