import React, { useState, useMemo } from 'react';
import {
  Activity,
  Users,
  Search,
  Filter,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Database,
  BarChart3,
  Calendar,
  Sparkles,
  Zap,
  Sliders,
  XCircle,
  Eye,
  Layers,
  Heart,
  Stethoscope,
  Clock,
  ShieldCheck,
  RefreshCw,
  Share2,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import CohortRiskSummaryCard from '../../components/ehr/CohortRiskSummaryCard';
import LongitudinalTimelineNode from '../../components/ehr/LongitudinalTimelineNode';

const PatientEhrAnalyticsHub = () => {
  const [activeTab, setActiveTab] = useState('longitudinal');
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [cohortsData] = useState([
    { cohortName: 'Type 2 Diabetes Cohort', patientCount: 3420, riskScore: 18.4, trend: '-2.1%' },
    { cohortName: 'Heart Failure Stage II/III', patientCount: 1280, riskScore: 34.2, trend: '-1.4%' },
    { cohortName: 'Post-Op Surgical Followup', patientCount: 890, riskScore: 12.8, trend: '-4.8%' }
  ]);

  const [patients, setPatients] = useState([
    {
      id: 'PT-88219',
      name: 'Eleanor Vance',
      age: 64,
      gender: 'Female',
      primaryDx: 'Non-Small Cell Lung Cancer',
      readmissionRisk: 'High (32%)',
      lastVisit: '2026-08-14',
      attendingPhysician: 'Dr. Aris Thorne',
      timelineEvents: [
        { date: '2026-08-14', title: 'Oncology Follow-up Consult', details: 'CT Thorax revealed stable focal opacity right upper lobe.', provider: 'Dr. Aris Thorne', category: 'Outpatient' },
        { date: '2026-06-20', title: 'Chemotherapy Cycle #4 Administered', details: 'Infusion completed without hypersensitivity reactions.', provider: 'Dr. Elena Rostova', category: 'Infusion' }
      ]
    },
    {
      id: 'PT-41023',
      name: 'Marcus Holloway',
      age: 42,
      gender: 'Male',
      primaryDx: 'Paroxysmal Atrial Fibrillation',
      readmissionRisk: 'Moderate (18%)',
      lastVisit: '2026-08-16',
      attendingPhysician: 'Dr. Sarah Connor',
      timelineEvents: [
        { date: '2026-08-16', title: 'ECG 12-Lead Holter Sync', details: 'Paroxysmal AFib episode resolved spontaneously after 14 mins.', provider: 'Dr. Sarah Connor', category: 'Telemetry' }
      ]
    }
  ]);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.primaryDx.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRisk =
        riskFilter === 'all' || p.readmissionRisk.toLowerCase().includes(riskFilter.toLowerCase());

      return matchesSearch && matchesRisk;
    });
  }, [patients, searchTerm, riskFilter]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/20 rounded-xl border border-indigo-500/30 text-indigo-400">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Patient EHR Analytics & Population Risk Profiler
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium">
                Predictive Risk Engine
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Longitudinal patient health timelines, ML-driven 30-day readmission scoring & population disease cohort stratifications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-600/20">
            <Sparkles className="w-4 h-4" />
            Recalculate ML Risk Profiles
          </button>
        </div>
      </div>

      {/* Cohort Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
        {cohortsData.map((c, idx) => (
          <CohortRiskSummaryCard key={idx} {...c} />
        ))}
      </div>

      {/* Filter controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 border border-slate-800 rounded-xl mb-6">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search patient, ID or diagnosis..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-400">Readmission Risk:</span>
            <select
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Patients</option>
              <option value="high">High Risk</option>
              <option value="moderate">Moderate Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPatients.map(p => (
          <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-white text-lg">{p.name} ({p.age} {p.gender})</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{p.id} • {p.primaryDx}</p>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-semibold">
                {p.readmissionRisk}
              </span>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Longitudinal Health Events</h4>
              {p.timelineEvents.map((evt, idx) => (
                <LongitudinalTimelineNode key={idx} {...evt} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientEhrAnalyticsHub;
