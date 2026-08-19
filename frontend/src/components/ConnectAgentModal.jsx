import React, { useState } from 'react';
import {
  X,
  Code2,
  Copy,
  Check,
  Terminal,
  Zap,
  BookOpen,
  ExternalLink,
  Shield,
  Layers
} from 'lucide-react';

export default function ConnectAgentModal({ isOpen, onClose, activeSource }) {
  const [activeTab, setActiveTab] = useState('python_requests');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sourceName = activeSource?.name || 'memorae-ai-core';
  const sourceId = activeSource?.id || '1762839';

  const snippets = {
    python_requests: `# 1. Install requests
# pip install requests

import requests
import time

BETTERSTACK_INGEST_URL = "https://in.logs.betterstack.com"
SOURCE_TOKEN = "<YOUR_BETTERSTACK_SOURCE_TOKEN>"  # From Better Stack Source Settings

def log_agent_trace(
    agent_name: str,
    tool_name: str,
    status: str,
    latency_ms: float,
    prompt: str = "",
    response: str = "",
    error: str = None,
    trace_id: str = None
):
    """Streams a real agent execution event to Better Stack."""
    payload = {
        "event_type": "REQUEST_COMPLETED",
        "agent_name": agent_name,
        "tool_name": tool_name,
        "status": status,  # "SUCCESS" or "FAILED"
        "latency_ms": latency_ms,
        "prompt": prompt,
        "actual_result": response,
        "error": error,
        "trace_id": trace_id or f"TRACE_{int(time.time() * 1000)}"
    }
    
    headers = {
        "Authorization": f"Bearer {SOURCE_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        requests.post(BETTERSTACK_INGEST_URL, headers=headers, json=payload, timeout=5)
    except Exception as e:
        print(f"Telemetry log failed: {e}")

# Example Usage in Memorae Agent:
start = time.time()
try:
    # Your agent code here...
    result = "WhatsApp briefings summarized."
    log_agent_trace(
        agent_name="WhatsAppAgent",
        tool_name="WhatsApp Service",
        status="SUCCESS",
        latency_ms=(time.time() - start) * 1000,
        prompt="Summarize morning voice notes",
        response=result
    )
except Exception as err:
    log_agent_trace(
        agent_name="WhatsAppAgent",
        tool_name="WhatsApp Service",
        status="FAILED",
        latency_ms=(time.time() - start) * 1000,
        prompt="Summarize morning voice notes",
        error=str(err)
    )`,

    python_logtail: `# 1. Install logtail-python
# pip install logtail-python

import logging
from logtail import LogtailHandler

handler = LogtailHandler(source_token="<YOUR_BETTERSTACK_SOURCE_TOKEN>")
logger = logging.getLogger("memorae.agent")
logger.setLevel(logging.INFO)
logger.addHandler(handler)

# Log a structured agent execution trace:
logger.info(
    "Agent task completed",
    extra={
        "agent_name": "GithubAgent",
        "tool_name": "GitHub",
        "status": "SUCCESS",
        "latency_ms": 1840.5,
        "prompt": "List open PRs on memorae-core",
        "actual_result": "Found 3 open pull requests."
    }
)`,

    node_fetch: `// In your Node.js / TypeScript Agent (LangChain / LlamaIndex / Custom)
const BETTERSTACK_INGEST_URL = "https://in.logs.betterstack.com";
const SOURCE_TOKEN = "<YOUR_BETTERSTACK_SOURCE_TOKEN>";

async function logAgentTrace({
  agentName,
  toolName,
  status,
  latencyMs,
  prompt,
  response,
  error,
  traceId
}) {
  try {
    await fetch(BETTERSTACK_INGEST_URL, {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${SOURCE_TOKEN}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        event_type: "REQUEST_COMPLETED",
        agent_name: agentName,
        tool_name: toolName,
        status: status, // "SUCCESS" | "FAILED"
        latency_ms: latencyMs,
        prompt: prompt,
        actual_result: response,
        error: error,
        trace_id: traceId || \`TRACE_\${Date.now()}\`
      })
    });
  } catch (err) {
    console.error("Failed to emit Better Stack telemetry:", err);
  }
}

// Example usage:
await logAgentTrace({
  agentName: "MemoraeVoiceAgent",
  toolName: "WhisperTranscriber",
  status: "SUCCESS",
  latencyMs: 1420,
  prompt: "Process WhatsApp audio briefing",
  response: "Transcription complete."
});`,

    curl: `# Send a raw execution trace event via cURL
curl -X POST "https://in.logs.betterstack.com" \\
  -H "Authorization: Bearer <YOUR_BETTERSTACK_SOURCE_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event_type": "REQUEST_COMPLETED",
    "agent_name": "GithubAgent",
    "tool_name": "GitHub",
    "status": "SUCCESS",
    "latency_ms": 2350,
    "prompt": "Merge PR #42",
    "actual_result": "Pull request merged successfully.",
    "trace_id": "TRACE_001"
  }'`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in font-sans">
      <div className="bg-[#060919] border border-[#172554] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-[#172554] flex items-center justify-between bg-[#0A102F]/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/40 flex items-center justify-center text-[#06B6D4]">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Stream Agent Telemetry to Better Stack</span>
                <span className="text-[10px] font-mono font-normal uppercase bg-[#06B6D4]/20 text-[#06B6D4] px-2 py-0.5 rounded-full border border-[#06B6D4]/30">
                  Live SDK
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Paste this into your Memorae agent backend to stream live traces directly to Better Stack.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-[#172554] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Badge Info */}
        <div className="px-6 py-3 bg-[#080D26] border-b border-[#172554] flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <Layers className="w-4 h-4 text-[#06B6D4]" />
            <span>Target Source: <strong className="text-white font-mono">{sourceName}</strong> (ID: {sourceId})</span>
          </div>
          <a
            href="https://telemetry.betterstack.com"
            target="_blank"
            rel="noreferrer"
            className="text-[#06B6D4] hover:underline flex items-center space-x-1"
          >
            <span>Better Stack Dashboard</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center space-x-1 px-6 pt-4 border-b border-[#172554] bg-[#0A102F]/30">
          {[
            { id: 'python_requests', label: 'Python (Requests / 3-Line)' },
            { id: 'python_logtail', label: 'Python (Logtail SDK)' },
            { id: 'node_fetch', label: 'Node.js / TypeScript' },
            { id: 'curl', label: 'cURL / REST' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all border-t border-x ${
                activeTab === tab.id
                  ? 'bg-[#060919] text-[#06B6D4] border-[#172554] border-b-transparent font-bold'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Code Content Box */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="relative">
            <pre className="bg-[#030614] border border-[#172554] rounded-xl p-4 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed shadow-inner">
              <code>{snippets[activeTab]}</code>
            </pre>
            <button
              onClick={handleCopy}
              className="absolute right-3 top-3 px-3 py-1.5 rounded-lg bg-[#0A102F] hover:bg-[#172554] border border-[#172554] hover:border-[#06B6D4]/50 text-slate-200 text-xs font-medium flex items-center space-x-1.5 transition-all shadow-md"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Snippet</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 bg-[#0A102F] rounded-xl border border-[#172554] text-xs text-slate-300 flex items-start space-x-2.5">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Tip:</strong> Get your <span className="font-mono text-white">Source Token</span> from your Better Stack dashboard under <strong>Sources → {sourceName} → Connect</strong>. Once your agent calls this function, traces will automatically appear live on this evaluation dashboard.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#172554] flex items-center justify-end bg-[#0A102F]/50">
          <button
            onClick={onClose}
            className="btn-memorae-gradient text-white text-xs font-bold px-6 py-2 rounded-xl shadow-lg shadow-[#06B6D4]/30"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
