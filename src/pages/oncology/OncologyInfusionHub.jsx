import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, AlertTriangle, Award, Beaker, Bell, CheckCircle2, ChevronRight,
  Clock, Cross, Database, Download, Droplets, Eye, FileText, Filter, Fingerprint,
  FlaskConical, Gauge, HeartPulse, Info, Layers, PackageCheck, Pause, Play, Plus,
  RefreshCw, Search, ShieldAlert, ShieldCheck, Siren, SlidersHorizontal,
  Stethoscope, Syringe, Timer, TrendingDown, TrendingUp, User, Users, X, Zap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Seed data                                                          */
/* ------------------------------------------------------------------ */

const PRIORITY_BADGE = {
  STAT: "bg-rose-500/15 text-rose-300 border-rose-500/40",
  Urgent: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  Scheduled: "bg-slate-500/15 text-slate-300 border-slate-500/40",
};

const CHAIR_COLORS = {
  "Chair 1": "border-rose-500/40",
  "Chair 2": "border-sky-500/40",
  "Chair 3": "border-amber-500/40",
  "Chair 4": "border-emerald-500/40",
  "Chair 5": "border-violet-500/40",
  "Chair 6": "border-cyan-500/40",
  "Chair 7": "border-fuchsia-500/40",
  "Chair 8": "border-lime-500/40",
  "Chair 9": "border-orange-500/40",
  "Chair 10": "border-teal-500/40",
};

const INITIAL_SCHEDULE = [
  { id: "IF-501", chair: "Chair 1", patient: "PT-2296 — F. Duarte", regimen: "R-CHOP — Cycle 3", priority: "Scheduled", progress: 42, phase: "Doxorubicin infusing", start: "09:15", duration: 240, nurse: "RN Costa", premeds: true },
  { id: "IF-502", chair: "Chair 2", patient: "PT-2288 — H. Bose", regimen: "Pembrolizumab 200mg", priority: "Scheduled", progress: 68, phase: "Observation post-infusion", start: "09:00", duration: 90, nurse: "RN Ito", premeds: true },
  { id: "IF-503", chair: "Chair 3", patient: "PT-2304 — I. Khan", regimen: "FOLFOX — Cycle 5", priority: "Urgent", progress: 24, phase: "Oxaliplatin infusing", start: "10:05", duration: 210, nurse: "RN Osei", premeds: true },
  { id: "IF-504", chair: "Chair 4", patient: "PT-2274 — M. Silva", regimen: "AC-T — Cycle 2 (A)", priority: "Scheduled", progress: 55, phase: "Adriamycin infusing", start: "08:50", duration: 180, nurse: "RN Costa", premeds: true },
  { id: "IF-505", chair: "Chair 5", patient: "PT-2307 — Y. Tanaka", regimen: "Trastuzumab 420mg", priority: "Scheduled", progress: 12, phase: "Loading dose", start: "10:20", duration: 120, nurse: "RN Ito", premeds: false },
  { id: "IF-506", chair: "Chair 6", patient: "PT-2291 — R. Vance", regimen: "Carboplatin/Paclitaxel — Cycle 4", priority: "Urgent", progress: 78, phase: "Paclitaxel infusing", start: "08:30", duration: 200, nurse: "RN Osei", premeds: true },
  { id: "IF-507", chair: "Chair 7", patient: "PT-2283 — G. Park", regimen: "Bendamustine+Rituximab", priority: "Scheduled", progress: 33, phase: "Rituximab infusing", start: "09:40", duration: 220, nurse: "RN Costa", premeds: true },
  { id: "IF-508", chair: "Chair 8", patient: "PT-2300 — O. Petrova", regimen: "Maintenance — Bevacizumab", priority: "Scheduled", progress: 6, phase: "Priming & vitals", start: "10:40", duration: 100, nurse: "RN Ito", premeds: false },
];

