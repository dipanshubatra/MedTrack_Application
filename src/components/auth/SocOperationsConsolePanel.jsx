import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldAlert,
  Radio,
  Activity,
  Server,
  Cloud,
  Terminal,
  Zap,
  Globe,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  Search,
  Download,
  Filter,
  Layers,
  ChevronRight,
  Eye,
  Sliders,
  Database,
  Cpu,
  ArrowUpRight,
  X,
  FileCode,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import "../../pages/auth/auth.css";

/**
 * SocOperationsConsolePanel Component
 *
 * High-Assurance Next-Gen Security Operations Center (SOC) Unified Command Console.
 * Integrates SIEM Log Correlation, CSPM Multi-Cloud Posture, CTI Threat Feeds, and SOAR Containment Playbooks.
 * Enforces NIST SP 800-61 Rev. 2, ISO/IEC 27035:2023, and CIS Benchmarks.
 */
export default function SocOperationsConsolePanel() {
  // State
  const [activeTab, setActiveTab] = useState("OVERVIEW"); // "OVERVIEW" | "SIEM" | "CSPM" | "CTI" | "SOAR"
  const [liveStreaming, setLiveStreaming] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [inspectModal, setInspectModal] = useState(null);
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResult, setLookupResult] = useState(null);

  // SIEM Alerts Stream State
  const [alerts, setAlerts] = useState([
    {
      id: "ALERT-90812",
      ruleName: "BRUTE_FORCE_SSH_ATTACK",
      severity: "CRITICAL",
      affectedHost: "198.51.100.45",
      affectedUser: "root",
      matchedCount: 14,
      status: "OPEN",
      timestamp: new Date().toISOString(),
      details: "Multiple failed authentication attempts detected within 3 minute window across edge gateway."
    },
    {
      id: "ALERT-87103",
      ruleName: "EXFILTRATION_PATIENT_RECORDS",
      severity: "HIGH",
      affectedHost: "s3://medtrack-patient-vault",
      affectedUser: "service_account_sync",
      matchedCount: 8,
      status: "ACKNOWLEDGED",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      details: "High volume data access anomaly detected from unrecognized IP block 203.0.113.88."
    },
    {
      id: "ALERT-65109",
      ruleName: "UNAUTHORIZED_PAM_ELEVATION",
      severity: "CRITICAL",
      affectedHost: "prod-db-cluster-01",
      affectedUser: "dr_smith_admin",
      matchedCount: 3,
      status: "RESOLVED",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      details: "JIT privilege elevation request approved without valid emergency ticket correlation."
    }
  ]);

  // CSPM Misconfigurations State
  const [cspmFindings, setCspmFindings] = useState([
    {
      findingId: "CSPM-90102",
      accountNumber: "AWS-19203910",
      resourceId: "s3://medtrack-patient-vault",
      resourceType: "S3_BUCKET",
      severity: "CRITICAL",
      benchmark: "HIPAA_CLOUD_SECURITY",
      description: "Public read access enabled on patient data storage bucket",
      status: "OPEN",
      remediationCommand: "aws s3api put-public-access-block --bucket medtrack-patient-vault --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
    },
    {
      findingId: "CSPM-87105",
      accountNumber: "AWS-19203910",
      resourceId: "arn:aws:iam::19203910:role/AdminRole",
      resourceType: "IAM_ROLE",
      severity: "HIGH",
      benchmark: "CIS_AWS_FOUNDATIONS_1_5",
      description: "Wildcard IAM AdministratorAccess policy attached to worker node role",
      status: "OPEN",
      remediationCommand: "aws iam detach-role-policy --role-name AdminRole --policy-arn arn:aws:iam::aws:policy/AdministratorAccess"
    },
    {
      findingId: "CSPM-63101",
      accountNumber: "AZURE-TENANT-88192",
      resourceId: "/subscriptions/88192/resourceGroups/rg-ehr/providers/Microsoft.Sql/servers/sql-ehr-prod",
      resourceType: "AZURE_SQL",
      severity: "CRITICAL",
      benchmark: "CIS_AZURE_SECURITY_3_0",
      description: "Transparent Data Encryption (TDE) disabled on Azure SQL instance",
      status: "REMEDIATED",
      remediationCommand: "az sql db tde set --status Enabled --database ehr-db --server sql-ehr-prod --resource-group rg-ehr"
    }
  ]);

  // CTI Threat Indicators State
  const [ctiIndicators, setCtiIndicators] = useState([
    { value: "198.51.100.45", type: "IP_ADDRESS", category: "MALWARE_C2", confidence: 95, status: "ACTIVE" },
    { value: "bad-malware-domain.org", type: "DOMAIN_NAME", category: "PHISHING", confidence: 88, status: "ACTIVE" },
    { value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", type: "FILE_HASH_SHA256", category: "RANSOMWARE", confidence: 99, status: "BLOCKED" },
    { value: "203.0.113.88", type: "IP_ADDRESS", category: "EXFILTRATION_ENDPOINT", confidence: 92, status: "ACTIVE" }
  ]);

  // SOAR Playbooks State
  const [playbooks, setPlaybooks] = useState([
    { id: "PB-01", name: "AUTOMATED_RANSOMWARE_ISOLATION", trigger: "MALWARE_DETECTION", status: "READY", executions: 12, lastRun: "2 hours ago" },
    { id: "PB-02", name: "TOKEN_REVOCATION_BURST_MITIGATION", trigger: "AUTH_ANOMALY", status: "READY", executions: 34, lastRun: "10 mins ago" },
    { id: "PB-03", name: "CONTAINER_EBPF_NETWORK_QUARANTINE", trigger: "POD_ESCAPE", status: "READY", executions: 5, lastRun: "1 day ago" }
  ]);

  // Live Pulse Simulation
  useEffect(() => {
    if (!liveStreaming) return;
    const interval = setInterval(() => {
      const sampleAlert = {
        id: `ALERT-${Math.floor(10000 + Math.random() * 90000)}`,
        ruleName: "ANOMALOUS_GEO_LOGIN_BURST",
        severity: Math.random() > 0.5 ? "HIGH" : "MEDIUM",
        affectedHost: "api-gateway-node-03",
        affectedUser: `user_doc_${Math.floor(Math.random() * 100)}`,
        matchedCount: Math.floor(Math.random() * 10) + 1,
        status: "OPEN",
        timestamp: new Date().toISOString(),
        details: "Concurrent login detected from two geographically distant IP endpoints within 15 seconds."
      };
      setAlerts((prev) => [sampleAlert, ...prev.slice(0, 14)]);
    }, 10000);

    return () => clearInterval(interval);
  }, [liveStreaming]);

  // Triage Alert Action
  const handleTriageAlert = (alertId, newStatus) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: newStatus } : a))
    );
    setNotification({
      type: "success",
      message: `Alert ${alertId} status updated to ${newStatus}.`
    });
  };

  // Remediate CSPM Finding Action
  const handleRemediateCspm = (findingId) => {
    setCspmFindings((prev) =>
      prev.map((f) => (f.findingId === findingId ? { ...f, status: "REMEDIATED" } : f))
    );
    setNotification({
      type: "success",
      message: `CSPM Finding ${findingId} remediated successfully.`
    });
  };

  // Run SOAR Playbook Action
  const handleRunPlaybook = (playbookName) => {
    setNotification({
      type: "success",
      message: `SOAR Playbook '${playbookName}' triggered. Containment active across cluster.`
    });
  };

  // CTI Lookup Handler
  const handlePerformLookup = (e) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    const found = ctiIndicators.find((i) => i.value.toLowerCase() === lookupQuery.trim().toLowerCase());
    if (found) {
      setLookupResult({
        found: true,
        indicator: found,
        risk: found.confidence >= 90 ? "CRITICAL" : "HIGH"
      });
    } else {
      setLookupResult({
        found: false,
        query: lookupQuery,
        risk: "CLEAN"
      });
    }
  };

  // Filtered SIEM Alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const matchSearch =
        a.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.affectedHost.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.affectedUser.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSev = selectedSeverity === "ALL" || a.severity === selectedSeverity;
      return matchSearch && matchSev;
    });
  }, [alerts, searchTerm, selectedSeverity]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Radio size={12} className="animate-pulse" /> SOC UNIFIED HUB
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1">
                <ShieldCheck size={12} /> NIST SP 800-61 / ISO 27035
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Security Operations Center (SOC) Command Console
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Unified cross-subsystem security telemetry dashboard orchestrating real-time SIEM log correlation, CSPM continuous posture assessment, CTI threat intelligence feeds, and SOAR containment playbooks.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2 font-mono">
            <div className="flex items-center justify-between gap-6">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">Threat Level</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> ELEVATED (DEFCON 3)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 text-[11px]">
              <div>Open Alerts: <strong className="text-amber-400">{alerts.filter(a => a.status === 'OPEN').length}</strong></div>
              <div>CSPM Posture: <strong className="text-sky-400">92.5%</strong></div>
              <div>CTI IOCs: <strong className="text-purple-300">{ctiIndicators.length} Active</strong></div>
              <div>SOAR Playbooks: <strong className="text-emerald-400">{playbooks.length} Ready</strong></div>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {notification.message && (
          <div className="mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} />
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification({ type: "", message: "" })}
              className="text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {[
            { id: "OVERVIEW", label: "Executive Overview", icon: Activity },
            { id: "SIEM", label: "SIEM Log Correlation", icon: ShieldAlert },
            { id: "CSPM", label: "CSPM Cloud Posture", icon: Cloud },
            { id: "CTI", label: "Threat Intelligence", icon: Globe },
            { id: "SOAR", label: "SOAR Playbooks", icon: Zap }
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <IconComponent size={15} /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setLiveStreaming(!liveStreaming)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              liveStreaming
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            {liveStreaming ? <Pause size={13} /> : <Play size={13} />}
            {liveStreaming ? "Live Feeds Active" : "Feeds Paused"}
          </button>
        </div>
      </div>

      {/* 3. TAB CONTENT: OVERVIEW */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          {/* Key Metrics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider">SIEM Events Logged</span>
                <ShieldAlert size={16} className="text-sky-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">1.48M</div>
              <p className="text-[11px] text-emerald-400 font-medium">↑ 12% vs last 24h average</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider">Cloud Health Posture</span>
                <Cloud size={16} className="text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">92.5%</div>
              <p className="text-[11px] text-sky-400 font-medium">CIS AWS & Azure Compliant</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider">Active Threat IOCs</span>
                <Globe size={16} className="text-purple-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">4 Active</div>
              <p className="text-[11px] text-purple-300 font-medium">STIX 2.1 Feed Connected</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider">Auto-Playbooks Run</span>
                <Zap size={16} className="text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">51 Triggered</div>
              <p className="text-[11px] text-amber-300 font-medium">Avg containment &lt; 2.4s</p>
            </div>
          </div>

          {/* Cross-Subsystem Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* SIEM Recent Fired Alerts */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert size={18} className="text-sky-400" /> SIEM High-Priority Alerts
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab("SIEM")}
                  className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1"
                >
                  View All ({alerts.length}) <ChevronRight size={14} />
                </button>
              </div>

              <div className="space-y-3">
                {alerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono">{alert.id}</span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            alert.severity === "CRITICAL"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-slate-300 font-sans">{alert.ruleName}</p>
                      <span className="text-slate-500 text-[11px] font-mono">Host: {alert.affectedHost}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setInspectModal(alert)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-xs"
                    >
                      Details
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* CSPM Open Misconfigurations */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Cloud size={18} className="text-emerald-400" /> CSPM Cloud Misconfigurations
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab("CSPM")}
                  className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
                >
                  View All ({cspmFindings.length}) <ChevronRight size={14} />
                </button>
              </div>

              <div className="space-y-3">
                {cspmFindings.map((finding) => (
                  <div
                    key={finding.findingId}
                    className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono">{finding.findingId}</span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            finding.status === "REMEDIATED"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {finding.status}
                        </span>
                      </div>
                      <p className="text-slate-300 font-sans">{finding.description}</p>
                      <span className="text-slate-500 text-[11px] font-mono">Account: {finding.accountNumber}</span>
                    </div>

                    {finding.status === "OPEN" && (
                      <button
                        type="button"
                        onClick={() => handleRemediateCspm(finding.findingId)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs whitespace-nowrap"
                      >
                        Fix Now
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: SIEM */}
      {activeTab === "SIEM" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search rule name, host, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Filter Severity:</span>
              {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-3 py-1 rounded-xl font-bold transition ${
                    selectedSeverity === sev ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">Alert ID</th>
                    <th className="p-4">Severity</th>
                    <th className="p-4">Rule Name</th>
                    <th className="p-4">Affected Host</th>
                    <th className="p-4">Affected User</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Analyst Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAlerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-bold text-sky-400">{alert.id}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                            alert.severity === "CRITICAL"
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </td>
                      <td className="p-4 text-white font-bold font-sans">{alert.ruleName}</td>
                      <td className="p-4 text-purple-300">{alert.affectedHost}</td>
                      <td className="p-4 text-slate-300">{alert.affectedUser}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            alert.status === "OPEN"
                              ? "bg-red-500/20 text-red-400"
                              : alert.status === "ACKNOWLEDGED"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {alert.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {alert.status === "OPEN" && (
                          <button
                            type="button"
                            onClick={() => handleTriageAlert(alert.id, "ACKNOWLEDGED")}
                            className="px-2.5 py-1 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-sans font-bold hover:bg-amber-600/30"
                          >
                            Acknowledge
                          </button>
                        )}
                        {alert.status !== "RESOLVED" && (
                          <button
                            type="button"
                            onClick={() => handleTriageAlert(alert.id, "RESOLVED")}
                            className="px-2.5 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-sans font-bold hover:bg-emerald-600/30"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: CTI */}
      {activeTab === "CTI" && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Search size={18} className="text-purple-400" /> CTI Threat Indicator Reputation Lookup
            </h3>
            <form onSubmit={handlePerformLookup} className="flex gap-3">
              <input
                type="text"
                placeholder="Enter IP address, domain, or SHA256 file hash..."
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs transition"
              >
                Query Threat DB
              </button>
            </form>

            {lookupResult && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-2 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Query Target:</span>
                  <strong className="text-white">{lookupResult.query || lookupResult.indicator?.value}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Threat Status:</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${lookupResult.found ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {lookupResult.found ? `MATCH FOUND (${lookupResult.indicator.category})` : "NO MATCH (CLEAN)"}
                  </span>
                </div>
                {lookupResult.found && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Confidence Score:</span>
                    <strong className="text-purple-400">{lookupResult.indicator.confidence}% Confidence</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT: SOAR */}
      {activeTab === "SOAR" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Zap size={18} className="text-amber-400" /> SOAR Automated Containment Playbooks
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {playbooks.map((pb) => (
              <div key={pb.id} className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-sky-400 font-bold">{pb.id}</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400">
                    {pb.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">{pb.name}</h4>
                <p className="text-[11px] text-slate-400">Trigger: {pb.trigger}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                  <span>Executions: {pb.executions}</span>
                  <button
                    type="button"
                    onClick={() => handleRunPlaybook(pb.name)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-sans font-bold text-xs"
                  >
                    Execute
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inspect Modal */}
      {inspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">{inspectModal.id} - Details</h3>
              <button type="button" onClick={() => setInspectModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{inspectModal.details}</p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs"
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
