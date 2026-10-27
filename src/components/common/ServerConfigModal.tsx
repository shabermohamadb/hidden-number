// src/components/common/ServerConfigModal.tsx
import React, { useState } from 'react';
import { X, Server, Check, AlertCircle, RefreshCw, ExternalLink, Globe } from 'lucide-react';
import { getServerUrl, setServerUrl } from '../../config/serverUrl';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onReconnected: () => void;
}

export const ServerConfigModal: React.FC<Props> = ({ isOpen, onClose, onReconnected }) => {
  const { playClick } = useSoundFX();
  const [url, setUrl] = useState<string>(getServerUrl());
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async (targetUrl: string) => {
    setTesting(true);
    setTestResult(null);
    try {
      const cleanUrl = targetUrl.trim().replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/api/health`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setTestResult({
          success: true,
          message: `Server connected! Active rooms: ${data.activeRooms}`
        });
      } else {
        setTestResult({
          success: false,
          message: `Server responded with HTTP ${res.status}. Check endpoint.`
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: 'Could not reach server. Verify URL and CORS settings.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    setServerUrl(url);
    onReconnected();
    onClose();
  };

  const handleResetToDefault = () => {
    playClick();
    setServerUrl('');
    setUrl(window.location.origin);
    onReconnected();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0B0F19] border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-500/10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <h2 className="font-display font-black text-xl text-white tracking-wide">
              BACKEND SERVER CONNECTION
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Why is it offline? Explanation */}
        <div className="mt-4 p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-slate-300 space-y-2">
          <div className="font-bold text-cyan-300 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Why does it show OFFLINE on Vercel?</span>
          </div>
          <p className="leading-relaxed">
            Vercel is a static web host and cannot maintain the long-lived, continuous WebSockets required for multiplayer party games.
          </p>
          <p className="leading-relaxed">
            Your Node.js backend (<code className="text-cyan-200">server/index.js</code>) needs to run on a persistent server host such as <strong>Render</strong>, <strong>Railway</strong>, or <strong>Fly.io</strong>.
          </p>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-2">
              WebSocket Server URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="https://your-backend.onrender.com"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setTestResult(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={() => handleTestConnection(url)}
                disabled={testing || !url.trim()}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-mono font-bold text-cyan-300 transition-all disabled:opacity-40"
              >
                {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Test'}
              </button>
            </div>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              {testResult.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Quick Deploy Guide */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-slate-400 space-y-2">
            <div className="font-semibold text-slate-200 uppercase font-mono tracking-wider">
              How to deploy backend in 2 minutes (Free):
            </div>
            <ol className="list-decimal pl-4 space-y-1 font-mono text-[11px] text-slate-300">
              <li>Deploy repo to <strong>Render.com</strong> as a <em>Web Service</em></li>
              <li>Build command: <code className="text-cyan-300">npm install</code></li>
              <li>Start command: <code className="text-cyan-300">npm run server</code></li>
              <li>Copy your Render URL (e.g. <code className="text-cyan-300">https://xyz.onrender.com</code>) and paste it here!</li>
            </ol>
            <div className="pt-1 text-[11px] text-slate-400">
              Tip: In Vercel Project Settings, you can also add <code className="text-cyan-300">VITE_SERVER_URL</code> to automatically configure it for all players!
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-xs font-mono text-slate-400 hover:text-white underline"
            >
              Reset to Current Host
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
