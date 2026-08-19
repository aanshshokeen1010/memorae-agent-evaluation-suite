import React, { useState } from 'react';
import {
  Brain,
  Cpu,
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Clock,
  Code,
  Layers,
  Sparkles
} from 'lucide-react';

const SPAN_TYPE_CONFIG = {
  LLM: { label: 'LLM Call', color: '#7C3AED', bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-300', icon: Brain },
  TOOL: { label: 'Tool Binding', color: '#06B6D4', bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-300', icon: Cpu },
  MEMORY: { label: 'Memory Retrieval', color: '#10B981', bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-300', icon: Database },
  RETRIEVER: { label: 'Vector Retriever', color: '#F59E0B', bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-300', icon: Search },
  CHAIN: { label: 'Agent Chain', color: '#3B82F6', bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-300', icon: Layers }
};

export default function LangSmithWaterfall({ requestRecord, totalLatency = 4200 }) {
  const [expandedSpanId, setExpandedSpanId] = useState(null);

  const reqLat = requestRecord?.latency || totalLatency || 1000;
  const spans = requestRecord?.spans && requestRecord.spans.length > 0 ? requestRecord.spans : [
    {
      span_id: 'span_01',
      parent_span_id: null,
      name: `${requestRecord?.agent || 'MemoraeAgent'} Execution Chain`,
      span_type: 'CHAIN',
      start_time_ms: 0,
      duration_ms: reqLat,
      input_payload: { prompt: requestRecord?.prompt || 'Agent Prompt Directive' },
      output_payload: { status: requestRecord?.status || 'SUCCESS', error: requestRecord?.error || null },
      status: requestRecord?.status || 'SUCCESS'
    },
    {
      span_id: 'span_02',
      parent_span_id: 'span_01',
      name: `${requestRecord?.tool || 'Primary Tool'} Call`,
      span_type: 'TOOL',
      start_time_ms: Math.floor(reqLat * 0.1),
      duration_ms: Math.floor(reqLat * 0.8),
      input_payload: { tool: requestRecord?.tool || 'Tool', request_id: requestRecord?.id },
      output_payload: { status: requestRecord?.status || 'SUCCESS', error: requestRecord?.error || null },
      status: requestRecord?.status || 'SUCCESS'
    }
  ];

  const maxDuration = Math.max(totalLatency, ...spans.map(s => s.start_time_ms + s.duration_ms));

  return (
    <div className="space-y-4 font-sans">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between text-xs border-b border-[#172554] pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-[#06B6D4]/20 border border-[#06B6D4]/40 flex items-center justify-center text-[#06B6D4]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-white font-mono text-sm">Execution Span Timeline</span>
            <span className="text-slate-400 ml-2">Memorae Traces</span>
          </div>
        </div>
        <div className="flex items-center space-x-3 text-slate-400 font-mono text-[11px]">
          <span>Total Spans: <strong className="text-white">{spans.length}</strong></span>
          <span>•</span>
          <span>Max Duration: <strong className="text-[#06B6D4]">{maxDuration}ms</strong></span>
        </div>
      </div>

      {/* Timeline Ruler Header */}
      <div className="grid grid-cols-12 gap-2 text-[10px] font-mono text-slate-500 border-b border-[#172554]/60 pb-1 px-2">
        <div className="col-span-4">Span Name & Type</div>
        <div className="col-span-8 flex justify-between">
          <span>0ms</span>
          <span>{(maxDuration * 0.25).toFixed(0)}ms</span>
          <span>{(maxDuration * 0.5).toFixed(0)}ms</span>
          <span>{(maxDuration * 0.75).toFixed(0)}ms</span>
          <span>{maxDuration}ms</span>
        </div>
      </div>

      {/* Spans List */}
      <div className="space-y-2">
        {spans.map((span) => {
          const cfg = SPAN_TYPE_CONFIG[span.span_type] || SPAN_TYPE_CONFIG.CHAIN;
          const IconComp = cfg.icon;

          const startPct = (span.start_time_ms / maxDuration) * 100;
          const widthPct = Math.max((span.duration_ms / maxDuration) * 100, 3);
          const isExpanded = expandedSpanId === span.span_id;
          const isNested = span.parent_span_id !== null;

          return (
            <div key={span.span_id} className="memorae-glass-card rounded-xl border border-[#172554] overflow-hidden text-xs">
              
              {/* Row Grid */}
              <div
                onClick={() => setExpandedSpanId(isExpanded ? null : span.span_id)}
                className="grid grid-cols-12 gap-2 items-center p-2.5 hover:bg-[#0A102F]/80 cursor-pointer transition-colors"
              >
                {/* Column 1: Name & Type Pill */}
                <div className="col-span-4 flex items-center space-x-2 truncate pr-2" style={{ paddingLeft: isNested ? '1.25rem' : '0' }}>
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase font-mono border ${cfg.bg} ${cfg.border} ${cfg.text} shrink-0`}>
                    {span.span_type}
                  </span>

                  <span className="font-semibold text-slate-200 truncate">{span.name}</span>
                </div>

                {/* Column 2: Visual Gantt Bar */}
                <div className="col-span-8 relative h-7 bg-[#060919] rounded-lg border border-[#172554]/80 overflow-hidden flex items-center">
                  {/* Background grid lines */}
                  <div className="absolute inset-0 grid grid-cols-4 divide-x divide-[#172554]/30 pointer-events-none"><div></div><div></div><div></div><div></div></div>

                  {/* Gantt Bar */}
                  <div
                    className="absolute h-5 rounded-md flex items-center px-2 transition-all shadow-md font-mono text-[10px] text-white font-bold truncate"
                    style={{
                      left: `${startPct}%`,
                      width: `${widthPct}%`,
                      backgroundColor: cfg.color
                    }}
                  >
                    <span>{span.duration_ms}ms</span>
                  </div>
                </div>
              </div>

              {/* Expanded Payload Viewer */}
              {isExpanded && (
                <div className="bg-[#060919] p-3 border-t border-[#172554] space-y-2 text-[11px] font-mono">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 font-bold block mb-1">Input Payload:</span>
                      <pre className="bg-[#0A102F] p-2 rounded-lg border border-[#172554] text-slate-300 overflow-x-auto select-text">
                        {JSON.stringify(span.input_payload || {}, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold block mb-1">Output Payload:</span>
                      <pre className="bg-[#0A102F] p-2 rounded-lg border border-[#172554] text-slate-300 overflow-x-auto select-text">
                        {JSON.stringify(span.output_payload || {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}
