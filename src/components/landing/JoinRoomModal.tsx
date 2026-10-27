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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0D1017] border border-[#C5A059]/35 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80">
        <div className="flex items-center justify-between pb-4 border-b border-[#C5A059]/20">
          <div>
            <h2 className="font-display font-black text-xl text-[#FAF8F5] tracking-wide">
              JOIN ROOM
            </h2>
            <p className="text-xs text-[#8F8B83] font-sans mt-0.5">
              Enter the 6-character room code to enter the arena
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#131722] hover:bg-[#1B2130] text-[#A7A29A] hover:text-[#FAF8F5] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#A7A29A] mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Room Code</span>
            </label>
            <input
              type="text"
              required
              maxLength={8}
              placeholder="e.g. 7A8B9C"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full text-center tracking-widest font-mono font-bold text-2xl px-4 py-3 rounded-2xl bg-[#131722] border border-[#C5A059]/40 text-[#D4AF37] placeholder-[#5A564F] focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#A7A29A] mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#8F8B83]" />
              <span>Password (if required)</span>
            </label>
            <input
              type="password"
              placeholder="Leave blank for public room"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#131722] border border-[#C5A059]/30 text-[#F5F2EB] placeholder-[#5A564F] text-sm font-mono focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono">
              {errorMessage}
            </div>
          )}

          <div className="pt-4 border-t border-[#C5A059]/20 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[#131722] hover:bg-[#1B2130] text-[#A7A29A] font-semibold text-sm transition-all border border-[#C5A059]/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !code.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#9A7B38] via-[#D4AF37] to-[#8C6D34] hover:from-[#B89243] hover:via-[#E5C158] hover:to-[#A7833D] text-black font-bold text-sm shadow-lg shadow-[#D4AF37]/20 border border-[#F3E5AB]/30 transition-all disabled:opacity-50"
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