const INITIAL_ORDERS = [
  { id: "RX-601", patient: "PT-2296 — F. Duarte", regimen: "R-CHOP Cycle 3", bsa: 1.82, dose: "Dox 50 mg/m²", calcDose: 91, verifiedDose: 91, rate: "50 mg/h", status: "Verified", checks: ["ANC 4.1", "CrCl 88", "LFT ok"], pump: "Set", cycle: "3/6", nurse: "RN Costa" },
  { id: "RX-602", patient: "PT-2304 — I. Khan", regimen: "FOLFOX Cycle 5", bsa: 1.68, dose: "Oxali 85 mg/m²", calcDose: 142.8, verifiedDose: 143, rate: "42 mg/h", status: "Verified", checks: ["ANC 3.2", "CrCl 74", "Neuro ok"], pump: "Set", cycle: "5/8", nurse: "RN Osei" },
  { id: "RX-603", patient: "PT-2274 — M. Silva", regimen: "AC-T Cycle 2A", bsa: 1.74, dose: "Adria 60 mg/m²", calcDose: 104.4, verifiedDose: 104, rate: "30 mg/h", status: "Pending RN check", checks: ["ANC 2.9", "LVEF 58%"], pump: "Queued", cycle: "2/4", nurse: "RN Costa" },
  { id: "RX-604", patient: "PT-2291 — R. Vance", regimen: "Carbo/Pacli Cycle 4", bsa: 1.9, dose: "Pacli 175 mg/m²", calcDose: 332.5, verifiedDose: 333, rate: "80 mg/h", status: "Verified", checks: ["ANC 3.8", "CrCl 66", "Neuro ok"], pump: "Set", cycle: "4/6", nurse: "RN Osei" },
  { id: "RX-605", patient: "PT-2307 — Y. Tanaka", regimen: "Trastuzumab", bsa: 1.58, dose: "420 mg flat", calcDose: 420, verifiedDose: 420, rate: "168 mg/h", status: "Pending pharmacist", checks: ["LVEF 61%", "HER2 3+"], pump: "Queued", cycle: "Load", nurse: "RN Ito" },
  { id: "RX-606", patient: "PT-2300 — O. Petrova", regimen: "Bevacizumab maint.", bsa: 1.7, dose: "15 mg/kg", calcDose: 1050, verifiedDose: null, rate: "—", status: "Order received", checks: ["BP 138/88"], pump: "Queued", cycle: "Maint 7", nurse: "RN Ito" },
];

const VERIFY_STATUS = {
  Verified: { cls: "bg-emerald-500/10 text-emerald-300 border-emerald-500/40" },
  "Pending RN check": { cls: "bg-amber-500/10 text-amber-300 border-amber-500/40" },
  "Pending pharmacist": { cls: "bg-sky-500/10 text-sky-300 border-sky-500/40" },
  "Order received": { cls: "bg-slate-500/10 text-slate-300 border-slate-500/40" },
};

const INITIAL_REACTIONS = [
  { id: "IR-701", patient: "PT-2296 — F. Duarte", regimen: "R-CHOP — Doxorubicin", phase: "Monitoring", severity: "Mild", symptoms: "Mild flushing", temp: 37.1, hr: 88, bp: "124/78", action: "Rate reduced 50%", resolved: false },
  { id: "IR-702", patient: "PT-2304 — I. Khan", regimen: "FOLFOX — Oxaliplatin", phase: "Active", severity: "Moderate", symptoms: "Chills + pruritus", temp: 37.8, hr: 96, bp: "118/70", action: "Diphenhydramine given", resolved: false },
  { id: "IR-703", patient: "PT-2274 — M. Silva", regimen: "AC-T — Adriamycin", phase: "Active", severity: "Critical", symptoms: "Hypotension 82/48, dyspnea", temp: 38.2, hr: 112, bp: "82/48", action: "Infusion STOPPED — epi 0.3mg", resolved: false },
  { id: "IR-704", patient: "PT-2291 — R. Vance", regimen: "Carbo/Pacli — Paclitaxel", phase: "Closed", severity: "Mild", symptoms: "Nasal congestion", temp: 36.9, hr: 80, bp: "128/80", action: "Resolved — observation", resolved: true },
  { id: "IR-705", patient: "PT-2283 — G. Park", regimen: "BR — Rituximab", phase: "Active", severity: "Moderate", symptoms: "Fever 38.4, rigor", temp: 38.4, hr: 104, bp: "110/66", action: "Rate hold + paracetamol", resolved: false },
];

