// src/components/common/ServerConfigModal.tsx
import React, { useState } from 'react';
import { X, Server, Check, AlertCircle, RefreshCw, Globe } from 'lucide-react';
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
    setUrl(getServerUrl());
    onReconnected();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0D1017] border border-[#C5A059]/35 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#C5A059]/20">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="font-display font-black text-xl text-[#F5F2EB] tracking-wide">
              BACKEND SERVER CONNECTION
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#131722] hover:bg-[#1B2130] text-[#A7A29A] hover:text-[#F5F2EB] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Why is it offline? Explanation */}
        <div className="mt-4 p-4 rounded-2xl bg-[#131722] border border-[#C5A059]/25 text-xs text-[#A7A29A] space-y-2">
          <div className="font-bold text-[#D4AF37] flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-[#D4AF37]" />
            <span>Why does it show OFFLINE on Vercel?</span>
          </div>
          <p className="leading-relaxed">
            Vercel is a static web host and cannot maintain the persistent WebSockets required for real-time multiplayer deduction.
          </p>
          <p className="leading-relaxed">
            Your Node.js backend (<code className="text-[#F3E5AB]">server/index.js</code>) runs on persistent cloud server hosts such as <strong>Render</strong>, <strong>Railway</strong>, or <strong>Fly.io</strong>.
          </p>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#A7A29A] mb-2">
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
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#131722] border border-[#C5A059]/30 text-[#F5F2EB] placeholder-[#5A564F] text-sm font-mono focus:outline-none focus:border-[#D4AF37]"
              />
              <button
                type="button"
                onClick={() => handleTestConnection(url)}
                disabled={testing || !url.trim()}
                className="px-4 py-2.5 rounded-xl bg-[#181E2C] hover:bg-[#222A3E] border border-[#C5A059]/30 text-xs font-mono font-bold text-[#D4AF37] transition-all disabled:opacity-40"
              >
                {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Test'}
              </button>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-[11px] text-[#A7A29A] font-mono">Quick Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setUrl('https://hidden-number.onrender.com');
                  setTestResult(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#181E2C] hover:bg-[#222A3E] border border-[#C5A059]/20 text-[11px] font-mono text-[#F3E5AB] transition-colors"
              >
                Render Cloud (hidden-number.onrender.com)
              </button>
              <button
                type="button"
                onClick={() => {
                  setUrl('http://localhost:3001');
                  setTestResult(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#181E2C] hover:bg-[#222A3E] border border-[#C5A059]/20 text-[11px] font-mono text-[#A7A29A] hover:text-[#F3E5AB] transition-colors"
              >
                Localhost:3001
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
          <div className="p-4 rounded-2xl bg-[#131722]/80 border border-[#C5A059]/20 text-xs text-[#8F8B83] space-y-2">
            <div className="font-semibold text-[#F5F2EB] uppercase font-mono tracking-wider">
              How to deploy backend in 2 minutes (Free):
            </div>
            <ol className="list-decimal pl-4 space-y-1 font-mono text-[11px] text-[#A7A29A]">
              <li>Deploy repo to <strong>Render.com</strong> as a <em>Web Service</em></li>
              <li>Build command: <code className="text-[#D4AF37]">npm install</code></li>
              <li>Start command: <code className="text-[#D4AF37]">npm run server</code></li>
              <li>Copy your Render URL (e.g. <code className="text-[#D4AF37]">https://xyz.onrender.com</code>) and paste it here!</li>
            </ol>
            <div className="pt-1 text-[11px] text-[#8F8B83]">
              Tip: In Vercel Project Settings, you can also add <code className="text-[#D4AF37]">VITE_SERVER_URL</code> to automatically configure it for all players!
            </div>
          </div>

          <div className="pt-4 border-t border-[#C5A059]/20 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-xs font-mono text-[#8F8B83] hover:text-[#FAF8F5] underline"
            >
              Reset to Current Host
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#131722] hover:bg-[#1B2130] text-[#A7A29A] font-semibold text-xs border border-[#C5A059]/20"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#9A7B38] via-[#D4AF37] to-[#8C6D34] hover:from-[#B89243] hover:via-[#E5C158] hover:to-[#A7833D] text-black font-bold text-xs shadow-md shadow-[#D4AF37]/20 border border-[#F3E5AB]/30 transition-all"
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
