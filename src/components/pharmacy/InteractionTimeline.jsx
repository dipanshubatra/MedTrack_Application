import React from "react";
import { Clock, CheckCircle2, Eye, AlertTriangle, Skull } from "lucide-react";
import { SEVERITY_META } from "../../services/MedicationInteractionService";

const STATUS_META = {
  active: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", label: "Active" },
  acknowledged: { icon: Eye, color: "text-sky-400", bg: "bg-sky-500/10", label: "Acknowledged" },
  resolved: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Resolved" },
};

function formatTime(isoString) {
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/**
 * InteractionTimeline
 * Vertical timeline showing alert events in reverse-chronological order.
 * Each node shows severity, drug pair, status, and timestamp.
 */
export default function InteractionTimeline({ events = [] }) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock size={32} className="text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 text-sm font-semibold">No interaction events recorded</p>
        <p className="text-slate-500 text-xs mt-1">Events will appear here when medications are analyzed</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

      <div className="space-y-5">
        {events.map((event, i) => {
          const sevMeta = SEVERITY_META[event.severity] || SEVERITY_META.low;
          const statusMeta = STATUS_META[event.status] || STATUS_META.active;
          const StatusIcon = statusMeta.icon;

          return (
            <div key={event.id} className="relative flex gap-4 group">
              {/* Timeline dot */}
              <div className="relative z-10 flex-shrink-0">
                <div className={`w-6 h-6 rounded-full ${statusMeta.bg} border border-white/10 flex items-center justify-center`}>
                  <StatusIcon size={12} className={statusMeta.color} />
                </div>
              </div>

              {/* Content card */}
              <div className="flex-1 pb-2">
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:bg-white/[0.06] transition-colors">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${sevMeta.bg} ${sevMeta.text}`}>
                        {sevMeta.label}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{formatTime(event.timestamp)}</span>
                    </div>
                    <span className={`text-[10px] font-semibold ${statusMeta.color}`}>{statusMeta.label}</span>
                  </div>

                  {/* Drug pair */}
                  <p className="text-white text-sm font-bold mb-1">
                    {event.drugA?.name} × {event.drugB?.name}
                  </p>

                  {/* Mechanism snippet */}
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-2">{event.mechanism}</p>

                  {/* Recommendation */}
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2.5">
                    <p className="text-emerald-300 text-[11px] leading-relaxed">{event.recommendation}</p>
                  </div>

                  {/* Acknowledged by */}
                  {event.acknowledgedBy && (
                    <p className="text-slate-500 text-[10px] mt-2 font-mono">
                      Acknowledged by {event.acknowledgedBy}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
