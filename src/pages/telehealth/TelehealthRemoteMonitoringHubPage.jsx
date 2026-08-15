import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Activity,
  Heart,
  Thermometer,
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
  Radio,
  FileText,
  Clock,
  Pill,
  UserCheck,
  Stethoscope,
  TrendingUp,
  Volume2,
  Calendar,
  MessageSquare,
  Share2,
  Lock,
  Wifi,
  Smartphone,
  ChevronRight,
  ShieldAlert,
  Download,
  Key,
  FileCheck
} from "lucide-react";

/**
 * TelehealthRemoteMonitoringHubPage Component
 *
 * High-Assurance Telehealth Virtual Care & Remote Patient Monitoring (RPM) Station.
 * Enforces WebRTC End-to-End Encryption, Cellular RPM Telemetry (CGM, Smart Patch ECG, SpO2),
 * Automated Biometric Anomaly Detection, E-Prescribing, and HIPAA Virtual Visit Governance.
 */
export default function TelehealthRemoteMonitoringHubPage() {
  // Active Telehealth Patients & RPM Wearables
  const [rpmPatients, setRpmPatients] = useState([
    {
      patientId: "RPM-PAT-8810",
      patientName: "Eleanor Vance (Age 64)",
      condition: "Type 2 Diabetes & Stage 2 Hypertension",
      wearablesConnected: ["Dexcom G7 CGM", "Omron Cellular BP Cuff"],
      telemetry: {
        glucoseMgDl: 168,
        glucoseTrend: "RISING_SLOWLY",
        bloodPressure: "142/90",
        heartRate: 78,
        spO2: 97
      },
      lastSync: "3 Mins Ago (Cellular 5G)",
      riskLevel: "MODERATE_ALERT",
      scheduledConsultation: "Today at 02:30 PM",
      assignedPhysician: "Dr. Marcus Vance, MD",
      eConsentSigned: "VERIFIED_DIGITAL_SIG_2026-08-01"
    },
    {
      patientId: "RPM-PAT-8811",
      patientName: "Robert Harrison (Age 72)",
      condition: "Congestive Heart Failure (NYHA Class II)",
      wearablesConnected: ["Smart Patch 12-Lead ECG", "Cellular Weight Scale"],
      telemetry: {
        glucoseMgDl: 105,
        glucoseTrend: "STABLE",
        bloodPressure: "128/82",
        heartRate: 92,
        spO2: 93,
        weightDeltaLbs: "+3.2 lbs (Fluid Retention Alert)"
      },
      lastSync: "1 Min Ago (Bluetooth Gateway)",
      riskLevel: "HIGH_ALERT",
      scheduledConsultation: "IMMEDIATE_WEBRTC_CALL",
      assignedPhysician: "Dr. Robert Chen, MD",
      eConsentSigned: "VERIFIED_DIGITAL_SIG_2026-08-10"
    },
    {
      patientId: "RPM-PAT-8812",
      patientName: "Sarah Jenkins (Age 45)",
      condition: "Post-Operative Cardiac Rehabilitation",
      wearablesConnected: ["Continuous Pulse Oximeter", "Apple HealthKit Gateway"],
      telemetry: {
        glucoseMgDl: 98,
        glucoseTrend: "STABLE",
        bloodPressure: "118/76",
        heartRate: 68,
        spO2: 99
      },
      lastSync: "Just Now",
      riskLevel: "NORMAL_STABLE",
      scheduledConsultation: "Tomorrow at 10:00 AM",
      assignedPhysician: "Dr. Amanda Blake, MD",
      eConsentSigned: "VERIFIED_DIGITAL_SIG_2026-07-29"
    }
  ]);

  const [activeTab, setActiveTab] = useState("RPM_OVERWATCH"); 
  // "RPM_OVERWATCH" | "WEBRTC_SANDBOX" | "E_PRESCRIBING" | "HIPAA_CONSENT"

  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [activeCall, setActiveCall] = useState(null);

  // WebRTC Call Controls
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState("");

  // E-Prescribing State
  const [rxForm, setRxForm] = useState({
    patientId: "RPM-PAT-8810",
    medication: "Metformin 500mg ER",
    dosage: "Take 1 tablet daily with evening meal",
    refills: 3,
    pharmacy: "CVS Pharmacy #4892 (e-Prescribe Direct)"
  });

  // HIPAA Consent Log State
  const [eConsentAudits, setEConsentAudits] = useState([
    {
      consentId: "ECONSENT-9901",
      patientName: "Eleanor Vance",
      signedDate: "2026-08-01 14:22 UTC",
      ipAddress: "172.56.42.109",
      consentType: "TELEHEALTH_VIDEO_RPM_MONITORING_AGREEMENT",
      encryptionStatus: "SHA-256_RSA_4096_VERIFIED"
    },
    {
      consentId: "ECONSENT-9902",
      patientName: "Robert Harrison",
      signedDate: "2026-08-10 09:15 UTC",
      ipAddress: "73.120.88.14",
      consentType: "TELEHEALTH_VIDEO_RPM_MONITORING_AGREEMENT",
      encryptionStatus: "SHA-256_RSA_4096_VERIFIED"
    }
  ]);

  const handleStartCall = (patient) => {
    setActiveCall(patient);
    setActiveTab("WEBRTC_SANDBOX");
    setNotification({
      type: "info",
      message: `WebRTC Encrypted Telehealth Session initialized with ${patient.patientName}.`
    });
  };

  const handleEndCall = () => {
    setActiveCall(null);
    setNotification({
      type: "success",
      message: "Telehealth Video Consultation ended and encrypted EHR notes saved."
    });
  };

  const handleSendPrescription = (e) => {
    e.preventDefault();
    if (!rxForm.medication.trim()) return;

    setNotification({
      type: "success",
      message: `Electronic Prescription for '${rxForm.medication}' transmitted to ${rxForm.pharmacy}!`
    });
  };

  // Filtered Patients List
  const filteredPatients = useMemo(() => {
    return rpmPatients.filter(
      (p) =>
        p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.condition.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rpmPatients, searchTerm]);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 space-y-6">
      
      {/* 1. Page Header */}
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Video size={13} className="animate-pulse" /> TELEHEALTH & RPM COMMAND
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1">
                <ShieldCheck size={13} /> WEBRTC E2EE ENCRYPTED
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Telehealth Virtual Care & Remote Patient Monitoring (RPM) Hub
            </h1>
            <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
              Real-time telehealth command center connecting WebRTC virtual consultations with continuous cellular RPM telemetry (CGMs, Smart ECG Patches, Blood Pressure Monitors), automated biometric anomaly triage, and direct E-Prescribing.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab("WEBRTC_SANDBOX")}
              className="w-full lg:w-auto px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2"
            >
              <Video size={16} /> Open WebRTC Console
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
            { id: "RPM_OVERWATCH", label: "RPM Wearable Telemetry", icon: Smartphone },
            { id: "WEBRTC_SANDBOX", label: "WebRTC Virtual Consultation", icon: Video },
            { id: "E_PRESCRIBING", label: "E-Prescribing Module", icon: Pill },
            { id: "HIPAA_CONSENT", label: "HIPAA e-Consent Ledger", icon: FileCheck }
          ].map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <IconComp size={15} /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 w-full md:w-auto justify-end">
          <div>Active Patients Monitored: <strong className="text-cyan-400">1,240 Wearables</strong></div>
          <div>5G Cellular Uptime: <strong className="text-emerald-400">99.98%</strong></div>
        </div>
      </div>

      {/* 3. TAB CONTENT: RPM OVERWATCH */}
      {activeTab === "RPM_OVERWATCH" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search patient ID, name, or condition..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="text-slate-400 font-mono">
              Live Biometric Feeds: <strong className="text-white">Continuous Sync</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredPatients.map((p) => (
              <div
                key={p.patientId}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl hover:border-cyan-500/40 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 text-[11px] font-bold font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                      {p.patientId}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                        p.riskLevel.includes("HIGH")
                          ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse"
                          : p.riskLevel.includes("MODERATE")
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {p.riskLevel}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white font-mono">{p.patientName}</h3>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">{p.condition}</p>
                  </div>

                  {/* Telemetry Panel */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs font-mono">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Glucose (CGM):</span>
                      <strong className="text-cyan-300 font-bold">{p.telemetry.glucoseMgDl} mg/dL ({p.telemetry.glucoseTrend})</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Blood Pressure:</span>
                      <strong className="text-purple-300">{p.telemetry.bloodPressure} mmHg</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Heart Rate / SpO2:</span>
                      <strong className="text-emerald-400">{p.telemetry.heartRate} bpm / {p.telemetry.spO2}%</strong>
                    </div>
                    {p.telemetry.weightDeltaLbs && (
                      <div className="text-amber-400 text-[11px] pt-1 border-t border-slate-800">
                        ⚠️ {p.telemetry.weightDeltaLbs}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 text-xs font-mono text-slate-400">
                    <div>Wearables: <span className="text-slate-300">{p.wearablesConnected.join(", ")}</span></div>
                    <div>Last Sync: <span className="text-slate-300">{p.lastSync}</span></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartCall(p)}
                    className="flex-1 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Video size={13} /> Start WebRTC Call
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: WEBRTC SANDBOX */}
      {activeTab === "WEBRTC_SANDBOX" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Video size={18} className="text-cyan-400" /> WebRTC Telehealth Video Consultation Console
              </h3>
              <span className="px-3 py-1 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full font-bold flex items-center gap-1.5">
                <Lock size={13} /> DTLS-SRTP 256-BIT ENCRYPTED STREAM
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Video Stream Container */}
              <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl h-96 relative overflow-hidden flex flex-col items-center justify-center">
                {videoOff ? (
                  <div className="text-slate-500 flex flex-col items-center space-y-2">
                    <VideoOff size={48} />
                    <span className="text-xs font-mono">Camera Feed Muted</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-cyan-500/5 flex flex-col items-center justify-center space-y-3">
                    <div className="w-24 h-24 rounded-full bg-cyan-500/20 border-2 border-cyan-500 flex items-center justify-center text-cyan-300 font-bold text-xl animate-pulse">
                      {activeCall ? activeCall.patientName.charAt(0) : "MD"}
                    </div>
                    <span className="text-sm font-bold text-white font-mono">
                      {activeCall ? `In Call with ${activeCall.patientName}` : "WebRTC Stream Ready - Select Patient"}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Resolution: 1080p 60fps • Latency: 14ms</span>
                  </div>
                )}

                {/* Call Control Overlay Bar */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2.5 flex items-center gap-4 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => setMicMuted(!micMuted)}
                    className={`p-3 rounded-xl transition ${micMuted ? "bg-red-500/20 text-red-400" : "bg-slate-800 text-white hover:bg-slate-700"}`}
                  >
                    {micMuted ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setVideoOff(!videoOff)}
                    className={`p-3 rounded-xl transition ${videoOff ? "bg-red-500/20 text-red-400" : "bg-slate-800 text-white hover:bg-slate-700"}`}
                  >
                    {videoOff ? <VideoOff size={16} /> : <Video size={16} />}
                  </button>

                  {activeCall && (
                    <button
                      type="button"
                      onClick={handleEndCall}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
                    >
                      <PhoneOff size={15} /> End Visit
                    </button>
                  )}
                </div>
              </div>

              {/* Consultation Notes Sidebar */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 font-sans">
                <h4 className="text-xs font-bold text-white font-mono uppercase">EHR Encounter Documentation</h4>
                <textarea
                  rows={10}
                  placeholder="Record subjective clinical findings, objective RPM biometrics, assessment, and treatment plan (SOAP format)..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setNotification({
                      type: "success",
                      message: "SOAP Encounter note saved & cryptographically signed into patient EHR record!"
                    })
                  }
                  className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs transition"
                >
                  Sign & File SOAP Encounter Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: E-PRESCRIBING */}
      {activeTab === "E_PRESCRIBING" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Pill size={18} className="text-cyan-400" /> Electronic Prescription (e-Rx) Transmission Portal
            </h3>

            <form onSubmit={handleSendPrescription} className="space-y-4 text-xs font-sans max-w-xl">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Select Patient</label>
                <select
                  value={rxForm.patientId}
                  onChange={(e) => setRxForm({ ...rxForm, patientId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {rpmPatients.map((p) => (
                    <option key={p.patientId} value={p.patientId}>
                      {p.patientName} ({p.patientId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Medication Name & Strength</label>
                <input
                  type="text"
                  value={rxForm.medication}
                  onChange={(e) => setRxForm({ ...rxForm, medication: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Sig / Dosage Instructions</label>
                <input
                  type="text"
                  value={rxForm.dosage}
                  onChange={(e) => setRxForm({ ...rxForm, dosage: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Destination Pharmacy (Surescripts Network)</label>
                <input
                  type="text"
                  value={rxForm.pharmacy}
                  onChange={(e) => setRxForm({ ...rxForm, pharmacy: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs transition shadow-lg shadow-cyan-600/20"
                >
                  Transmit e-Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT: HIPAA e-CONSENT LEDGER */}
      {activeTab === "HIPAA_CONSENT" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
              <FileCheck size={18} className="text-emerald-400" /> HIPAA Digital e-Consent Cryptographic Audit Ledger
            </h3>

            <div className="space-y-3 font-mono text-xs">
              {eConsentAudits.map((item) => (
                <div key={item.consentId} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-cyan-400 font-bold">{item.consentId}</span>
                      <span className="text-white font-bold font-sans">{item.patientName}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] font-sans">{item.consentType}</p>
                  </div>

                  <div className="flex items-center gap-4 text-slate-400 text-[11px]">
                    <div>Signed: <span className="text-slate-200">{item.signedDate}</span></div>
                    <div>IP: <span className="text-slate-200">{item.ipAddress}</span></div>
                    <span className="px-2 py-0.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded font-bold">
                      {item.encryptionStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