const REACTION_SEV = {
  Critical: "bg-rose-500/15 text-rose-300 border-rose-500/40",
  Moderate: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  Mild: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function progressBand(p) {
  if (p >= 90) return { label: "Nearly done", cls: "text-emerald-300" };
  if (p >= 60) return { label: "Infusing", cls: "text-sky-300" };
  return { label: "Early phase", cls: "text-amber-300" };
}

function priorityBadge(p) {
  return <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${PRIORITY_BADGE[p] || PRIORITY_BADGE.Scheduled}`}>{p}</span>;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function OncologyInfusionHub() {
  const [activeTab, setActiveTab] = useState("schedule");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [schedule, setSchedule] = useState(INITIAL_SCHEDULE);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [reactions, setReactions] = useState(INITIAL_REACTIONS);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [tick, setTick] = useState(0);
  const [modal, setModal] = useState(null);
  const [toasts, setToasts] = useState([]);
  const speedRef = useRef(1);
  const pausedRef = useRef(false);

  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  const addToast = useCallback((msg, kind = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((t) => [...t.slice(-3), { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  /* ---------------- simulation tick loop ---------------- */
  useEffect(() => {
    const iv = setInterval(() => {
      if (pausedRef.current) return;
      const n = Math.max(1, Math.round(speedRef.current));
      for (let s = 0; s < n; s += 1) {
        setTick((t) => t + 1);
        setSchedule((prev) =>
          prev.map((c) => ({
            ...c,
            progress: Math.min(100, c.progress + 0.9),
            phase: c.progress >= 94 ? "Flush & discharge" : c.progress >= 70 ? "Infusion near complete" : c.phase,
          }))
        );
      }
    }, 1600);
    return () => clearInterval(iv);
  }, []);

  /* ---------------- periodic events ---------------- */
  useEffect(() => {
    if (tick === 0) return;
    const r = Math.random();
    if (r < 0.14) {
      const chairs = Array.from({ length: 10 }, (_, i) => `Chair ${i + 1}`);
      const chair = chairs[Math.floor(Math.random() * chairs.length)];
      const pri = Math.random() < 0.3 ? "Urgent" : "Scheduled";
      const regimens = ["Pembrolizumab 200mg", "Nivolumab 240mg", "Rituximab maintenance", "G-CSF support"];
      const reg = regimens[Math.floor(Math.random() * regimens.length)];
      setSchedule((prev) => [
        {
          id: `IF-${509 + Math.floor(Math.random() * 90)}`,
          chair, patient: `PT-${2310 + Math.floor(Math.random() * 60)} — Referred Patient`,
          regimen: reg, priority: pri, progress: 0,
          phase: "Priming & vitals", start: "11:00", duration: 60 + Math.floor(Math.random() * 200),
          nurse: Math.random() < 0.5 ? "RN Costa" : "RN Ito", premeds: true,
        },
        ...prev,
      ]);
      addToast(`New infusion booked at ${chair} (${reg})`, "success");
    }
    if (r > 0.78) {
      const sev = ["Mild", "Mild", "Moderate", "Critical"][Math.floor(Math.random() * 4)];
      const symptoms = sev === "Critical" ? "Hypotension + dyspnea" : sev === "Moderate" ? "Fever + rigor" : "Mild flushing";
      const action = sev === "Critical" ? "Infusion STOPPED — epi ready" : sev === "Moderate" ? "Rate hold + antihistamine" : "Rate reduced 50%";
      setReactions((prev) => [
        {
          id: `IR-${706 + Math.floor(Math.random() * 90)}`,
          patient: `PT-${2310 + Math.floor(Math.random() * 60)} — Referred Patient`,
          regimen: "Active infusion", phase: "Active", severity: sev,
          symptoms, temp: +(36.8 + Math.random() * 1.4).toFixed(1),
          hr: 80 + Math.floor(Math.random() * 30), bp: `${110 + Math.floor(Math.random() * 20)}/${66 + Math.floor(Math.random() * 12)}`,
          action, resolved: false,
        },
        ...prev,
      ]);
      addToast(`Infusion reaction reported (${sev})`, sev === "Critical" ? "error" : "warn");
    }
    if (r > 0.9) {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.status === "Order received") return { ...o, status: "Pending pharmacist" };
          if (o.status === "Pending pharmacist") return { ...o, status: "Pending RN check" };
          if (o.status === "Pending RN check") return { ...o, status: "Verified", pump: "Set", verifiedDose: o.calcDose };
          return o;
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  /* ---------------- derived data ---------------- */
  const stats = useMemo(() => {
    const active = schedule.filter((c) => c.progress < 100).length;
    const urgent = schedule.filter((c) => c.priority === "Urgent").length;
    const pendingRx = orders.filter((o) => o.status !== "Verified").length;
    const activeReactions = reactions.filter((r) => !r.resolved).length;
    const critical = reactions.filter((r) => r.severity === "Critical" && !r.resolved).length;
    return { active, urgent, pendingRx, activeReactions, critical };
  }, [schedule, orders, reactions]);

  const filteredSchedule = useMemo(() => {
    const q = search.toLowerCase();
    return schedule.filter((c) => {
      if (priorityFilter !== "All" && c.priority !== priorityFilter) return false;
      if (q && !`${c.id} ${c.chair} ${c.regimen} ${c.patient} ${c.nurse} ${c.phase}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [schedule, search, priorityFilter]);

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "All" && o.status !== statusFilter) return false;
      if (q && !`${o.id} ${o.patient} ${o.regimen} ${o.dose} ${o.status}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [orders, search, statusFilter]);

  const filteredReactions = useMemo(() => {
    const q = search.toLowerCase();
    return reactions.filter((r) => {
      if (severityFilter !== "All" && r.severity !== severityFilter) return false;
      if (statusFilter !== "All") {
        if (statusFilter === "Active" && r.resolved) return false;
        if (statusFilter === "Resolved" && !r.resolved) return false;
      }
      if (q && !`${r.id} ${r.patient} ${r.regimen} ${r.symptoms}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [reactions, search, severityFilter, statusFilter]);

  /* ---------------- actions ---------------- */
  const reset = useCallback(() => {
    setSchedule(INITIAL_SCHEDULE);
    setOrders(INITIAL_ORDERS);
    setReactions(INITIAL_REACTIONS);
    setTick(0);
    setSearch("");
    setPriorityFilter("All");
    setStatusFilter("All");
    setSeverityFilter("All");
    addToast("Simulation reset to baseline", "info");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportCsv = useCallback(() => {
    const rows = activeTab === "schedule"
      ? [["Infusion", "Chair", "Patient", "Regimen", "Priority", "Progress%", "Phase", "Duration", "Nurse"]].concat(
          filteredSchedule.map((c) => [c.id, c.chair, c.patient, c.regimen, c.priority, c.progress, c.phase, c.duration, c.nurse])
        )
      : activeTab === "orders"
        ? [["Order", "Patient", "Regimen", "BSA", "Dose spec", "Calc(mg)", "Verified(mg)", "Rate", "Status", "Cycle"]].concat(
            filteredOrders.map((o) => [o.id, o.patient, o.regimen, o.bsa, o.dose, o.calcDose, o.verifiedDose ?? "—", o.rate, o.status, o.cycle])
          )
        : [["Reaction", "Patient", "Regimen", "Phase", "Severity", "Symptoms", "Temp", "HR", "BP", "Action"]].concat(
            filteredReactions.map((r) => [r.id, r.patient, r.regimen, r.phase, r.severity, r.symptoms, r.temp, r.hr, r.bp, r.action])
          );
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `oncology-${activeTab}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    addToast("CSV exported", "success");
  }, [activeTab, filteredSchedule, filteredOrders, filteredReactions, addToast]);

  const completeInfusion = (id) => {
    setSchedule((prev) => prev.map((c) => (c.id === id ? { ...c, progress: 100, phase: "Discharged — next cycle scheduled" } : c)));
    addToast(`${id} complete — patient discharged`, "success");
  };

  const verifyOrder = (id) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "Verified", pump: "Set", verifiedDose: o.verifiedDose ?? o.calcDose } : o)));
    addToast(`${id} verified — double-check documented`, "success");
  };

  const stopReaction = (id) => {
    setReactions((prev) => prev.map((r) => (r.id === id ? { ...r, action: "Infusion STOPPED — emergency protocol", phase: "Emergency" } : r)));
    addToast(`${id} infusion stopped — emergency protocol armed`, "error");
  };

  const resolveReaction = (id) => {
    setReactions((prev) => prev.map((r) => (r.id === id ? { ...r, resolved: true, phase: "Closed" } : r)));
    addToast(`${id} resolved — patient observed & documented`, "success");
  };

  /* ---------------- render helpers ---------------- */
  const tabBtn = (key, label, icon) => (
    <button
      onClick={() => setActiveTab(key)}
      className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
        activeTab === key
          ? "bg-slate-800 text-white shadow-lg shadow-slate-950/40 border border-slate-700"
          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const filterBar = (extra) => (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search infusions, orders…"
          className="w-64 rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-slate-600"
        />
      </div>
      <select
        value={priorityFilter}
        onChange={(e) => setPriorityFilter(e.target.value)}
        className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300 outline-none focus:border-slate-600"
      >
        {["All", "STAT", "Urgent", "Scheduled"].map((s) => <option key={s}>{s}</option>)}
      </select>
      {activeTab === "orders" && (
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300 outline-none focus:border-slate-600"
        >
          {["All", "Verified", "Pending RN check", "Pending pharmacist", "Order received"].map((s) => <option key={s}>{s}</option>)}
        </select>
      )}
      {activeTab === "reactions" && (
        <>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300 outline-none focus:border-slate-600"
          >
            {["All", "Critical", "Moderate", "Mild"].map((s) => <option key={s}>{s}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300 outline-none focus:border-slate-600"
          >
            {["All", "Active", "Resolved"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </>
      )}
      {extra}
    </div>
  );

  const speedBtn = (v, label) => (
    <button
      onClick={() => setSpeed(v)}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
        speed === v ? "border-slate-600 bg-slate-700 text-white" : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
      }`}
    >
      {label}
    </button>
  );

  /* ================= SCHEDULE CONSOLE ================= */
  const scheduleConsole = (
    <div className="space-y-6">
      {/* chair board */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => `Chair ${i + 1}`).map((chair) => {
          const c = schedule.filter((x) => x.chair === chair)[0];
          const busy = c && c.progress < 100;
          return (
            <div key={chair} className={`rounded-xl border p-4 ${busy ? (CHAIR_COLORS[chair] || "border-slate-700") + " bg-slate-900" : "border-slate-800 bg-slate-900/60"}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">{chair}</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${busy ? "text-rose-300" : "text-emerald-300"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${busy ? "bg-rose-400 animate-pulse" : "bg-emerald-400"}`} />
                  {busy ? "Infusing" : "Open"}
                </span>
              </div>
              {busy ? (
                <>
                  <p className="mt-2 truncate text-sm font-semibold text-white">{c.regimen}</p>
                  <p className="truncate text-xs text-slate-500">{c.patient}</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-rose-400 transition-all" style={{ width: `${c.progress}%` }} />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500">{c.progress.toFixed(0)}% · {c.phase}</p>
                </>
              ) : (
                <p className="mt-2 text-xs text-slate-500">Available · next slot ~11:30</p>
              )}
            </div>
          );
        })}
      </div>

      {/* infusion table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-5">
          <div>
            <h3 className="text-sm font-semibold text-white">Infusion Schedule</h3>
            <p className="text-xs text-slate-500">{filteredSchedule.length} infusions · chair capacity & duration managed live</p>
          </div>
          {filterBar(null)}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Infusion</th>
                <th className="px-5 py-3">Chair</th>
                <th className="px-5 py-3">Regimen</th>
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Progress</th>
                <th className="px-5 py-3">Nurse</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedule.map((c) => {
                const band = progressBand(c.progress);
                return (
                  <tr key={c.id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30">
                    <td className="px-5 py-3">
                      <button onClick={() => setModal({ kind: "infusion", data: c })} className="font-mono text-xs font-semibold text-sky-300 hover:underline">{c.id}</button>
                    </td>
                    <td className="px-5 py-3 text-xs font-semibold text-slate-300">{c.chair}</td>
                    <td className="px-5 py-3 text-slate-200">{c.regimen}</td>
                    <td className="px-5 py-3 text-xs text-slate-400">{c.patient}</td>
                    <td className="px-5 py-3">{priorityBadge(c.priority)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
                          <div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${c.progress}%` }} />
                        </div>
                        <span className={`text-xs ${band.cls}`}>{c.progress.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">{c.nurse}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <span className="hidden text-xs text-slate-500 lg:inline">{c.phase}</span>
                        {c.progress < 100 && (
                          <button onClick={() => completeInfusion(c.id)} className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20">
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSchedule.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-500">No infusions match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  /* ================= ORDERS CONSOLE ================= */
  const ordersConsole = (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Orders today", value: orders.length, icon: <FileText className="h-4 w-4 text-emerald-300" /> },
          { label: "Awaiting verification", value: stats.pendingRx, icon: <Clock className="h-4 w-4 text-amber-300" /> },
          { label: "Pumps set & running", value: orders.filter((o) => o.pump === "Set").length, icon: <Syringe className="h-4 w-4 text-sky-300" /> },
          { label: "Avg BSA cohort", value: (orders.reduce((a, o) => a + o.bsa, 0) / orders.length).toFixed(2), icon: <Gauge className="h-4 w-4 text-violet-300" /> },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{s.label}</span>
              {s.icon}
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-5">
          <div>
            <h3 className="text-sm font-semibold text-white">Protocol & Dose Verification</h3>
            <p className="text-xs text-slate-500">BSA-calculated dosing · ASCO/ONS safe-handling · independent double-check before infusion</p>
          </div>
          {filterBar(null)}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Regimen</th>
                <th className="px-5 py-3">BSA</th>
                <th className="px-5 py-3">Dose spec</th>
                <th className="px-5 py-3">Calc / Verified</th>
                <th className="px-5 py-3">Rate</th>
                <th className="px-5 py-3">Lab checks</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => {
                const s = VERIFY_STATUS[o.status] || VERIFY_STATUS["Order received"];
                return (
                  <tr key={o.id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30">
                    <td className="px-5 py-3">
                      <button onClick={() => setModal({ kind: "order", data: o })} className="font-mono text-xs font-semibold text-sky-300 hover:underline">{o.id}</button>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-slate-200">{o.regimen}</p>
                      <p className="text-[11px] text-slate-500">Cycle {o.cycle}</p>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-400">{o.bsa} m²</td>
                    <td className="px-5 py-3 text-xs text-slate-300">{o.dose}</td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-slate-300">{o.calcDose} mg</span>
                      {o.verifiedDose != null ? (
                        <span className="ml-2 rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[11px] font-bold text-emerald-300">✓ {o.verifiedDose}</span>
                      ) : (
                        <span className="ml-2 text-[11px] text-slate-500">pending</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">{o.rate}</td>
                    <td className="px-5 py-3 text-xs text-slate-400">{o.checks.join(" · ")}</td>
                    <td className="px-5 py-3"><span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${s.cls}`}>{o.status}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        {o.status !== "Verified" && (
                          <button onClick={() => verifyOrder(o.id)} className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20">
                            Verify
                          </button>
                        )}
                        {o.status === "Verified" && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-sm text-slate-500">No orders match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-300" />
          <h3 className="text-sm font-semibold text-white">Safe Handling & Double-Check Protocol</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { title: "BSA Dose Calculation", body: "Doses computed from Mosteller BSA (m²) at each cycle; capped for obesity per ASCO guidance; rounded to nearest vial size." },
            { title: "Independent Double-Check", body: "Second RN re-derives dose, rate, pump programming and patient identity against the verified order before start." },
            { title: "Cytotoxic Handling", body: "Closed-system transfer devices (CSTD) in use; staff wear double gloves + gown per NIOSH/ASHP USP 800." },
          ].map((s) => (
            <div key={s.title} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-sm font-semibold text-slate-200">{s.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ================= REACTIONS CONSOLE ================= */
  const reactionsConsole = (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Active reactions", value: stats.activeReactions, icon: <HeartPulse className="h-4 w-4 text-amber-300" /> },
          { label: "Critical (emergency)", value: stats.critical, icon: <AlertTriangle className="h-4 w-4 text-rose-300" />, alert: stats.critical > 0 },
          { label: "Resolved today", value: reactions.filter((r) => r.resolved).length, icon: <CheckCircle2 className="h-4 w-4 text-emerald-300" /> },
          { label: "Premedication rate", value: `${Math.round((schedule.filter((c) => c.premeds).length / Math.max(1, schedule.length)) * 100)}%`, icon: <Syringe className="h-4 w-4 text-sky-300" /> },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.alert ? "border-rose-500/40 bg-rose-500/5" : "border-slate-800 bg-slate-900"}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{s.label}</span>
              {s.icon}
            </div>
            <p className={`mt-2 text-2xl font-bold ${s.alert ? "text-rose-300" : "text-white"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-5">
          <div>
            <h3 className="text-sm font-semibold text-white">Infusion Reaction Watch</h3>
            <p className="text-xs text-slate-500">ASCO/ONS infusion reaction algorithm · stop → assess → treat → restart decision</p>
          </div>
          {filterBar(null)}
        </div>
        <div className="space-y-3 p-5">
          {filteredReactions.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <button onClick={() => setModal({ kind: "reaction", data: r })} className="font-mono text-xs font-semibold text-sky-300 hover:underline">{r.id}</button>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-200">{r.patient}</p>
                <p className="text-xs text-slate-500">{r.regimen} · {r.symptoms}</p>
              </div>
              <div className="hidden items-center gap-3 text-xs text-slate-400 lg:flex">
                <span>T {r.temp}°C</span>
                <span>HR {r.hr}</span>
                <span>BP {r.bp}</span>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${REACTION_SEV[r.severity] || REACTION_SEV.Mild}`}>{r.severity}</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                r.resolved ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : r.phase === "Emergency" ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                : "border-amber-500/40 bg-amber-500/10 text-amber-300"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${r.resolved ? "bg-emerald-400" : r.phase === "Emergency" ? "bg-rose-400" : "bg-amber-400"}`} />
                {r.resolved ? "Resolved" : r.phase}
              </span>
              <span className="hidden text-xs text-slate-400 xl:inline">{r.action}</span>
              {!r.resolved && (
                <div className="flex gap-2">
                  <button onClick={() => stopReaction(r.id)} className="rounded-md border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-300 hover:bg-rose-500/20">
                    Stop Infusion
                  </button>
                  <button onClick={() => resolveReaction(r.id)} className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20">
                    Resolve
                  </button>
                </div>
              )}
            </div>
          ))}
          {filteredReactions.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-800 p-10 text-center text-sm text-slate-500">No reactions match the current filters.</div>
          )}
        </div>
      </div>
    </div>
  );

  /* ================= MODAL ================= */
  const renderModal = () => {
    if (!modal) return null;
    const { kind, data } = modal;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setModal(null)}>
        <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-white">
              {kind === "infusion" ? `Infusion ${data.id}` : kind === "order" ? `Order ${data.id}` : `Reaction ${data.id}`}
            </h3>
            <button onClick={() => setModal(null)} className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          {kind === "infusion" && (
            <div className="space-y-3 text-sm">
              <Row label="Chair" value={data.chair} />
              <Row label="Regimen" value={data.regimen} />
              <Row label="Patient" value={data.patient} />
              <Row label="Priority" value={data.priority} />
              <Row label="Progress" value={`${data.progress.toFixed(0)}%`} />
              <Row label="Phase" value={data.phase} />
              <Row label="Start" value={data.start} />
              <Row label="Duration" value={`${data.duration} min planned`} />
              <Row label="Nurse" value={data.nurse} />
              <Row label="Premedication" value={data.premeds ? "Given (dexamethasone + antihistamine)" : "Not indicated"} />
              <p className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs leading-relaxed text-slate-400">
                Pump programmed from the verified order; vital signs monitored per ONS guidelines at 15-min intervals during infusion.
              </p>
            </div>
          )}
          {kind === "order" && (
            <div className="space-y-3 text-sm">
              <Row label="Patient" value={data.patient} />
              <Row label="Regimen" value={`${data.regimen} · Cycle ${data.cycle}`} />
              <Row label="BSA" value={`${data.bsa} m² (Mosteller)`} />
              <Row label="Dose specification" value={data.dose} />
              <Row label="Calculated dose" value={`${data.calcDose} mg`} />
              <Row label="Verified dose" value={data.verifiedDose != null ? `${data.verifiedDose} mg` : "Pending"} />
              <Row label="Rate" value={data.rate} />
              <Row label="Lab checks" value={data.checks.join(" · ")} />
              <Row label="Pump" value={data.pump} />
              <p className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs leading-relaxed text-slate-400">
                Dose independently double-checked by two clinicians; pump programming verified against order before start per ASCO/ONS safe-handling standards.
              </p>
            </div>
          )}
          {kind === "reaction" && (
            <div className="space-y-3 text-sm">
              <Row label="Patient" value={data.patient} />
              <Row label="Regimen" value={data.regimen} />
              <Row label="Symptoms" value={data.symptoms} />
              <Row label="Severity" value={data.severity} />
              <Row label="Temperature" value={`${data.temp}°C`} />
              <Row label="Heart rate" value={`${data.hr} bpm`} />
              <Row label="BP" value={data.bp} />
              <Row label="Action" value={data.action} />
              <p className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs leading-relaxed text-slate-400">
                {data.severity === "Critical"
                  ? "EMERGENCY: infusion stopped, epinephrine + diphenhydramine ready, crash cart on standby. HCP escalation per ASCO algorithm."
                  : "Rate titration and antihistamine management per ONS infusion reaction protocol; patient remains under observation."}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        {/* header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-2.5">
                <Syringe className="h-6 w-6 text-fuchsia-300" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Oncology Infusion Center</h1>
                <p className="text-sm text-slate-400">ASCO/ONS infusion safety · USP 800 hazardous drug handling · dose double-check · reaction algorithm</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPaused((p) => !p)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                paused ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : "border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {paused ? "Resume" : "Pause"}
            </button>
            <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
              {[[1, "1×"], [2, "2×"], [4, "4×"]].map(([v, label]) => speedBtn(v, label))}
            </div>
            <button onClick={reset} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-300 hover:text-white">
              <RefreshCw className="h-4 w-4" /> Reset
            </button>
            <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-300 hover:text-white">
              <Download className="h-4 w-4" /> CSV
            </button>
          </div>
        </div>

        {/* stat cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard label="Active infusions" value={stats.active} icon={<Syringe className="h-4 w-4 text-emerald-300" />} />
          <StatCard label="Urgent lanes" value={stats.urgent} icon={<Siren className="h-4 w-4 text-amber-300" />} />
          <StatCard label="Orders pending verify" value={stats.pendingRx} icon={<Clock className="h-4 w-4 text-amber-300" />} />
          <StatCard label="Active reactions" value={stats.activeReactions} icon={<HeartPulse className="h-4 w-4 text-rose-300" />} alert={stats.critical > 0} />
          <StatCard label="Critical reactions" value={stats.critical} icon={<AlertTriangle className="h-4 w-4 text-rose-300" />} alert={stats.critical > 0} />
        </div>

        {/* tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {tabBtn("schedule", "Chemo Chair Schedule", <Syringe className="h-4 w-4" />)}
          {tabBtn("orders", "Protocol & Dose Verify", <FileText className="h-4 w-4" />)}
          {tabBtn("reactions", "Infusion Reaction Watch", <HeartPulse className="h-4 w-4" />)}
        </div>

        {/* active console */}
        {activeTab === "schedule" && scheduleConsole}
        {activeTab === "orders" && ordersConsole}
        {activeTab === "reactions" && reactionsConsole}

        {/* footer strip */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${paused ? "bg-amber-400" : "bg-emerald-400"}`} />
            Live simulation {paused ? "paused" : `running at ${speed}×`} · tick #{tick}
          </span>
          <span className="hidden md:inline">ASCO · ONS · USP 800 · NCCN chemotherapy order templates</span>
          <button onClick={() => addToast("Chemo order batch exported to EMR queue", "success")} className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white">
            <Database className="h-3.5 w-3.5" /> Export order queue
          </button>
        </div>
      </div>

      {/* modal */}
      {renderModal()}

      {/* toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur ${
              t.kind === "error"
                ? "border-rose-500/50 bg-rose-950/90 text-rose-200"
                : t.kind === "warn"
                  ? "border-amber-500/50 bg-amber-950/90 text-amber-200"
                  : "border-emerald-500/50 bg-emerald-950/90 text-emerald-200"
            }`}
          >
            {t.kind === "error" ? <AlertTriangle className="h-4 w-4 shrink-0" /> : t.kind === "warn" ? <Bell className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small presentational helpers                                       */
/* ------------------------------------------------------------------ */

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2.5">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-right text-sm font-medium text-slate-200">{value}</span>
    </div>
  );
}

function StatCard({ label, value, icon, alert }) {
  return (
    <div className={`rounded-xl border p-4 ${alert ? "border-rose-500/40 bg-rose-500/5" : "border-slate-800 bg-slate-900"}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        {icon}
      </div>
      <p className={`mt-2 text-2xl font-bold ${alert ? "text-rose-300" : "text-white"}`}>{value}</p>
    </div>
  );
}
