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
      <div className="relative w-full max-w-lg bg-[#101719] border border-[#293130] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#293130]">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-[#A8C66C]" />
            <h2 className="font-display font-bold text-xl text-[#F1EBDD] tracking-wide">
              SERVER CONNECTION
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#151D1D] hover:bg-[#1E2728] text-[#A8ADA7] hover:text-[#F1EBDD] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Why is it offline explanation */}
        <div className="mt-4 p-4 rounded-xl bg-[#151D1D] border border-[#293130] text-xs text-[#A8ADA7] space-y-2">
          <div className="font-bold text-[#F1EBDD] flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-[#A8C66C]" />
            <span>Multiplayer Backend Routing</span>
          </div>
          <p className="leading-relaxed">
            Vercel hosts the client application, while your persistent Node.js WebSocket engine runs on cloud hosts (such as Render).
          </p>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#A8ADA7] mb-2">
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
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#151D1D] border border-[#293130] text-[#F1EBDD] placeholder-[#A8ADA7]/40 text-xs font-mono focus:outline-none focus:border-[#A8C66C]"
              />
              <button
                type="button"
                onClick={() => handleTestConnection(url)}
                disabled={testing || !url.trim()}
                className="px-4 py-2.5 rounded-xl bg-[#151D1D] hover:bg-[#1E2728] border border-[#293130] text-xs font-mono font-bold text-[#A8C66C] transition-all disabled:opacity-40"
              >
                {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Test'}
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-[11px] text-[#A8ADA7] font-mono">Quick Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setUrl('https://hidden-number.onrender.com');
                  setTestResult(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#151D1D] hover:bg-[#1E2728] border border-[#293130] text-[11px] font-mono text-[#F1EBDD] transition-colors"
              >
                Render Cloud (hidden-number.onrender.com)
              </button>
              <button
                type="button"
                onClick={() => {
                  setUrl('http://localhost:3001');
                  setTestResult(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#151D1D] hover:bg-[#1E2728] border border-[#293130] text-[11px] font-mono text-[#A8ADA7] hover:text-[#F1EBDD] transition-colors"
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
              {testResult.success ? <Check className="w-4 h-4 shrink-0 text-[#A8C66C]" /> : <AlertCircle className="w-4 h-4 shrink-0 text-[#E05D52]" />}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="pt-4 border-t border-[#293130] flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-xs font-mono text-[#A8ADA7] hover:text-[#F1EBDD] underline"
            >
              Reset to Default
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#151D1D] hover:bg-[#1E2728] text-[#A8ADA7] font-semibold text-xs border border-[#293130]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#A8C66C] hover:bg-[#B8D47C] text-[#070B0D] font-display font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-98"
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
