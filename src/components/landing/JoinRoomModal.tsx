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
      <div className="relative w-full max-w-md bg-[#101719] border border-[#293130] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80">
        <div className="flex items-center justify-between pb-4 border-b border-[#293130]">
          <div>
            <h2 className="font-display font-bold text-xl text-[#F1EBDD] tracking-wide">
              JOIN ROOM
            </h2>
            <p className="text-xs text-[#A8ADA7] font-sans mt-0.5">
              Enter the 6-character room code to enter the arena
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#151D1D] hover:bg-[#1E2728] text-[#A8ADA7] hover:text-[#F1EBDD] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#A8ADA7] mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#A8C66C]" />
              <span>Room Code</span>
            </label>
            <input
              type="text"
              required
              maxLength={8}
              placeholder="e.g. 7A8B9C"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full text-center tracking-widest font-mono font-bold text-2xl px-4 py-3 rounded-xl bg-[#151D1D] border border-[#293130] text-[#F1EBDD] placeholder-[#A8ADA7]/40 focus:outline-none focus:border-[#A8C66C]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#A8ADA7] mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#A8ADA7]" />
              <span>Password (if required)</span>
            </label>
            <input
              type="password"
              placeholder="Leave blank for public room"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#151D1D] border border-[#293130] text-[#F1EBDD] placeholder-[#A8ADA7]/40 text-xs font-mono focus:outline-none focus:border-[#A8C66C]"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-[#E05D52]/40 text-[#E05D52] text-xs font-mono">
              {errorMessage}
            </div>
          )}

          <div className="pt-4 border-t border-[#293130] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#151D1D] hover:bg-[#1E2728] text-[#A8ADA7] font-semibold text-xs transition-all border border-[#293130]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !code.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#A8C66C] hover:bg-[#B8D47C] text-[#070B0D] font-display font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 disabled:opacity-50"
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
