import React, { useState } from 'react';
import {
  X,
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  Sparkles
} from 'lucide-react';
import LangSmithWaterfall from './LangSmithWaterfall';

export default function ThreadDiffViewer({ isOpen, onClose, traces = [] }) {
  const availableTraces = traces;

  // Currently selected trace IDs for comparison (start with first 2 traces if available)
  const [selectedTraceIds, setSelectedTraceIds] = useState(() => {
    if (availableTraces.length >= 2) {
      return [availableTraces[0].traceId, availableTraces[1].traceId];
    } else if (availableTraces.length === 1) {
      return [availableTraces[0].traceId];
    }
    return [];
  });

  if (!isOpen) return null;

  const handleAddTrace = (traceIdToAdd) => {
    if (traceIdToAdd && !selectedTraceIds.includes(traceIdToAdd)) {
      setSelectedTraceIds([...selectedTraceIds, traceIdToAdd]);
    }
  };

  const handleRemoveTrace = (traceIdToRemove) => {
    if (selectedTraceIds.length > 1) {
      setSelectedTraceIds(selectedTraceIds.filter(id => id !== traceIdToRemove));
    }
  };

  const selectedTracesData = selectedTraceIds.map(id => 
    availableTraces.find(t => t.traceId === id) || availableTraces[0]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="memorae-glass-card bg-[#060919] border border-[#06B6D4]/40 rounded-2xl p-6 max-w-7xl w-full shadow-2xl relative max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#172554] pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#0A102F] border border-[#06B6D4]/40 flex items-center justify-center text-[#06B6D4] shadow-lg shadow-[#06B6D4]/20">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <span>Side-by-Side Trace Comparison</span>
                <span className="text-xs font-mono bg-[#06B6D4]/20 text-[#06B6D4] px-2 py-0.5 rounded border border-[#06B6D4]/30">
                  {selectedTraceIds.length} Traces Selected
                </span>
              </h3>
              <p className="text-xs text-slate-400">Compare 2 or more trace execution timelines & waterfall spans side-by-side</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#0A102F]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trace Selection Control Bar */}
        <div className="bg-[#0A102F] p-3 rounded-xl border border-[#172554] mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Add Trace to Compare:</span>
            <select
              onChange={(e) => { handleAddTrace(e.target.value); e.target.value = ''; }}
              className="bg-[#060919] border border-[#172554] text-xs text-white rounded-lg p-2 font-mono focus:outline-none focus:border-[#06B6D4]"
              defaultValue=""
            >
              <option value="" disabled>-- Select a trace to add --</option>
              {availableTraces.map(t => (
                <option key={t.traceId} value={t.traceId} disabled={selectedTraceIds.includes(t.traceId)}>
                  {t.traceId} ({t.status} - {t.latency}ms) {t.failureType !== 'SUCCESS' ? `[${t.failureType}]` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="text-slate-400 text-[11px]">
            <span>Click </span>
            <Trash2 className="w-3 h-3 text-rose-400 inline mx-1" />
            <span>on any column to remove it from comparison</span>
          </div>
        </div>

        {/* Side-by-Side Trace Grid */}
        <div className="overflow-x-auto overflow-y-auto flex-1 pr-1">
          <div 
            className="grid gap-4 min-w-[700px]"
            style={{ gridTemplateColumns: `repeat(${selectedTracesData.length}, minmax(320px, 1fr))` }}
          >
            {selectedTracesData.map((trace, idx) => (
              <div 
                key={`${trace.traceId}-${idx}`}
                className="bg-[#0A102F]/90 p-4 rounded-xl border border-[#172554] space-y-4 flex flex-col justify-between"
              >
                {/* Trace Column Header */}
                <div className="space-y-2 border-b border-[#172554] pb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#06B6D4] font-mono text-sm">{trace.traceId}</span>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        trace.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {trace.status}
                      </span>

                      {selectedTraceIds.length > 1 && (
                        <button
                          onClick={() => handleRemoveTrace(trace.traceId)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-[#060919]"
                          title="Remove from comparison"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Agent:</span>
                      <span className="text-white font-bold">{trace.agent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tool:</span>
                      <span className="text-slate-200">{trace.tool}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Latency:</span>
                      <span className={trace.latency >= 10000 ? 'text-rose-400 font-bold' : 'text-[#06B6D4] font-bold'}>
                        {trace.latency} ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Taxonomy:</span>
                      <span className="text-amber-300 font-semibold">{trace.failureType}</span>
                    </div>
                  </div>
                </div>

                {/* Waterfall Span Component */}
                <div className="pt-1 flex-1">
                  <LangSmithWaterfall 
                    totalLatency={trace.latency} 
                    requestRecord={{ 
                      prompt: trace.prompt, 
                      agent: trace.agent, 
                      tool: trace.tool, 
                      status: trace.status, 
                      error: trace.error 
                    }} 
                  />
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-[#172554] flex items-center justify-between">
          <div className="text-xs text-slate-400">
            <span>Comparing {selectedTraceIds.length} execution traces side-by-side</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0A102F] hover:bg-[#172554] text-slate-200 border border-[#172554]"
          >
            Close Comparison
          </button>
        </div>

      </div>
    </div>
  );
}
