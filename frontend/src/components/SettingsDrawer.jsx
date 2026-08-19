import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Server,
  Key,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Globe,
  Sliders,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

export default function SettingsDrawer({ isOpen, onClose }) {
  const [betterstackToken, setBetterstackToken] = useState(localStorage.getItem('bs_token') || '');
  const [sourceId, setSourceId] = useState(localStorage.getItem('bs_source_id') || '');
  const [availableSources, setAvailableSources] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bs_available_sources') || '[]');
    } catch {
      return [];
    }
  });
  const [pollInterval, setPollInterval] = useState('30');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (isOpen && betterstackToken.trim() && availableSources.length === 0) {
      handleTestConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('bs_token', betterstackToken.trim());
    localStorage.setItem('bs_source_id', sourceId.trim());
    onClose();
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    const token = betterstackToken.trim();
    if (!token) {
      setTesting(false);
      setTestResult({
        status: 'error',
        message: 'Please enter a Better Stack API Token first.'
      });
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/betterstack/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token,
          source_id: sourceId.trim()
        })
      });

      setTesting(false);
      const data = await response.json();
      if (data.success) {
        setTestResult({
          status: 'success',
          message: data.message
        });
        if (data.sources && Array.isArray(data.sources)) {
          setAvailableSources(data.sources);
          localStorage.setItem('bs_available_sources', JSON.stringify(data.sources));
        }
      } else {
        setTestResult({
          status: 'error',
          message: data.message
        });
      }
    } catch (e) {
      setTesting(false);
      setTestResult({
        status: 'error',
        message: 'Could not reach backend server at http://127.0.0.1:8000.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#060919] border-l border-[#172554] w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
        
        <div className="space-y-6">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-[#172554] pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#0A102F] border border-[#06B6D4]/40 flex items-center justify-center text-[#06B6D4]">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Better Stack Telemetry API</h3>
                <p className="text-xs text-slate-400">Live Log Ingestion Credentials</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#0A102F]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* How to Get Token Help Card */}
          <div className="bg-[#0A102F] p-4 rounded-xl border border-[#06B6D4]/40 space-y-2 text-xs">
            <div className="flex items-center justify-between font-semibold text-[#06B6D4]">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <span>How to Get Your API Token</span>
              </div>
              <a
                href="https://telemetry.betterstack.com"
                target="_blank"
                rel="noreferrer"
                className="text-[#06B6D4] hover:underline flex items-center space-x-1"
              >
                <span>Dashboard</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-slate-300 leading-relaxed">
              1. Log into <strong>telemetry.betterstack.com</strong><br />
              2. Go to <strong>API Tokens</strong> (left sidebar)<br />
              3. Click <strong>Create API Token</strong> and copy the token.
            </p>
          </div>

          {/* Better Stack Credentials Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Better Stack Team API Token</span>
                <span className="text-slate-500 font-normal lowercase">Bearer Token</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={betterstackToken}
                  onChange={(e) => setBetterstackToken(e.target.value)}
                  placeholder="Paste your Better Stack Team API Token"
                  className="w-full bg-[#0A102F] border border-[#172554] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#06B6D4] font-mono"
                />
                <Key className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Target Log Source</span>
                <span className="text-slate-500 font-normal lowercase">Filter by Source</span>
              </label>
              
              {availableSources && availableSources.length > 0 ? (
                <div className="relative">
                  <select
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    className="w-full bg-[#0A102F] border border-[#172554] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#06B6D4] font-sans appearance-none cursor-pointer"
                  >
                    <option value="">All Sources in Team (Default)</option>
                    {availableSources.map((src) => (
                      <option key={src.id} value={src.id}>
                        {src.name} (ID: {src.id})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    placeholder="Leave empty for all sources (or enter ID)"
                    className="w-full bg-[#0A102F] border border-[#172554] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#06B6D4] font-mono"
                  />
                  <Database className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Stream Sync Frequency</span>
                <span className="text-slate-500 font-normal lowercase">Seconds</span>
              </label>
              <select
                value={pollInterval}
                onChange={(e) => setPollInterval(e.target.value)}
                className="w-full bg-[#0A102F] border border-[#172554] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
              >
                <option value="10">Realtime (10s Sync)</option>
                <option value="30">Standard (30s Sync)</option>
                <option value="60">Batch (60s Sync)</option>
              </select>
            </div>
          </div>

          {/* Test Connection Button */}
          <div>
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="w-full bg-[#0A102F] hover:bg-[#172554] border border-[#172554] hover:border-[#06B6D4]/50 text-slate-200 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-[#06B6D4] animate-spin" />
                  <span>Verifying Token with Better Stack...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-[#06B6D4]" />
                  <span>Test API Connection & Load Sources</span>
                </>
              )}
            </button>

            {testResult && (
              <div className={`mt-3 p-3 rounded-xl border text-xs flex items-center space-x-2 animate-fade-in ${
                testResult.status === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}>
                {testResult.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#172554] flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-[#0A102F]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-memorae-gradient text-white text-xs font-bold px-5 py-2 rounded-xl shadow-lg shadow-[#06B6D4]/30 flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>

      </div>
    </div>
  );
}
