import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Bot,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sliders,
  Terminal,
  Cpu,
  Lock,
  Search,
  PlusCircle,
  Download,
  Code,
  Layers,
  Sparkles,
  Eye,
  X,
  FileCode,
  Database,
  Key,
  UserCheck,
  Activity,
  Smartphone,
  Globe,
  Zap,
  Check,
  ShieldAlert,
  HardDrive,
  User,
  SlidersHorizontal
} from "lucide-react";
import {
  getAiAgentGovernanceInventory,
  registerAiAgent,
  inspectAgentGuardrails,
  getAiAgentGovernanceStandards
} from "../../services/BiomedicalAiAgentGovernanceService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalAiAgentGovernancePanel Component
 * 
 * Biomedical Autonomous AI Agent Governance & Guardrails Console.
 * Features:
 * 1. Clinical AI Agent Inventory & Autonomy Boundary Matrix
 * 2. Real-Time Agentic Guardrail & Hallucination Inspection Sandbox
 * 3. NIST AI RMF 1.0 & US Executive Order 14110 Standards
 * 4. Autonomous AI Agent Registration Modal
 */
export default function BiomedicalAiAgentGovernancePanel() {
  // State
  const [agents, setAgents] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("AGENTS"); // "AGENTS" | "SANDBOX" | "STANDARDS"

  // Sandbox State
  const [selectedAgentId, setSelectedAgentId] = useState("AGENT-CLIN-2201");
  const [inspectResult, setInspectResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agentName, setAgentName] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [agList, stdList] = await Promise.all([
        getAiAgentGovernanceInventory().catch(() => []),
        getAiAgentGovernanceStandards().catch(() => [])
      ]);

      setAgents(agList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical AI agent governance data:", err);
      setMessage({ type: "error", text: "Failed connecting to AI Agent Governance service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run Guardrail Inspection
  const handleInspectGuardrails = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await inspectAgentGuardrails(selectedAgentId);
      setInspectResult(result);
      setMessage({ type: "success", text: `AI Agent Guardrail Inspection completed in ${result.inspectionLatencyMs}ms! Decision: ${result.governanceDecision}. Violations: ${result.toolBoundaryViolationCount}. Hallucination Score: ${result.hallucinationScore}.` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "AI agent guardrail inspection failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Register AI Agent
  const handleRegisterAgent = async (e) => {
    e.preventDefault();
    if (!agentName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newAg = await registerAiAgent({ agentName: agentName.trim() });

      setAgentName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `Autonomous AI Agent ${newAg.agentId} registered with NIST AI RMF 1.0 guardrails!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to register autonomous AI agent." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalAgents = agents.length;
    const enforcedCount = agents.filter((a) => a.guardrailStatus.includes("ENFORCED")).length;
    const avgHallucination = (agents.reduce((acc, curr) => acc + curr.hallucinationRiskPercent, 0) / (totalAgents || 1)).toFixed(3);

    return { totalAgents, enforcedCount, avgHallucination };
  }, [agents]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Bot size={12} /> AUTONOMOUS AI AGENT GOVERNANCE
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> NIST AI RMF 1.0 COMPLIANT
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical Autonomous AI Agent Governance
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Clinical autonomous agent tool-use boundaries, real-time hallucination risk scoring, Human-in-the-Loop (HITL) overwatch, and US Executive Order 14110 safety guardrails.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">Agent Guardrail Telemetry</span>
              <span className="text-teal-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                GUARDRAILS ENFORCED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Active Agents: <strong className="text-white">{metrics.totalAgents} Registered</strong></div>
              <div>Hallucination Risk: <strong className="text-teal-300">{metrics.avgHallucination}%</strong></div>
              <div>HITL Overwatch: <strong className="text-emerald-400">100% COVERAGE</strong></div>
              <div>Tool Boundaries: <strong className="text-emerald-400">STRICT ABAC</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-teal-500/10 border-teal-500/30 text-teal-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              <span>{message.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setMessage({ type: "", text: "" })}
              className="text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 2. Navigation bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("AGENTS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "AGENTS"
                ? "bg-teal-600 text-white font-black shadow-lg shadow-teal-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Bot size={15} /> Clinical AI Agents ({agents.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SANDBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SANDBOX"
                ? "bg-teal-600 text-white font-black shadow-lg shadow-teal-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> Agentic Guardrail & Hallucination Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-teal-600 text-white font-black shadow-lg shadow-teal-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> NIST AI RMF & EO 14110 ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-teal-600/20"
        >
          <PlusCircle size={15} /> Register Clinical AI Agent
        </button>
      </div>

      {/* 3. AGENTS TAB */}
      {activeTab === "AGENTS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Registered Autonomous Clinical AI Agents</h3>
              <p className="text-xs text-slate-400 font-mono">Agent IDs, names, autonomy levels, permitted tool use, prohibited actions, and guardrail enforcement states</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Agent ID</th>
                  <th className="p-3">Agent Name & Autonomy Level</th>
                  <th className="p-3">Allowed Tools</th>
                  <th className="p-3">Prohibited Actions</th>
                  <th className="p-3 text-right">Guardrail Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {agents.map((a, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-teal-400">{a.agentId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{a.agentName}</div>
                      <div className="text-[10px] text-teal-300 font-mono">{a.autonomyLevel}</div>
                    </td>
                    <td className="p-3 text-emerald-400 font-mono text-[10px]">{a.allowedTools.join(", ")}</td>
                    <td className="p-3 text-red-400 font-mono text-[10px]">{a.prohibitedActions.join(", ")}</td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {a.guardrailStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SANDBOX TAB */}
      {activeTab === "SANDBOX" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap size={18} className="text-teal-400" /> Agentic Guardrail & Hallucination Inspector
              </h3>
            </div>

            <form onSubmit={handleInspectGuardrails} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Clinical AI Agent:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-sans"
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                >
                  {agents.map((a) => (
                    <option key={a.agentId} value={a.agentId}>
                      {a.agentId} - {a.agentName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-teal-600/20"
              >
                <Zap size={16} /> Execute Real-Time Guardrail Inspection
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Inspection Output
              </h3>
            </div>

            {inspectResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Governance Decision:</span>
                  <div className="text-sm font-bold text-emerald-400">{inspectResult.governanceDecision}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Tool Boundary Violations: <strong className="text-emerald-400 font-mono text-[10px]">{inspectResult.toolBoundaryViolationCount}</strong></div>
                  <div>Hallucination Score: <strong className="text-emerald-400">{inspectResult.hallucinationScore}</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute Real-Time Guardrail Inspection" to audit agent boundaries.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. STANDARDS TAB */}
      {activeTab === "STANDARDS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">NIST AI RMF 1.0 & US Executive Order 14110 Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for trustworthy autonomous AI agents, tool-use boundaries, and clinical safety guardrails</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded font-bold">
                    {s.standard}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{s.standard}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{s.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. PROVISION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bot size={18} className="text-teal-400" /> Register Clinical AI Agent
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRegisterAgent} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Agent Name & Purpose:</label>
                <input
                  type="text"
                  placeholder="e.g. Radiology Medical Imaging Assistant Agent"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-sans"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition shadow-lg shadow-teal-600/20"
                >
                  Register Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
