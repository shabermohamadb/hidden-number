// src/components/landing/JoinRoomModal.tsx
import React, { useState } from 'react';
import { X, ArrowRight, Lock, KeyRound } from 'lucide-react';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (roomCode: string, password?: string) => void;
  isLoading: boolean;
  errorMessage?: string | null;
}

export const JoinRoomModal: React.FC<Props> = ({ isOpen, onClose, onJoin, isLoading, errorMessage }) => {
  const { playClick } = useSoundFX();
  const [code, setCode] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    playClick();
    onJoin(code.trim().toUpperCase(), password.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0B0F19] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-500/10">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="font-display font-black text-xl text-white tracking-wide">
              JOIN ROOM
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Enter the 6-character room code to enter the arena
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>Room Code</span>
            </label>
            <input
              type="text"
              required
              maxLength={8}
              placeholder="e.g. 7A8B9C"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full text-center tracking-widest font-mono font-bold text-2xl px-4 py-3 rounded-2xl bg-white/5 border border-white/15 text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Password (if required)</span>
            </label>
            <input
              type="password"
              placeholder="Leave blank for public room"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-cyan-400"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono">
              {errorMessage}
            </div>
          )}

          <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !code.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
            >
              <span>{isLoading ? 'Joining...' : 'Join Arena'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

