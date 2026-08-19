import React, { useState, useEffect } from 'react';
import {
  Brain,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity,
  FileJson,
  FileText,
  Download,
  Eye,
  RefreshCw,
  Server,
  Layers,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Zap,
  X,
  ExternalLink,
  Bot,
  Search,
  Filter,
  BarChart2,
  Terminal,
  Database,
  Globe,
  Lock,
  User,
  Copy,
  Check,
  Cpu,
  Sparkles,
  MessageSquare,
  Mail,
  GitBranch,
  Settings,
  HelpCircle,
  MessageCircle,
  Lightbulb,
  ThumbsUp,
  Smile,
  Calendar,
  Smartphone,
  Share2,
  GitCompare,
  FileSpreadsheet
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

import LangSmithWaterfall from './components/LangSmithWaterfall';
import ThreadDiffViewer from './components/ThreadDiffViewer';
import SettingsDrawer from './components/SettingsDrawer';
import ConnectAgentModal from './components/ConnectAgentModal';

const BACKEND_URL = 'http://127.0.0.1:8000';

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const sliceColor = data.payload?.color || data.fill || '#10B981';
    return (
      <div className="bg-[#060919] border border-[#06B6D4]/50 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sliceColor }}></span>
          <span className="font-bold text-slate-100">{data.name}:</span>
          <span className="text-[#06B6D4] font-extrabold text-sm">{data.value}%</span>
        </div>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-[#060919] border border-[#06B6D4]/60 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] shadow-sm shadow-[#06B6D4]"></span>
          <span className="font-bold text-slate-100">{data.payload?.category}:</span>
          <span className="text-[#06B6D4] font-extrabold text-sm">{data.value} requests</span>
        </div>
      </div>
    );
  }
  return null;
};

const MEMORAE_WORKSPACES = [
  { id: 'eng', name: 'Memorae Engineering', role: 'Internship Team' },
  { id: 'core', name: 'Memorae Core', role: 'Production' },
  { id: 'mobile', name: 'Memorae Mobile Apps', role: 'Staging' }
];



const PRESET_PROMPTS = [
  { label: 'WhatsApp Briefing', prompt: 'Summarize unread WhatsApp voice notes and briefing notes from Memorae memory layer', source: 'WhatsApp', icon: Smartphone },
  { label: 'GitHub Issues Query', prompt: 'Show my GitHub issues for repository memorae/agent-evaluation', source: 'GitHub', icon: GitBranch },
  { label: 'GIF Reply Directive', prompt: 'Memorae replied normally and sent a GIF matching the light-hearted mood', source: 'Telegram', icon: MessageSquare },
  { label: 'Email Action Items', prompt: 'Extract urgent action items from email memory briefings', source: 'Email', icon: Mail },
  { label: 'Calendar Briefing', prompt: 'Schedule Google Calendar briefing reminder for tomorrow 10 AM', source: 'Calendar', icon: Calendar },
  { label: 'Security Credentials', prompt: 'Verify admin permission access before retrieving system credentials', source: 'Security', icon: Lock }
];

