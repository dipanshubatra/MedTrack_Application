import React, { useState, useEffect } from 'react';
import { 
  Droplets, 
  Activity, 
  ShieldAlert, 
  Zap, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Gauge, 
  Sliders,
  Filter
} from 'lucide-react';

const NephrologyCrrtDialysisHub = () => {
  const [selectedPatient, setSelectedPatient] = useState('RENAL-771');
  const [showModal, setShowModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [protocolStatus, setProtocolStatus] = useState({
    citrateAnticoagulation: false,
    ultrafiltrationBoost: false,
    filterChangeStat: false,
    hyperkalemiaEmergency: false
  });

  // Nephrology CRRT Telemetry State
  const [crrt, setCrrt] = useState({
    effluentDose: 32.5, // mL/kg/h (Target 20-35)
    bloodFlowRate: 180, // mL/min
    transmembranePressure: 145, // TMP mmHg (Alert >250)
    filterDropPressure: 45, // mmHg (Alert >100)
    netUltrafiltrationRate: 150, // mL/h
    serumPotassium: 5.8, // mEq/L
    serumBicarbonate: 18.2 // mEq/L
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCrrt(prev => ({
        ...prev,
        transmembranePressure: Math.floor(140 + Math.random() * 12),
        effluentDose: Math.round((32.0 + Math.random() * 1.0) * 10) / 10
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const patientList = [
    { id: 'RENAL-771', name: 'Harold Finch', age: '68 yrs', unit: 'ICU Bed 03', status: 'CRITICAL', mode: 'CVVHDF (Continuous Hemodiafiltration)', tmp: '145 mmHg', diagnosis: 'AKI Stage III / Refractory Hyperkalemia' },
    { id: 'RENAL-804', name: 'Miriam Vance', age: '61 yrs', unit: 'ICU Bed 06', status: 'STABLE', mode: 'CVVH (Continuous Venovenous Hemofiltration)', tmp: '110 mmHg', diagnosis: 'Sepsis-Associated AKI / Anuria' },
    { id: 'RENAL-512', name: 'David Miller', age: '75 yrs', unit: 'ICU Bed 08', status: 'WARNING', mode: 'SCUF (Slow Continuous Ultrafiltration)', tmp: '210 mmHg', diagnosis: 'Decompensated Heart Failure / Volume Overload' },
    { id: 'RENAL-403', name: 'Sarah Jenkins', age: '52 yrs', unit: 'ICU Bed 11', status: 'STABLE', mode: 'CVVHD (Continuous Venovenous Hemodialysis)', tmp: '125 mmHg', diagnosis: 'Post-Renal Transplant Delayed Graft Function' }
  ];

  const crrtAlerts = [
    { id: 'ALT-REN01', time: '15:35:10', type: 'CRITICAL', title: 'Transmembrane Pressure (TMP) Escalation Alert', desc: 'TMP rose from 145 mmHg to 210 mmHg in Unit 08. Early hemofilter clotting detected. Regional citrate anticoagulation check required.', standard: 'KDIGO 2026 Acute Kidney Injury Guidelines' },
    { id: 'ALT-REN02', time: '15:02:00', type: 'WARNING', title: 'Refractory Serum Potassium (5.8 mEq/L)', desc: 'Severe hyperkalemia despite CVVHDF dialysate potassium 2.0 mEq/L. Increase effluent dose to 35 mL/kg/h.', standard: 'ADQI Dialysis Quality Initiative' },
    { id: 'ALT-REN03', time: '14:15:30', type: 'INFO', title: 'Effluent Fluid Balance Recalibrated', desc: 'Prismaflex gravimetric scale auto-zeroed. Net ultrafiltration error <0.5%.', standard: 'HL7 FHIR R4 / FDA 21 CFR Part 11' }
  ];

  const toggleProtocol = (proto) => {
    setProtocolStatus(prev => ({
      ...prev,
      [proto]: !prev[proto]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 mb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Droplets className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400 to-rose-400 bg-clip-text text-transparent">
                Nephrology CRRT & Dialysis Overwatch Station
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                KDIGO AKI Staging, Continuous Renal Replacement Therapy (CRRT) & Gravimetric Fluid Balance Engine
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => toggleProtocol('citrateAnticoagulation')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.citrateAnticoagulation 
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-600/50 animate-bounce' 
                : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60 hover:bg-cyan-900/40'
            }`}
          >
            <Sliders className="w-4 h-4" />
            REGIONAL CITRATE PROTOCOL
          </button>

          <button 
            onClick={() => toggleProtocol('filterChangeStat')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.filterChangeStat 
                ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/50' 
                : 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/40'
            }`}
          >
            <Filter className="w-4 h-4" />
            STAT HEMOFILTER CHANGE
          </button>

          <button 
            onClick={() => toggleProtocol('hyperkalemiaEmergency')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.hyperkalemiaEmergency 
                ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/50' 
                : 'bg-purple-950/40 text-purple-300 border-purple-800/60 hover:bg-purple-900/40'
            }`}
          >
            <Zap className="w-4 h-4" />
            HYPERKALEMIA ESCALATION
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Renal Census */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                CRRT Active Census
              </h2>
              <span className="px-2 py-0.5 text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-full font-mono">
                4 Active Circuit
              </span>
            </div>

            <div className="space-y-2">
              {patientList.map(pt => (
                <div 
                  key={pt.id}
                  onClick={() => setSelectedPatient(pt.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedPatient === pt.id ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg shadow-cyan-500/10' : 'bg-slate-950/60 border-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{pt.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{pt.id} • {pt.unit}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      pt.status === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                      pt.status === 'WARNING' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      TMP {pt.tmp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2"><strong className="text-slate-400">Mode:</strong> {pt.mode}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Gravimetric Fluid Balance Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-3">
              <Gauge className="w-4 h-4 text-purple-400" />
              Gravimetric Balance & Electrolytes
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>Serum Potassium (K+):</span>
                <span className="font-mono text-rose-400">{crrt.serumPotassium} mEq/L</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>Serum Bicarbonate:</span>
                <span className="font-mono text-amber-400">{crrt.serumBicarbonate} mEq/L</span>
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span>Net Ultrafiltration:</span>
                <span className="font-mono text-cyan-400">{crrt.netUltrafiltrationRate} mL/h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: CRRT Circuit Dashboard */}
        <div className="lg:col-span-6 space-y-6">
          {/* Patient Overview Header */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap justify-between items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-100">Harold Finch</h2>
                <span className="px-2.5 py-0.5 text-xs bg-rose-950 text-rose-400 border border-rose-800 rounded-full font-semibold">
                  KDIGO STAGE III AKI
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                MRN: 7710294 • Male • 68 Yrs • ICU Bed 03 • Nephrologist: Dr. S. Patel, MD
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono border border-slate-700">
                Prismaflex v8.0 Connected
              </span>
            </div>
          </div>

          {/* Vitals Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4">
              <div className="text-xs font-bold text-cyan-400 mb-1">EFFLUENT DOSE</div>
              <div className="text-3xl font-black font-mono text-cyan-400">{crrt.effluentDose} <span className="text-xs font-normal text-slate-400">mL/kg/h</span></div>
              <div className="text-[10px] text-slate-400 mt-1">KDIGO Target 20-35</div>
            </div>

            <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4">
              <div className="text-xs font-bold text-purple-400 mb-1">BLOOD FLOW (Qb)</div>
              <div className="text-3xl font-black font-mono text-purple-400">{crrt.bloodFlowRate} <span className="text-xs font-normal text-slate-400">mL/min</span></div>
              <div className="text-[10px] text-slate-400 mt-1">Arterial/Venous Catheter</div>
            </div>

            <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4">
              <div className="text-xs font-bold text-amber-400 mb-1">TRANSMEMBRANE (TMP)</div>
              <div className="text-3xl font-black font-mono text-amber-400">{crrt.transmembranePressure} <span className="text-xs font-normal text-slate-400">mmHg</span></div>
              <div className="text-[10px] text-slate-400 mt-1">Clotting Alert &gt;250</div>
            </div>

            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4">
              <div className="text-xs font-bold text-emerald-400 mb-1">ULTRAFILTRATION</div>
              <div className="text-3xl font-black font-mono text-emerald-400">{crrt.netUltrafiltrationRate} <span className="text-xs font-normal text-slate-400">mL/h</span></div>
              <div className="text-[10px] text-slate-400 mt-1">Net Fluid Removal</div>
            </div>
          </div>

          {/* CRRT Circuit Pressure Waveform Stream */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-slate-300 tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                CRRT CIRCUIT TRANSMEMBRANE PRESSURE (TMP) STREAM
              </h3>
              <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
                <span>CIRCUIT ACTIVE</span>
              </div>
            </div>
            
            <div className="h-32 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-center p-4 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <svg className="w-full h-full text-cyan-400 stroke-current fill-none" viewBox="0 0 500 100" preserveAspectRatio="none">
                <path 
                  strokeWidth="2" 
                  d="M 0,60 L 50,55 L 100,58 L 150,52 L 200,56 L 250,50 L 300,54 L 350,48 L 400,52 L 450,50 L 500,52" 
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Column: Dialysis Alerts */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Dialysis Alerts
              </h2>
              <span className="px-2 py-0.5 text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-full font-mono">
                {crrtAlerts.length} Active
              </span>
            </div>

            <div className="space-y-3">
              {crrtAlerts.map(alt => (
                <div 
                  key={alt.id}
                  onClick={() => { setSelectedAlert(alt); setShowModal(true); }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
                    alt.type === 'CRITICAL' ? 'bg-rose-950/40 border-rose-800/80' :
                    alt.type === 'WARNING' ? 'bg-amber-950/40 border-amber-800/80' :
                    'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                    <span className="font-mono">{alt.time}</span>
                    <span className={`font-bold ${alt.type === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'}`}>{alt.type}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">{alt.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{alt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Badge */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Nephrology Guidelines
            </h3>
            <div className="text-[11px] text-slate-400 space-y-1">
              <p className="flex justify-between"><span>KDIGO AKI Staging:</span> <span className="text-emerald-400 font-semibold">Stage III Verified</span></p>
              <p className="flex justify-between"><span>ADQI Guidelines:</span> <span className="text-emerald-400 font-semibold">Compliant</span></p>
              <p className="flex justify-between"><span>FDA 21 CFR Part 11:</span> <span className="text-emerald-400 font-semibold">Audit Passed</span></p>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Inspector */}
      {showModal && selectedAlert && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800 rounded-md">
                  {selectedAlert.type} NEPHROLOGY ALERT
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-2">{selectedAlert.title}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200 font-mono text-xl">×</button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{selectedAlert.desc}</p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <p><strong className="text-slate-200">Standard Framework:</strong> {selectedAlert.standard}</p>
              <p><strong className="text-slate-200">Action:</strong> Increase regional citrate infusion rate. Prepare replacement hemofilter set if TMP exceeds 250 mmHg.</p>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold">Dismiss</button>
              <button onClick={() => { alert('Regional Citrate Protocol Escalated'); setShowModal(false); }} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/40">Adjust Citrate Infusion</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NephrologyCrrtDialysisHub;
