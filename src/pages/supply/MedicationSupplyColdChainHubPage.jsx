import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Thermometer,
  Package,
  Truck,
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
  Barcode,
  Radio,
  FileText,
  Clock,
  Box,
  Cpu,
  CheckSquare,
  ShieldAlert,
  Calendar,
  Building,
  ArrowUpRight
} from "lucide-react";

/**
 * MedicationSupplyColdChainHubPage Component
 *
 * High-Assurance Pharmaceutical Supply Chain Cold-Chain Sensor & Inventory Hub.
 * Enforces FDA Drug Supply Chain Security Act (DSCSA), GS1 DataMatrix Tracking,
 * Ultra-Low (-80°C) Freezer Telemetry, Chain-of-Custody Provenance, and Automated Temperature Excursion Escalations.
 */
export default function MedicationSupplyColdChainHubPage() {
  // Inventory Batches State
  const [batches, setBatches] = useState([
    {
      batchId: "DSCSA-LOT-99201",
      drugName: "Comirnaty mRNA COVID-19 Vaccine (-80°C Vault)",
      category: "BIOLOGIC_mRNA",
      quantityUnits: 4500,
      storageZone: "ULTRA_LOW_FREEZER_ALPHA (-78.4°C)",
      targetTemperatureRange: "-90°C to -60°C",
      currentTemp: "-78.4 °C",
      humidity: "42%",
      chainOfCustodyStatus: "VERIFIED_SECURE_FDA_DSCSA",
      expirationDate: "2027-03-15",
      manufacturer: "Pfizer-BioNTech Bio-Logistics",
      lastTelemetryTimestamp: "2026-08-15T01:25:00Z"
    },
    {
      batchId: "DSCSA-LOT-88104",
      batchName: "Human Albumin 20% Infusion Solution",
      drugName: "Human Serum Albumin (Blood Product)",
      category: "BLOOD_PRODUCT",
      quantityUnits: 820,
      storageZone: "COLD_REFRIGERATION_BETA (4.2°C)",
      targetTemperatureRange: "2°C to 8°C",
      currentTemp: "4.2 °C",
      humidity: "55%",
      chainOfCustodyStatus: "VERIFIED_SECURE_FDA_DSCSA",
      expirationDate: "2026-11-30",
      manufacturer: "Grifols Therapeutics Ltd",
      lastTelemetryTimestamp: "2026-08-15T01:20:00Z"
    },
    {
      batchId: "DSCSA-LOT-77409",
      drugName: "Pembrolizumab (Keytruda) Oncology Monoclonal Antibody",
      category: "ONCOLOGY_BIOLOGIC",
      quantityUnits: 150,
      storageZone: "COLD_REFRIGERATION_GAMMA (5.8°C)",
      targetTemperatureRange: "2°C to 8°C",
      currentTemp: "9.1 °C (TEMP EXCURSION WARNING)",
      humidity: "61%",
      chainOfCustodyStatus: "EXCURSION_ALARM_ESCALATED",
      expirationDate: "2027-01-20",
      manufacturer: "Merck Sharp & Dohme Corp",
      lastTelemetryTimestamp: "2026-08-15T01:10:00Z"
    }
  ]);

  const [activeTab, setActiveTab] = useState("COLD_CHAIN_MONITOR"); // "COLD_CHAIN_MONITOR" | "GS1_SCANNER" | "DSCSA_PROVENANCE"
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [addBatchModalOpen, setAddBatchModalOpen] = useState(false);
  const [inspectBatch, setInspectBatch] = useState(null);

  // Scanner Simulator State
  const [scanInput, setScanInput] = useState("");
  const [scannedResult, setScannedResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  // Form State
  const [batchForm, setBatchForm] = useState({
    batchId: "DSCSA-LOT-10492",
    drugName: "",
    category: "BIOLOGIC_mRNA",
    quantityUnits: 1000,
    storageZone: "ULTRA_LOW_FREEZER_ALPHA (-80°C)",
    manufacturer: "Moderna Biotech Logistics"
  });

  // GS1 DataMatrix Scan Handler
  const handleGS1Scan = (e) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    setScanning(true);

    setTimeout(() => {
      setScannedResult({
        gs1DataMatrixRaw: scanInput.trim(),
        gtinParsed: "00300450412019",
        serialNumber: "SN-94021094",
        lotNumber: "LOT-99201",
        expirationDateParsed: "2027-03-15",
        dscsaVerification: "VERIFIED_AUTHENTIC_MANUFACTURER_SIGNED",
        integrityHash: "0x8f3a9d21c4e719b02a"
      });
      setScanning(false);
    }, 600);
  };

  // Add Batch Handler
  const handleAddBatch = (e) => {
    e.preventDefault();
    if (!batchForm.drugName.trim()) {
      setNotification({ type: "error", message: "Drug / Biologic name is required." });
      return;
    }

    const newBatch = {
      batchId: batchForm.batchId,
      drugName: batchForm.drugName.trim(),
      category: batchForm.category,
      quantityUnits: parseInt(batchForm.quantityUnits, 10) || 500,
      storageZone: batchForm.storageZone,
      targetTemperatureRange: "-90°C to -60°C",
      currentTemp: "-78.9 °C",
      humidity: "40%",
      chainOfCustodyStatus: "VERIFIED_SECURE_FDA_DSCSA",
      expirationDate: "2027-06-30",
      manufacturer: batchForm.manufacturer,
      lastTelemetryTimestamp: "2026-08-15T01:30:00Z"
    };

    setBatches((prev) => [newBatch, ...prev]);
    setAddBatchModalOpen(false);
    setNotification({
      type: "success",
      message: `Biologic Batch '${newBatch.drugName}' registered into Cold-Chain Storage!`
    });
  };

  // Acknowledge Excursion Handler
  const handleAcknowledgeExcursion = (batchId) => {
    setBatches((prev) =>
      prev.map((b) =>
        b.batchId === batchId
          ? {
              ...b,
              currentTemp: "4.8 °C (STABILIZED)",
              chainOfCustodyStatus: "VERIFIED_SECURE_FDA_DSCSA"
            }
          : b
      )
    );
    setNotification({
      type: "success",
      message: `Temperature excursion resolved for batch ${batchId}. Storage zone stabilized.`
    });
  };

  // Filtered Batches List
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const matchSearch =
        b.drugName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat =
        categoryFilter === "ALL" ||
        (categoryFilter === "BIOLOGIC" && b.category.includes("BIOLOGIC")) ||
        (categoryFilter === "BLOOD" && b.category.includes("BLOOD")) ||
        (categoryFilter === "ONCOLOGY" && b.category.includes("ONCOLOGY"));
      return matchSearch && matchCat;
    });
  }, [batches, searchTerm, categoryFilter]);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 space-y-6">
      
      {/* 1. Page Header */}
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Thermometer size={13} className="animate-pulse" /> COLD-CHAIN TELEMETRY HUB
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1">
                <ShieldCheck size={13} /> FDA DSCSA COMPLIANT
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Pharmaceutical Supply Chain & Ultra-Low Cold-Chain Hub
            </h1>
            <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
              Real-time IoT environmental sensor monitoring for -80°C ultra-low freezers, biologics, blood products, GS1 DataMatrix barcode parsing, and FDA Drug Supply Chain Security Act (DSCSA) electronic serialization.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setAddBatchModalOpen(true)}
              className="w-full lg:w-auto px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Register Biologic Batch
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
            { id: "COLD_CHAIN_MONITOR", label: "Cold-Chain Telemetry", icon: Thermometer },
            { id: "GS1_SCANNER", label: "GS1 DataMatrix Scanner", icon: Barcode },
            { id: "DSCSA_PROVENANCE", label: "FDA DSCSA Chain of Custody", icon: Package }
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
          <div>Storage Freezers: <strong className="text-emerald-400">4 ONLINE (-80°C OK)</strong></div>
          <div>Total Doses Tracked: <strong className="text-white">5,470 Units</strong></div>
        </div>
      </div>

      {/* 3. TAB CONTENT: COLD CHAIN MONITOR */}
      {activeTab === "COLD_CHAIN_MONITOR" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search lot ID, drug name, or manufacturer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Filter Biologic Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="ALL">ALL CATEGORIES</option>
                <option value="BIOLOGIC">mRNA BIOLOGIC</option>
                <option value="BLOOD">BLOOD PRODUCTS</option>
                <option value="ONCOLOGY">ONCOLOGY</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBatches.map((b) => (
              <div
                key={b.batchId}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl hover:border-cyan-500/40 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 text-[11px] font-bold font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                      {b.batchId}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                        b.chainOfCustodyStatus.includes("EXCURSION")
                          ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse"
                          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {b.chainOfCustodyStatus}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white font-mono truncate">{b.drugName}</h3>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">{b.manufacturer}</p>
                  </div>

                  {/* Telemetry Box */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[10px]">Current Temp:</span>
                      <strong
                        className={`font-bold ${
                          b.currentTemp.includes("EXCURSION") ? "text-red-400" : "text-cyan-400"
                        }`}
                      >
                        {b.currentTemp}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-400 text-[11px]">
                      <span>Target Range:</span>
                      <span>{b.targetTemperatureRange}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400 text-[11px]">
                      <span>Quantity Doses:</span>
                      <span className="text-white font-bold">{b.quantityUnits} Units</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Zone:</span>
                      <span className="text-slate-200">{b.storageZone}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Expiration:</span>
                      <span className="text-amber-400">{b.expirationDate}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  {b.chainOfCustodyStatus.includes("EXCURSION") ? (
                    <button
                      type="button"
                      onClick={() => handleAcknowledgeExcursion(b.batchId)}
                      className="flex-1 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <AlertTriangle size={13} /> Fix Excursion
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="flex-1 py-2 bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck size={13} /> Telemetry Verified
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setInspectBatch(b)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: GS1 SCANNER */}
      {activeTab === "GS1_SCANNER" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Barcode size={18} className="text-cyan-400" /> GS1 DataMatrix Electronic Serialization Scanner
            </h3>
            <p className="text-xs text-slate-400">
              Scan GS1 DataMatrix 2D barcodes to parse GTIN, Serial Numbers, Lot Expiration, and verify cryptographically signed FDA DSCSA provenance payloads.
            </p>

            <form onSubmit={handleGS1Scan} className="space-y-3">
              <input
                type="text"
                placeholder="Scan or enter GS1 DataMatrix payload (e.g. (01)00300450412019(21)SN94021094(17)270315(10)LOT99201)"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                className="w-full p-4 bg-slate-950 border border-slate-700 rounded-2xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={scanning}
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-600/20"
                >
                  {scanning ? <RefreshCw size={14} className="animate-spin" /> : <Barcode size={14} />}
                  {scanning ? "Parsing Barcode..." : "Parse & Verify GS1 DataMatrix"}
                </button>
              </div>
            </form>

            {scannedResult && (
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-3 font-mono">
                <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800 pb-2">
                  <span>DSCSA Status: {scannedResult.dscsaVerification}</span>
                  <span>Integrity Hash: {scannedResult.integrityHash}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Parsed GTIN (Global Trade Item Number)</span>
                  <span className="text-cyan-300 font-bold">{scannedResult.gtinParsed}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Serial Number & Lot</span>
                  <span className="text-white font-bold">{scannedResult.serialNumber} | {scannedResult.lotNumber}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: DSCSA PROVENANCE */}
      {activeTab === "DSCSA_PROVENANCE" && (
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Package size={18} className="text-cyan-400" /> FDA Drug Supply Chain Security Act (DSCSA) Lifecycle
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
              {[
                { stage: "1. MANUFACTURER", desc: "Digital signature attached to Lot upon synthesis & packaging." },
                { stage: "2. DISTRIBUTOR", desc: "Cold-chain continuous temperature logs appended during transit." },
                { stage: "3. PHARMACY RECEIVING", desc: "GS1 DataMatrix barcode scanned at receiving dock." },
                { stage: "4. PATIENT DISPENSING", desc: "Verified authentic dose logged into clinical EHR ledger." }
              ].map((s, idx) => (
                <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="text-cyan-400 font-bold">{s.stage}</div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Batch Modal */}
      {addBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Box size={18} className="text-cyan-400" /> Register Biologic / Vaccine Batch
              </h3>
              <button type="button" onClick={() => setAddBatchModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddBatch} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Drug / Biologic Name</label>
                <input
                  type="text"
                  placeholder="e.g. Spikevax mRNA Biologic"
                  value={batchForm.drugName}
                  onChange={(e) => setBatchForm({ ...batchForm, drugName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Manufacturer</label>
                <input
                  type="text"
                  value={batchForm.manufacturer}
                  onChange={(e) => setBatchForm({ ...batchForm, manufacturer: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAddBatchModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs transition shadow-lg shadow-cyan-600/20"
                >
                  Register Batch & Sync Sensor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Batch Modal */}
      {inspectBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-sans">{inspectBatch.batchId} - Inspection</h3>
              <button type="button" onClick={() => setInspectBatch(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-2">
              <div>Name: <strong className="text-cyan-300 font-sans">{inspectBatch.drugName}</strong></div>
              <div>Manufacturer: <span className="text-slate-300">{inspectBatch.manufacturer}</span></div>
              <div>Storage Zone: <span className="text-purple-300">{inspectBatch.storageZone}</span></div>
              <div>Current Temp: <span className="text-emerald-400">{inspectBatch.currentTemp}</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectBatch(null)}
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
