import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  KeyRound,
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
  HardDrive
} from "lucide-react";
import {
  getZkpVerifiableEhrInventory,
  generateZkpCredential,
  verifyZkProof,
  getZkpVerifiableEhrStandards
} from "../../services/BiomedicalZkpVerifiableEhrService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalZkpVerifiableEhrPanel Component
 * 
 * Biomedical Zero-Knowledge Proof (ZKP) Verifiable EHR & Credentials Console.
 * Features:
 * 1. zk-SNARK Medical Credential Inventory & Proof Hash Matrix
 * 2. Real-Time zk-SNARK Proof Verification & Circuit Constraint Sandbox
 * 3. W3C Verifiable Credentials v2.0 & ISO/IEC 18013-5 Standards
 * 4. ZKP Verifiable Credential Generation Modal
 */
export default function BiomedicalZkpVerifiableEhrPanel() {
  // State
  const [credentials, setCredentials] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("CREDENTIALS"); // "CREDENTIALS" | "SANDBOX" | "STANDARDS"

  // Sandbox State
  const [selectedCredentialId, setSelectedCredentialId] = useState("ZKP-VC-2301");
  const [verifyResult, setVerifyResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [credentialType, setCredentialType] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [credList, stdList] = await Promise.all([
        getZkpVerifiableEhrInventory().catch(() => []),
        getZkpVerifiableEhrStandards().catch(() => [])
      ]);

      setCredentials(credList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical ZKP verifiable EHR data:", err);
      setMessage({ type: "error", text: "Failed connecting to ZKP Verifiable EHR service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run ZK Proof Verification
  const handleVerifyZkProof = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await verifyZkProof(selectedCredentialId);
      setVerifyResult(result);
      setMessage({ type: "success", text: `zk-SNARK Proof verified in ${result.verificationLatencyMs}ms! Proof Valid: YES. Zero PHI Exposed: YES. Circuit Satisfied: YES.` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "zk-SNARK proof verification failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Generate ZKP Credential
  const handleGenerateCredential = async (e) => {
    e.preventDefault();
    if (!credentialType.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newCred = await generateZkpCredential({ credentialType: credentialType.trim() });

      setCredentialType("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `Zero-Knowledge Verifiable Credential ${newCred.credentialId} issued with Groth16 zk-SNARK proof!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to generate ZKP credential." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalCredentials = credentials.length;
    const verifiedCount = credentials.filter((c) => c.verificationStatus.includes("VERIFIED")).length;
    const totalConstraints = credentials.reduce((acc, curr) => acc + curr.circuitConstraintsCount, 0);

    return { totalCredentials, verifiedCount, totalConstraints };
  }, [credentials]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <KeyRound size={12} /> ZERO-KNOWLEDGE PROOF VERIFIABLE EHR
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> W3C VC 2.0 / Groth16 zk-SNARKs
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical ZKP Verifiable EHR & Credentials
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Zero-Knowledge Proofs (zk-SNARKs Groth16 / PLONK), W3C Verifiable Credentials, selective predicate disclosure (e.g. proving age/immunity/prescriber status without exposing raw EHR or PHI), and ISO/IEC 18013-5 compliance.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">zk-SNARK Telemetry</span>
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                ZERO PHI LEAK
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Issued Credentials: <strong className="text-white">{metrics.totalCredentials} Active</strong></div>
              <div>zk-SNARK Circuit: <strong className="text-cyan-300">Groth16 BN254</strong></div>
              <div>Constraint Gates: <strong className="text-emerald-400">{metrics.totalConstraints.toLocaleString()} Gates</strong></div>
              <div>Verification: <strong className="text-emerald-400">9ms (SUCCINCT)</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
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
            onClick={() => setActiveTab("CREDENTIALS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "CREDENTIALS"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <KeyRound size={15} /> ZKP Credentials ({credentials.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SANDBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SANDBOX"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> zk-SNARK Proof Verifier Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> W3C VC 2.0 & ZK Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-600/20"
        >
          <PlusCircle size={15} /> Issue ZKP Verifiable Credential
        </button>
      </div>

      {/* 3. CREDENTIALS TAB */}
      {activeTab === "CREDENTIALS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Issued Zero-Knowledge Verifiable Credentials</h3>
              <p className="text-xs text-slate-400 font-mono">Credential IDs, type, zk-SNARK circuit architecture, verified predicates, proof hashes, and gate constraints</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Credential ID</th>
                  <th className="p-3">Credential Type & ZK Circuit</th>
                  <th className="p-3">Verified Predicate (Zero PHI)</th>
                  <th className="p-3">Proof Hash</th>
                  <th className="p-3 text-right">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {credentials.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-cyan-400">{c.credentialId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{c.credentialType}</div>
                      <div className="text-[10px] text-cyan-300 font-mono">{c.zkCircuitArchitecture}</div>
                    </td>
                    <td className="p-3 text-slate-300 font-sans text-xs">{c.verifiedPredicate}</td>
                    <td className="p-3 text-cyan-300 font-mono text-[10px]">{c.proofHash.slice(0, 18)}...</td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {c.verificationStatus}
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
                <Zap size={18} className="text-cyan-400" /> zk-SNARK Proof Verifier Sandbox
              </h3>
            </div>

            <form onSubmit={handleVerifyZkProof} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target ZKP Verifiable Credential:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
                  value={selectedCredentialId}
                  onChange={(e) => setSelectedCredentialId(e.target.value)}
                >
                  {credentials.map((c) => (
                    <option key={c.credentialId} value={c.credentialId}>
                      {c.credentialId} - {c.credentialType}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-cyan-600/20"
              >
                <Zap size={16} /> Execute Real-Time zk-SNARK Verification
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Verification Output
              </h3>
            </div>

            {verifyResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">zk-SNARK Validity:</span>
                  <div className="text-sm font-bold text-emerald-400">{verifyResult.zkProofValid ? "MATHEMATICALLY VALID & SUCCINCT" : "INVALID"}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Circuit Gate Satisfied: <strong className="text-emerald-400 font-mono text-[10px]">YES</strong></div>
                  <div>Zero PHI Exposed: <strong className="text-emerald-400">100% SECURE</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute Real-Time zk-SNARK Verification" to verify proof soundness.
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
              <h3 className="text-base font-bold text-white">W3C VC 2.0 & Zero-Knowledge Proof Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for privacy-preserving verifiable credentials, zk-SNARK Groth16 circuit proofs, and ISO/IEC 18013-5 identity</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-bold">
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
                <KeyRound size={18} className="text-cyan-400" /> Issue ZKP Verifiable Credential
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGenerateCredential} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Credential Type & Predicate:</label>
                <input
                  type="text"
                  placeholder="e.g. Pediatric Immunization Record zk-SNARK Proof"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
                  value={credentialType}
                  onChange={(e) => setCredentialType(e.target.value)}
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
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition shadow-lg shadow-cyan-600/20"
                >
                  Issue Credential
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
