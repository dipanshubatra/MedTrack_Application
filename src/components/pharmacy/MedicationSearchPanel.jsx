import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, Plus, X, Pill, Beaker, ChevronDown } from "lucide-react";
import { searchDrugs, DRUG_DATABASE, getDrugInfo } from "../../services/MedicationInteractionService";

/**
 * MedicationSearchPanel
 * Autocomplete search panel for finding and adding medications to the
 * active analysis set. Shows drug class, route, and quick-add chips.
 */
export default function MedicationSearchPanel({ selectedIds, onAdd, onRemove, maxItems = 8 }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (query.length >= 2) {
      const filtered = searchDrugs(query).filter((d) => !selectedIds.includes(d.id));
      setResults(filtered);
      setOpen(true);
    } else {
      setResults([]);
      setOpen(false);
    }
  }, [query, selectedIds]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAdd = useCallback(
    (drugId) => {
      if (selectedIds.length < maxItems) {
        onAdd(drugId);
        setQuery("");
        setResults([]);
        setOpen(false);
      }
    },
    [selectedIds.length, maxItems, onAdd]
  );

  const atLimit = selectedIds.length >= maxItems;

  return (
    <div ref={containerRef} className="relative">
      {/* Selected Medications Chips */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedIds.map((id) => {
            const drug = getDrugInfo(id);
            if (!drug) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-slate-200"
              >
                <Pill size={12} className="text-sky-400" />
                {drug.name}
                <button
                  onClick={() => onRemove(id)}
                  className="ml-0.5 p-0.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={atLimit ? `Maximum ${maxItems} medications reached` : "Search medications by name or class..."}
          disabled={atLimit}
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-slate-800 border border-white/10 rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
          <div className="p-1 max-h-64 overflow-y-auto">
            {results.map((drug) => (
              <button
                key={drug.id}
                onClick={() => handleAdd(drug.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
                  <Beaker size={14} className="text-sky-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-semibold truncate">{drug.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {drug.class} · {drug.route}
                  </p>
                </div>
                <Plus size={14} className="text-slate-500 group-hover:text-sky-400 transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {open && results.length === 0 && query.length >= 2 && (
        <div className="absolute z-50 mt-2 w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-center">
          <p className="text-slate-400 text-sm">No medications found for "{query}"</p>
        </div>
      )}

      {/* Quick Add Suggestion */}
      {!open && selectedIds.length === 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <ChevronDown size={12} className="animate-bounce" />
          <span>Type at least 2 characters to search the drug database</span>
        </div>
      )}
    </div>
  );
}
