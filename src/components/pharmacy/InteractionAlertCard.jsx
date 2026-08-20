import React from "react";
import { Skull, AlertTriangle, AlertCircle, Info, ShieldCheck, ChevronRight } from "lucide-react";
import { SEVERITY_META } from "../../services/MedicationInteractionService";

const ICON_MAP = { Skull, AlertTriangle, AlertCircle, Info };

/**
 * InteractionAlertCard
 * Renders a single drug-drug interaction alert with severity badge,
 * mechanism, clinical effect, recommendation, and action buttons.
 */
export default function InteractionAlertCard({ interaction, onAcknowledge, onDismiss }) {
  const meta = SEVERITY_META[interaction.severity] || SEVERITY_META.low;
  const Icon = ICON_MAP[meta.icon] || Info;

  return (
    <div
      className={`relative rounded-2xl border ${meta.bg} p-5 transition-all hover:shadow-lg hover:shadow-black/20 group ${
        meta.pulse ? "animate-pulse" : ""
      }`}
    >
      {/* Pulse indicator for critical */}
      {meta.pulse && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
        </span>
      )}

      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${meta.bg} border flex items-center justify-center ${meta.text}`}>
            <Icon size={20} />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm leading-tight">
              {interaction.drugA?.name || interaction.drugA}{" "}
              <span className="text-slate-500 mx-1">×</span>{" "}
              {interaction.drugB?.name || interaction.drugB}
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              {interaction.drugA?.class} + {interaction.drugB?.class}
            </p>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${meta.bg} ${meta.text}`}
        >
          {meta.label}
        </span>
      </div>

      {/* Mechanism */}
      <div className="mb-3">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Mechanism</p>
        <p className="text-slate-300 text-xs leading-relaxed">{interaction.mechanism}</p>
      </div>

      {/* Clinical Effect */}
      <div className="mb-3 bg-black/20 rounded-xl p-3">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Clinical Effect</p>
        <p className="text-slate-200 text-xs leading-relaxed">{interaction.clinicalEffect}</p>
      </div>

      {/* Recommendation */}
      <div className="mb-4 flex items-start gap-2">
        <ShieldCheck size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
        <p className="text-emerald-300 text-xs leading-relaxed">{interaction.recommendation}</p>
      </div>

      {/* Evidence Level + Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <span className="text-[10px] text-slate-500 font-mono">
          Evidence: Level {interaction.evidenceLevel}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onAcknowledge?.(interaction)}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-semibold rounded-lg border border-white/10 transition-all"
          >
            Acknowledge
          </button>
          <button
            onClick={() => onDismiss?.(interaction)}
            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-semibold rounded-lg border border-rose-500/20 transition-all"
          >
            Override
          </button>
        </div>
      </div>
    </div>
  );
}