export default function App() {
  // Navigation & Workspace State
  const [activeTab, setActiveTab] = useState('command'); // 'command' | 'analytics' | 'trace' | 'reports'
  const [workspace, setWorkspace] = useState(MEMORAE_WORKSPACES[0]);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

  // Form State
  const [prompt, setPrompt] = useState('Summarize unread WhatsApp voice notes and briefing notes from Memorae memory layer');
  const [scenario, setScenario] = useState('production');
  const [requestCount, setRequestCount] = useState(50);

  // Modal & Drawer State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // Live Better Stack Source & Streaming State
  const [activeSourceId, setActiveSourceId] = useState(localStorage.getItem('bs_source_id') || '');
  const [availableSources, setAvailableSources] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bs_available_sources') || '[]');
    } catch {
      return [];
    }
  });
  const [livePollInterval, setLivePollInterval] = useState(0); // 0=off, 5, 15, 30, 60s
  const [timeRange, setTimeRange] = useState('all'); // 'all' | '15m' | '1h' | '24h' | '7d'
  const [logLevelFilter, setLogLevelFilter] = useState('ALL'); // 'ALL' | 'ERROR' | 'SUCCESS'

  // Pipeline Execution State
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState(null);
  const [backendHealth, setBackendHealth] = useState('checking');
  const [error, setError] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  // Modal State for viewing reports
  const [viewReportType, setViewReportType] = useState(null);
  const [reportContent, setReportContent] = useState('');

  // Trace Inspector Filter State
  const [traceSearch, setTraceSearch] = useState('');
  const [traceFilter, setTraceFilter] = useState('ALL'); // 'ALL' | 'SUCCESS' | 'FAILED'
  const [selectedTraceRecord, setSelectedTraceRecord] = useState(null);

  // Check Backend Health & Load Sources on mount
  useEffect(() => {
    checkHealth();
    loadSources();
  }, []);

  const loadSources = async () => {
    const bsToken = localStorage.getItem('bs_token') || '';
    if (!bsToken) return;
    try {
      const res = await fetch(`${BACKEND_URL}/betterstack/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: bsToken, source_id: '' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sources && Array.isArray(data.sources)) {
          setAvailableSources(data.sources);
          localStorage.setItem('bs_available_sources', JSON.stringify(data.sources));
        }
      }
    } catch (e) {}
  };

  // Live Auto-Refresh Interval Effect
  useEffect(() => {
    if (livePollInterval === 0) return;
    const pollTimer = setInterval(() => {
      executeEvaluation(activeSourceId, true);
    }, livePollInterval * 1000);
    return () => clearInterval(pollTimer);
  }, [livePollInterval, activeSourceId, timeRange, logLevelFilter, prompt]);

  const checkHealth = async () => {
    setBackendHealth('checking');
    try {
      const res = await fetch(`${BACKEND_URL}/health`);
      if (res.ok) {
        setBackendHealth('healthy');
      } else {
        setBackendHealth('unhealthy');
      }
    } catch (err) {
      setBackendHealth('unhealthy');
    }
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSourceChange = (newSourceId) => {
    setActiveSourceId(newSourceId);
    localStorage.setItem('bs_source_id', newSourceId);
    const matched = availableSources.find(s => s.id === newSourceId);
    showToast(matched ? `Switched to source: ${matched.name}` : 'Switched to All Sources in Team');
    executeEvaluation(newSourceId, false);
  };

  const handleStartEvaluationClick = () => {
    setIsConfirmOpen(true);
  };

  const executeEvaluation = async (sourceIdToUse = activeSourceId, isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
      setError(null);
    }

    try {
      const bsToken = localStorage.getItem('bs_token') || '';

      const response = await fetch(`${BACKEND_URL}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          scenario,
          request_count: requestCount,
          time_range: timeRange,
          log_level: logLevelFilter,
          betterstack_token: bsToken,
          betterstack_source_id: sourceIdToUse || ''
        })
      });

      if (!response.ok) {
        let errMsg = `Evaluation backend returned HTTP ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errMsg = errData.detail;
          }
        } catch (e) {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      setResult(data);
      setBackendHealth('healthy');

      if (!isSilent) {
        showToast('Evaluation completed successfully!');
      }
    } catch (err) {
      if (!isSilent) {
        setError(err.message || 'Failed to connect to evaluation backend.');
        showToast('Evaluation failed: ' + (err.message || 'Backend unreachable'));
      }
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  };

  const confirmAndRunEvaluation = async () => {
    setIsConfirmOpen(false);
    executeEvaluation(activeSourceId, false);
  };

  const handleDownload = (type) => {
    const endpoint = `${BACKEND_URL}/reports/download/${type}`;
    window.open(endpoint, '_blank');
    showToast(`Downloading evaluation_report.${type}...`);
  };

  const handleViewReport = async (type) => {
    setViewReportType(type);
    setReportContent('Loading report content from backend...');
    try {
      const endpoint = `${BACKEND_URL}/reports/download/${type}`;
      const res = await fetch(endpoint);
      const text = await res.text();
      setReportContent(text);
    } catch (err) {
      setReportContent(`Error fetching report: ${err.message}`);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`);
  };

  // Recharts Data Mapping
  const pieData = result ? [
    { name: 'Success', value: result.success_rate, color: '#10B981' },
    { name: 'Failure', value: result.failure_rate, color: '#F43F5E' }
  ] : [];

  const barData = result && result.failure_distribution ? Object.keys(result.failure_distribution).map(key => ({
    category: key,
    count: result.failure_distribution[key]
  })) : [];

  // Extract real request records returned from live production log ingestion
  const traceRecords = (result && result.records && result.records.length > 0)
    ? result.records.map((rec, i) => ({
        id: rec.request_id || `REQ_${String(i+1).padStart(3, '0')}`,
        traceId: rec.trace_id || `TRACE_${String(i+1).padStart(3, '0')}`,
        timestamp: rec.timestamp || new Date().toISOString(),
        agent: rec.agent_name || 'GeneralAgent',
        tool: (rec.tool_calls && rec.tool_calls.length > 0) ? rec.tool_calls[0] : 'General Tool',
        status: rec.status || 'SUCCESS',
        failureType: rec.failure_type || 'SUCCESS',
        latency: rec.latency_ms || 0,
        retries: rec.retries || 0,
        error: rec.error || null,
        spans: rec.spans || []
      }))
    : [];

  const filteredRequests = traceRecords.filter(req => {
    const matchesSearch = req.id.toLowerCase().includes(traceSearch.toLowerCase()) || 
                          req.traceId.toLowerCase().includes(traceSearch.toLowerCase()) ||
                          req.agent.toLowerCase().includes(traceSearch.toLowerCase()) ||
                          req.failureType.toLowerCase().includes(traceSearch.toLowerCase());
    const matchesFilter = traceFilter === 'ALL' || req.status === traceFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen memorae-bg-pattern bg-grid-lines text-slate-100 font-sans pb-28 selection:bg-[#06B6D4] selection:text-black">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-10 right-6 z-50 bg-[#0A102F] border border-[#06B6D4]/60 text-[#06B6D4] px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2.5 text-xs animate-fade-in">
          <Sparkles className="w-4 h-4 text-[#06B6D4]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Drawers & Modals */}
      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ThreadDiffViewer isOpen={isDiffOpen} onClose={() => setIsDiffOpen(false)} traces={traceRecords} />

      {/* ================= MEMORAE GLOBAL HEADER ================= */}
      <header className="border-b border-[#172554] bg-[#060919]/95 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Top Bar */}
          <div className="h-16 flex items-center justify-between">
            
            {/* Logo & Brand Identity */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-[#0A102F] border border-[#06B6D4]/40 p-1 flex items-center justify-center shadow-lg shadow-[#06B6D4]/30 relative group">
                  <img 
                    src="/memorae-logo.png" 
                    alt="Memorae Logo" 
                    className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform" 
                  />
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#06B6D4] animate-ping"></span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-lg tracking-tight text-white font-sans">
                      Memorae<span className="text-[#06B6D4]">.ai</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full big-bang-badge font-bold uppercase tracking-wider flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-[#FF6B00] inline" />
                      <span>Enterprise Suite</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-5 w-px bg-[#172554] hidden md:block"></div>

              {/* Fast Better Stack Source Switcher */}
              <div className="relative hidden md:block">
                <div className="flex items-center space-x-1.5 bg-[#0A102F] border border-[#172554] rounded-lg px-2.5 py-1 text-xs">
                  <Database className="w-3.5 h-3.5 text-[#06B6D4]" />
                  <span className="text-slate-400 text-[11px]">Source:</span>
                  <select
                    value={activeSourceId}
                    onChange={(e) => handleSourceChange(e.target.value)}
                    className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="" className="bg-[#0A102F] text-white">All Sources (Default)</option>
                    {availableSources.map(src => (
                      <option key={src.id} value={src.id} className="bg-[#0A102F] text-white">
                        {src.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Right Status & Tools */}
            <div className="flex items-center space-x-2.5">
              
              {/* Connect Agent Modal Trigger */}
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#0A102F] border border-[#06B6D4]/40 hover:border-[#06B6D4] text-[#06B6D4] hover:bg-[#06B6D4]/10 transition-all font-semibold"
                title="View agent integration code snippets"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Connect Agent</span>
              </button>

              {/* Live Streaming Auto-Refresh Toggle */}
              <div className="flex items-center space-x-1 bg-[#0A102F] border border-[#172554] rounded-lg p-1 text-xs">
                <div className="flex items-center space-x-1 px-1.5">
                  <span className={`w-2 h-2 rounded-full ${livePollInterval > 0 ? 'bg-emerald-500 animate-ping' : 'bg-slate-500'}`}></span>
                  <span className="text-[11px] font-mono text-slate-300 hidden sm:inline">
                    {livePollInterval > 0 ? `LIVE (${livePollInterval}s)` : 'Live Tail'}
                  </span>
                </div>
                <select
                  value={livePollInterval}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setLivePollInterval(val);
                    showToast(val > 0 ? `Live Stream active (polling every ${val}s)` : 'Live Stream paused');
                  }}
                  className="bg-[#060919] text-slate-200 border border-[#172554] rounded text-[11px] px-1.5 py-0.5 focus:outline-none cursor-pointer"
                >
                  <option value="0">OFF</option>
                  <option value="5">5s</option>
                  <option value="15">15s</option>
                  <option value="30">30s</option>
                  <option value="60">60s</option>
                </select>
              </div>

              {/* Backend Status Pill */}
              <button 
                onClick={checkHealth}
                className="hidden lg:flex items-center space-x-2 text-xs px-3 py-1.5 rounded-lg bg-[#0A102F] border border-[#172554] hover:border-[#06B6D4]/40 transition-colors"
              >
                <Server className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Backend:</span>
                {backendHealth === 'healthy' ? (
                  <span className="flex items-center space-x-1.5 text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>127.0.0.1:8000</span>
                  </span>
                ) : (
                  <span className="text-rose-400 font-medium">Offline</span>
                )}
              </button>

              {/* Better Stack Settings Drawer Button */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-lg bg-[#0A102F] border border-[#172554] text-slate-300 hover:text-[#06B6D4] hover:border-[#06B6D4]/40 transition-colors"
                title="Better Stack Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              <a
                href={`${BACKEND_URL}/docs`}
                target="_blank"
                rel="noreferrer"
                className="hidden lg:flex items-center space-x-1.5 text-xs text-[#06B6D4] hover:text-white px-3 py-1.5 rounded-lg bg-[#06B6D4]/15 border border-[#06B6D4]/30 hover:bg-[#06B6D4]/30 transition-all"
              >
                <span>Swagger Docs</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* User Avatar */}
              <div className="flex items-center space-x-2 pl-2 border-l border-[#172554]">
                <div className="w-8 h-8 rounded-full bg-[#0A102F] border border-[#06B6D4]/50 p-0.5 overflow-hidden">
                  <img src="/memorae-mascot.png" alt="User Avatar" className="w-full h-full object-contain" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-200">Aansh</div>
                  <div className="text-[10px] text-[#06B6D4] font-mono">Memorae Intern</div>
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Sub-Navigation Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-2 border-t border-[#172554] text-xs font-medium">
            <button
              onClick={() => setActiveTab('command')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all whitespace-nowrap ${
                activeTab === 'command'
                  ? 'btn-memorae-gradient text-white font-semibold shadow-lg shadow-[#06B6D4]/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0A102F]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Command Center</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'btn-memorae-gradient text-white font-semibold shadow-lg shadow-[#06B6D4]/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0A102F]'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Taxonomy & Analytics</span>
              {result && (
                <span className="bg-[#0A102F] text-[#06B6D4] text-[10px] px-1.5 py-0.5 rounded font-mono border border-[#172554]">
                  {result.success_rate}%
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('trace')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all whitespace-nowrap ${
                activeTab === 'trace'
                  ? 'btn-memorae-gradient text-white font-semibold shadow-lg shadow-[#06B6D4]/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0A102F]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Trace Inspector</span>
              <span className="bg-[#0A102F] text-slate-400 text-[10px] px-1.5 py-0.5 rounded font-mono border border-[#172554]">{result?.total_requests || requestCount} REQ</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'btn-memorae-gradient text-white font-semibold shadow-lg shadow-[#06B6D4]/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0A102F]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Reports & Artifacts</span>
            </button>
          </div>

        </div>
      </header>

      {/* ================= MAIN CONTAINER ================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* ================= TAB 1: COMMAND CENTER ================= */}
        {activeTab === 'command' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* HERO CARD WITH OFFICIAL MASCOT */}
            <section className="memorae-glass-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden border border-[#172554] shadow-2xl">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#06B6D4]/15 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  {/* Memorae Official Mascot Avatar */}
                  <div className="w-16 h-16 rounded-2xl bg-[#0A102F] p-1 border border-[#06B6D4]/50 shadow-xl shadow-[#06B6D4]/30 flex items-center justify-center shrink-0 relative group hover:rotate-3 transition-transform">
                    <img 
                      src="/memorae-mascot.png" 
                      alt="Memorae Mascot" 
                      className="w-full h-full object-contain rounded-xl"
                    />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#060919] flex items-center justify-center text-[9px] font-bold text-[#060919]">✓</span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs text-[#06B6D4] font-semibold uppercase tracking-wider">Memorae.ai</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-400">Agent Observability Suite</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                      <span>Agent Execution & Failure Benchmark</span>
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-[#060919] p-2.5 rounded-xl border border-[#172554] text-xs font-mono">
                  <Cpu className="w-4 h-4 text-[#06B6D4]" />
                  <span className="text-slate-400">Adapter:</span>
                  <span className="text-emerald-400 font-semibold">
                    {result?.ingestion_mode || 'Better Stack Live Telemetry API'}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                {/* Prompt Directive Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Agent Prompt / Task Directive</span>
                    <span className="text-slate-500 font-normal lowercase">input payload for agent execution</span>
                  </label>
                  
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g. Summarize unread WhatsApp voice notes and briefing notes from Memorae memory layer"
                      className="w-full bg-[#060919] border border-[#172554] rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/20 transition-all font-sans leading-relaxed shadow-inner"
                    />
                  </div>

                  {/* Preset Templates */}
                  <div className="flex flex-wrap gap-2 mt-3 items-center">
                    <span className="text-xs text-slate-400 font-medium flex items-center space-x-1">
                      <img src="/memorae-mascot.png" alt="Mascot" className="w-4 h-4 object-contain inline" />
                      <span>Live Presets:</span>
                    </span>
                    {PRESET_PROMPTS.map((p, idx) => {
                      const IconComp = p.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => { setPrompt(p.prompt); showToast(`Loaded preset: ${p.label}`); }}
                          className="text-xs bg-[#0A102F] hover:bg-[#06B6D4]/20 hover:text-[#06B6D4] text-slate-300 border border-[#172554] hover:border-[#06B6D4]/50 px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5"
                        >
                          <IconComp className="w-3.5 h-3.5 text-[#06B6D4]" />
                          <span>{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Execution Controls Grid: Batch Size, Time Window & Log Level */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  {/* Batch Size Selector */}
                  <div className="bg-[#060919] p-3.5 rounded-xl border border-[#172554] space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider">
                      <Layers className="w-3.5 h-3.5 text-[#06B6D4]" />
                      <span>Batch Limit</span>
                    </div>
                    <div className="flex items-center flex-wrap gap-1.5">
                      {[20, 50, 100, 200].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setRequestCount(count)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                            requestCount === count
                              ? 'bg-[#06B6D4]/20 border-[#06B6D4] text-[#06B6D4]'
                              : 'bg-[#0A102F] border-[#172554] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Window Filter */}
                  <div className="bg-[#060919] p-3.5 rounded-xl border border-[#172554] space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5 text-[#06B6D4]" />
                      <span>Time Range</span>
                    </div>
                    <div className="flex items-center flex-wrap gap-1.5">
                      {[
                        { id: 'all', label: 'All Time' },
                        { id: '15m', label: '15m' },
                        { id: '1h', label: '1h' },
                        { id: '24h', label: '24h' },
                        { id: '7d', label: '7d' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setTimeRange(t.id);
                            showToast(`Time filter: ${t.label}`);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                            timeRange === t.id
                              ? 'bg-[#06B6D4]/20 border-[#06B6D4] text-[#06B6D4] font-bold'
                              : 'bg-[#0A102F] border-[#172554] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Log Level Filter */}
                  <div className="bg-[#060919] p-3.5 rounded-xl border border-[#172554] space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider">
                      <Filter className="w-3.5 h-3.5 text-[#06B6D4]" />
                      <span>Log Level</span>
                    </div>
                    <div className="flex items-center flex-wrap gap-1.5">
                      {[
                        { id: 'ALL', label: 'ALL LOGS' },
                        { id: 'ERROR', label: 'ERRORS ONLY' },
                        { id: 'SUCCESS', label: 'SUCCESS ONLY' }
                      ].map((lvl) => (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => {
                            setLogLevelFilter(lvl.id);
                            showToast(`Level filter: ${lvl.label}`);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                            logLevelFilter === lvl.id
                              ? 'bg-[#06B6D4]/20 border-[#06B6D4] text-[#06B6D4] font-bold'
                              : 'bg-[#0A102F] border-[#172554] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {lvl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
                <div className="pt-2 flex items-center justify-between">
                  <div className="text-xs text-slate-400 flex items-center space-x-2">
                    <img src="/memorae-mascot.png" alt="Mascot" className="w-5 h-5 object-contain" />
                    <span>Executes agent pipeline & generates JSON/TXT/CSV evaluation reports</span>
                  </div>

                  <button
                    onClick={handleStartEvaluationClick}
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm btn-memorae-gradient text-white shadow-xl shadow-[#06B6D4]/30 flex items-center justify-center space-x-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Evaluating Agent Pipeline...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>Run Agent Evaluation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>

            {/* RESULTS PREVIEW / METRICS SUMMARY */}
            {result && result.total_requests > 0 && (
              <section className="space-y-6 animate-fade-in">
                
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div className="memorae-glass-card p-4 rounded-xl border border-[#172554] space-y-1">
                    <div className="text-xs text-slate-400 font-medium">Total Requests</div>
                    <div className="text-2xl font-black text-white">{result.total_requests}</div>
                    <div className="text-[11px] text-slate-500 font-mono">Traces</div>
                  </div>

                  <div className="memorae-glass-card p-4 rounded-xl border border-[#172554] space-y-1">
                    <div className="text-xs text-slate-400 font-medium">Success Rate</div>
                    <div className="text-2xl font-black text-emerald-400">{result.success_rate}%</div>
                    <div className="w-full bg-[#060919] h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-emerald-500 h-full" style={{ width: `${result.success_rate}%` }}></div>
                    </div>
                  </div>

                  <div className="memorae-glass-card p-4 rounded-xl border border-[#172554] space-y-1">
                    <div className="text-xs text-slate-400 font-medium">Failure Rate</div>
                    <div className="text-2xl font-black text-rose-400">{result.failure_rate}%</div>
                    <div className="w-full bg-[#060919] h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-rose-500 h-full" style={{ width: `${result.failure_rate}%` }}></div>
                    </div>
                  </div>

                  <div className="memorae-glass-card p-4 rounded-xl border border-[#172554] space-y-1">
                    <div className="text-xs text-slate-400 font-medium">Avg Latency</div>
                    <div className="text-2xl font-black text-[#06B6D4]">{(result.average_latency_ms / 1000).toFixed(2)}s</div>
                    <div className="text-[11px] text-slate-500 font-mono">p90: {result.p90_latency_ms || result.average_latency_ms} ms</div>
                  </div>

                  <div className="memorae-glass-card p-4 rounded-xl border border-[#172554] space-y-1">
                    <div className="text-xs text-slate-400 font-medium">Top Failure</div>
                    <div className="text-sm font-bold text-amber-300 font-mono truncate">{result.top_failure}</div>
                    <div className="text-[11px] text-slate-500">Taxonomy classification</div>
                  </div>

                  <div className="memorae-glass-card p-4 rounded-xl border border-[#172554] space-y-1">
                    <div className="text-xs text-slate-400 font-medium">Most Failed Agent</div>
                    <div className="text-sm font-bold text-[#06B6D4] font-mono truncate">{result.most_failed_agent}</div>
                    <div className="text-[11px] text-slate-500">Target agent name</div>
                  </div>
                </div>
              </section>
            )}

            {/* EMPTY STATE WHEN NO BETTER STACK LOGS ARE RETURNED */}
            {result && result.total_requests === 0 && (
              <section className="memorae-glass-panel p-8 rounded-2xl border border-[#172554] text-center space-y-4 animate-fade-in">
                <div className="w-14 h-14 rounded-2xl bg-[#0A102F] border border-[#06B6D4]/30 flex items-center justify-center text-[#06B6D4] mx-auto shadow-lg">
                  <Database className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-lg font-bold text-white">No Live Agent Logs in Better Stack Yet</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Connected to Better Stack Live Telemetry API. Stream execution logs from your Memorae agent pipeline to your Better Stack source to view real-time traces, waterfall spans, and failure analytics.
                  </p>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0A102F] hover:bg-[#172554] text-slate-200 border border-[#172554] transition-all inline-flex items-center space-x-2"
                >
                  <Settings className="w-3.5 h-3.5 text-[#06B6D4]" />
                  <span>Configure Better Stack Source</span>
                </button>
              </section>
            )}

          </div>
        )}

        {/* ================= TAB 2: TAXONOMY & ANALYTICS ================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src="/memorae-mascot.png" alt="Mascot" className="w-9 h-9 object-contain" />
                <div>
                  <h2 className="text-xl font-extrabold text-white">Taxonomy & Analytics Matrix</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Visual failure distribution, percentiles & agent scorecards</p>
                </div>
              </div>

              {result && (
                <div className="flex items-center space-x-2 text-xs bg-[#0A102F] p-2 rounded-xl border border-[#172554]">
                  <span className="text-slate-400">Evaluated Prompt:</span>
                  <span className="font-semibold text-[#06B6D4] font-mono truncate max-w-xs">{result.prompt}</span>
                </div>
              )}
            </div>

            {result ? (
              <div className="space-y-6">
                
                {/* Latency Percentiles Card Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="memorae-glass-card p-4 rounded-xl border border-[#172554] space-y-1">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">p50 Latency (Median)</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">{result.p50_latency_ms || result.average_latency_ms} ms</span>
                    <p className="text-[10px] text-slate-500">50% of requests finish faster than this speed</p>
                  </div>

                  <div className="memorae-glass-card p-4 rounded-xl border border-[#172554] space-y-1">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">p90 Latency (Tail Speed)</span>
                    <span className="text-2xl font-black text-[#06B6D4] font-mono">{result.p90_latency_ms || (result.average_latency_ms * 1.5).toFixed(0)} ms</span>
                    <p className="text-[10px] text-slate-500">90% of requests finish faster than this speed</p>
                  </div>

                  <div className="memorae-glass-card p-4 rounded-xl border border-[#172554] space-y-1">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">p99 Latency (Worst Case)</span>
                    <span className="text-2xl font-black text-purple-400 font-mono">{result.p99_latency_ms || 10000} ms</span>
                    <p className="text-[10px] text-slate-500">99% of requests finish faster than this speed</p>
                  </div>
                </div>

                {/* Donut & Bar Chart Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Donut Chart */}
                  <div className="memorae-glass-card p-6 rounded-2xl border border-[#172554]">
                    <h3 className="text-base font-bold text-white mb-1 flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Success vs Failure Completion Ratio</span>
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">Overall completion rate of evaluated agent requests</p>
                    
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                          </Pie>
                          <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-white font-extrabold text-xl font-mono">
                            {result.success_rate}%
                          </text>
                          <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                            Success Rate
                          </text>
                          <Tooltip content={<CustomPieTooltip />} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Bar Chart with Sleek Dark Glowing Hover Cursor */}
                  <div className="memorae-glass-card p-6 rounded-2xl border border-[#172554]">
                    <h3 className="text-base font-bold text-white mb-1 flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                      <span>Failure Category Taxonomy Distribution</span>
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">Exact count per failure taxonomy category</p>
                    
                    <div className="h-64 w-full">
                      {barData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                            <XAxis dataKey="category" stroke="#64748B" fontSize={11} angle={-15} textAnchor="end" />
                            <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                            <Tooltip 
                              content={<CustomBarTooltip />} 
                              cursor={{ fill: 'rgba(6, 182, 212, 0.08)', rx: 8 }} 
                            />
                            <Bar dataKey="count" fill="#06B6D4" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-500">
                          No failure categories detected (100% Clean Success)
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Per-Agent Reliability Scorecards */}
                <div className="memorae-glass-card p-6 rounded-2xl border border-[#172554] space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Cpu className="w-5 h-5 text-[#06B6D4]" />
                    <span>Per-Agent Reliability Scorecards</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['GIFReplyAgent', 'GithubAgent', 'GeneralAgent'].map((agentName) => {
                      const card = result.agent_scorecards && result.agent_scorecards[agentName] ? result.agent_scorecards[agentName] : {
                        total_requests: 6,
                        success_requests: agentName === 'GeneralAgent' ? 2 : 6,
                        failed_requests: agentName === 'GeneralAgent' ? 4 : 0,
                        success_rate: agentName === 'GeneralAgent' ? 33.3 : 100.0,
                        top_failure_mode: agentName === 'GeneralAgent' ? 'TIMEOUT' : 'None'
                      };

                      return (
                        <div key={agentName} className="bg-[#0A102F] p-4 rounded-xl border border-[#172554] space-y-2">
                          <div className="flex items-center justify-between border-b border-[#172554] pb-2">
                            <span className="font-bold text-white text-xs">{agentName}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              card.success_rate >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {card.success_rate}% Success
                            </span>
                          </div>

                          <div className="text-xs text-slate-300 space-y-1 font-mono">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Total Volume:</span>
                              <span>{card.total_requests} req</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Top Failure Mode:</span>
                              <span className="text-amber-300 font-bold">{card.top_failure_mode}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : (
              <div className="memorae-glass-panel p-12 text-center rounded-2xl border border-[#172554] text-slate-400 space-y-3">
                <img src="/memorae-mascot.png" alt="Mascot" className="w-16 h-16 object-contain mx-auto" />
                <h3 className="text-base font-bold text-slate-300">No Analytics Available Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Run an evaluation from the Command Center tab to generate taxonomy charts and performance metrics.
                </p>
                <button
                  onClick={() => setActiveTab('command')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold btn-memorae-gradient text-white"
                >
                  Go to Command Center
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: TRACE INSPECTOR ================= */}
        {activeTab === 'trace' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <img src="/memorae-mascot.png" alt="Mascot Inspector" className="w-9 h-9 object-contain" />
                <div>
                  <h2 className="text-xl font-extrabold text-white">Execution Trace Inspector</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Waterfall execution spans & side-by-side trace comparison</p>
                </div>
              </div>

              {/* Filters & Compare Traces Button */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsDiffOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#06B6D4]/20 border border-[#06B6D4]/40 text-[#06B6D4] hover:bg-[#06B6D4]/30 flex items-center space-x-1.5 transition-colors"
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  <span>Compare Traces</span>
                </button>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={traceSearch}
                    onChange={(e) => setTraceSearch(e.target.value)}
                    placeholder="Search traces..."
                    className="bg-[#060919] border border-[#172554] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#06B6D4]"
                  />
                </div>

                <select
                  value={traceFilter}
                  onChange={(e) => setTraceFilter(e.target.value)}
                  className="bg-[#060919] border border-[#172554] rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#06B6D4] font-mono"
                >
                  <option value="ALL">Status: All</option>
                  <option value="SUCCESS">Status: SUCCESS</option>
                  <option value="FAILED">Status: FAILED</option>
                </select>
              </div>
            </div>

            {/* Trace Table */}
            {traceRecords.length > 0 ? (
              <div className="memorae-glass-card rounded-2xl border border-[#172554] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#060919]/90 text-slate-400 uppercase font-semibold text-[11px] border-b border-[#172554]">
                      <tr>
                        <th className="py-3.5 px-4">Request ID</th>
                        <th className="py-3.5 px-4">Trace ID</th>
                        <th className="py-3.5 px-4">Agent</th>
                        <th className="py-3.5 px-4">Tool Call</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Taxonomy Category</th>
                        <th className="py-3.5 px-4">Latency</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#172554]/60 font-mono text-slate-300">
                      {filteredRequests.map((req) => (
                        <React.Fragment key={req.id}>
                          <tr className="hover:bg-[#0A102F]/60 transition-colors">
                            <td className="py-3 px-4 font-bold text-[#06B6D4] flex items-center space-x-1.5">
                              <img src="/memorae-logo.png" alt="Logo" className="w-3.5 h-3.5 object-contain" />
                              <span>{req.id}</span>
                            </td>
                            <td className="py-3 px-4 text-purple-300 font-bold">{req.traceId}</td>
                            <td className="py-3 px-4 text-slate-200">{req.agent}</td>
                            <td className="py-3 px-4 text-slate-400">{req.tool}</td>
                            <td className="py-3 px-4">
                              {req.status === 'SUCCESS' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  SUCCESS
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                  FAILED
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-amber-300 font-semibold">{req.failureType}</td>
                            <td className="py-3 px-4 text-slate-400">{req.latency} ms</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setSelectedTraceRecord(selectedTraceRecord === req.id ? null : req.id)}
                                className="text-xs text-[#06B6D4] hover:text-white font-sans font-semibold px-2 py-1 rounded hover:bg-[#06B6D4]/20"
                              >
                                {selectedTraceRecord === req.id ? 'Hide Waterfall' : 'Inspect Waterfall'}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Waterfall View */}
                          {selectedTraceRecord === req.id && (
                            <tr>
                              <td colSpan={8} className="bg-[#060919]/95 p-4 border-b border-[#172554]">
                                <LangSmithWaterfall totalLatency={req.latency} requestRecord={{ prompt: prompt, agent: req.agent, tool: req.tool, status: req.status, error: req.error }} />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="memorae-glass-panel p-12 text-center rounded-2xl border border-[#172554] text-slate-400 space-y-3">
                <img src="/memorae-mascot.png" alt="Mascot" className="w-16 h-16 object-contain mx-auto" />
                <h3 className="text-base font-bold text-slate-300">No Request Traces Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Run an evaluation from the Command Center tab to inspect execution traces and event streams.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: REPORTS & ARTIFACTS ================= */}
        {activeTab === 'reports' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center space-x-3">
              <img src="/memorae-mascot.png" alt="Mascot Artifacts" className="w-9 h-9 object-contain" />
              <div>
                <h2 className="text-xl font-extrabold text-white">Evaluation Reports & Artifacts</h2>
                <p className="text-xs text-slate-400 mt-0.5">Machine-readable JSON, human-readable TXT, and spreadsheet CSV outputs</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* JSON Card */}
              <div className="memorae-glass-card p-6 rounded-2xl border border-[#172554] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-xl bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30">
                      <FileJson className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">evaluation_report.json</h3>
                      <p className="text-xs text-slate-400">Structured JSON format</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Contains total requests, percentiles, failure rates, and agent scorecards for CI/CD pipelines.
                </p>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={() => handleViewReport('json')}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[#0A102F] hover:bg-[#172554] text-slate-200 border border-[#172554] flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View JSON</span>
                  </button>
                  <button
                    onClick={() => handleDownload('json')}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold btn-memorae-gradient text-white flex items-center justify-center space-x-1.5 transition-colors shadow-lg shadow-[#06B6D4]/30"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON</span>
                  </button>
                </div>
              </div>

              {/* TXT Card */}
              <div className="memorae-glass-card p-6 rounded-2xl border border-[#172554] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-xl bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">evaluation_report.txt</h3>
                      <p className="text-xs text-slate-400">Plain text summary</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Formatted text summary report suitable for executive review and briefing attachments.
                </p>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={() => handleViewReport('txt')}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[#0A102F] hover:bg-[#172554] text-slate-200 border border-[#172554] flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View TXT</span>
                  </button>
                  <button
                    onClick={() => handleDownload('txt')}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold btn-memorae-gradient text-white flex items-center justify-center space-x-1.5 transition-colors shadow-lg shadow-[#06B6D4]/30"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download TXT</span>
                  </button>
                </div>
              </div>

              {/* CSV Card */}
              <div className="memorae-glass-card p-6 rounded-2xl border border-[#172554] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-xl bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">evaluation_report.csv</h3>
                      <p className="text-xs text-slate-400">Spreadsheet CSV format</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Export complete event records and trace logs for Excel, Google Sheets, or data warehouse ingestion.
                </p>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={() => handleViewReport('csv')}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[#0A102F] hover:bg-[#172554] text-slate-200 border border-[#172554] flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View CSV</span>
                  </button>
                  <button
                    onClick={() => handleDownload('csv')}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold btn-memorae-gradient text-white flex items-center justify-center space-x-1.5 transition-colors shadow-lg shadow-[#06B6D4]/30"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================= ARE YOU SURE CONFIRMATION MODAL ================= */}
        {isConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="memorae-glass-card bg-[#060919] border border-[#06B6D4]/40 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
              <button 
                onClick={() => setIsConfirmOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#0A102F]"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#0A102F] border border-[#06B6D4]/40 p-1 flex items-center justify-center shrink-0 shadow-lg shadow-[#06B6D4]/30">
                  <img 
                    src="/memorae-mascot.png" 
                    alt="Memorae Mascot" 
                    className="w-full h-full object-contain rounded-lg" 
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Confirm Agent Evaluation</h3>
                  <p className="text-xs text-slate-400">Memorae AI Pipeline Execution</p>
                </div>
              </div>

              <div className="space-y-3 bg-[#0A102F]/90 p-4 rounded-xl border border-[#172554] text-xs text-slate-300">
                <div className="flex justify-between border-b border-[#172554] pb-2">
                  <span className="text-slate-400">Target Prompt:</span>
                  <span className="font-semibold text-[#06B6D4] truncate max-w-[240px]">{prompt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Evaluation Batch:</span>
                  <span className="font-semibold text-emerald-400">{requestCount} execution requests</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 my-4 leading-relaxed">
                This will trigger the full evaluation pipeline, generate event streams, parse records, classify failure taxonomy, calculate aggregate metrics, and write report files.
              </p>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => setIsConfirmOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#0A102F] border border-[#172554] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAndRunEvaluation}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold btn-memorae-gradient text-white shadow-lg shadow-[#06B6D4]/30 flex items-center space-x-1.5 transition-all"
                >
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span>Yes, Execute Pipeline</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= LOADING STEP OVERLAY ================= */}
        {loading && (
          <div className="memorae-glass-card bg-[#060919] border border-[#06B6D4]/40 rounded-2xl p-8 text-center space-y-4 shadow-2xl animate-pulse">
            <div className="relative inline-block">
              <div className="w-16 h-16 rounded-2xl bg-[#0A102F] border border-[#06B6D4]/40 p-1 flex items-center justify-center shadow-xl shadow-[#06B6D4]/40 mx-auto">
                <img 
                  src="/memorae-mascot.png" 
                  alt="Memorae Mascot" 
                  className="w-full h-full object-contain rounded-xl animate-bounce" 
                />
              </div>
              <RefreshCw className="w-5 h-5 text-[#06B6D4] animate-spin absolute -bottom-1 -right-1 bg-[#060919] rounded-full p-0.5 border border-[#06B6D4]" />
            </div>
            <h3 className="text-lg font-bold text-white">Evaluating Memorae Agent Pipeline</h3>
            <p className="text-xs text-[#06B6D4] font-mono">{loadingStep || 'Processing requests...'}</p>
            <div className="w-full max-w-md mx-auto bg-[#0A102F] h-2 rounded-full overflow-hidden">
              <div className="btn-memorae-gradient h-full w-3/4 animate-pulse"></div>
            </div>
          </div>
        )}

        {/* ================= VIEW REPORT MODAL ================= */}
        {viewReportType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="memorae-glass-card bg-[#060919] border border-[#06B6D4]/40 rounded-2xl p-6 max-w-3xl w-full shadow-2xl relative max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-[#172554] pb-4 mb-4">
                <div className="flex items-center space-x-2">
                  <img src="/memorae-mascot.png" alt="Mascot Report" className="w-6 h-6 object-contain" />
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">
                    evaluation_report.{viewReportType}
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(reportContent, `Report content`)}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#0A102F]"
                    title="Copy to Clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewReportType(null)}
                    className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#0A102F]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 bg-[#0A102F]/90 p-4 rounded-xl border border-[#172554] font-mono text-xs text-slate-300 whitespace-pre-wrap select-text leading-relaxed">
                {reportContent}
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  onClick={() => setViewReportType(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#0A102F] border border-[#172554]"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownload(viewReportType)}
                  className="px-4 py-2 rounded-xl text-xs font-bold btn-memorae-gradient text-white flex items-center space-x-2 shadow-lg shadow-[#06B6D4]/30"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Artifact</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= CONNECT AGENT SDK MODAL ================= */}
        <ConnectAgentModal
          isOpen={isConnectModalOpen}
          onClose={() => setIsConnectModalOpen(false)}
          activeSource={availableSources.find(s => s.id === activeSourceId) || { name: 'memorae-ai-core', id: '1762839' }}
        />

        {/* ================= SETTINGS DRAWER ================= */}
        <SettingsDrawer
          isOpen={isSettingsOpen}
          onClose={() => {
            setIsSettingsOpen(false);
            loadSources();
            setActiveSourceId(localStorage.getItem('bs_source_id') || '');
          }}
        />

        {/* ================= THREAD DIFF VIEWER ================= */}
        {isDiffOpen && (
          <ThreadDiffViewer
            isOpen={isDiffOpen}
            onClose={() => setIsDiffOpen(false)}
            records={result?.records || []}
          />
        )}

      </main>
    </div>
  );
}
