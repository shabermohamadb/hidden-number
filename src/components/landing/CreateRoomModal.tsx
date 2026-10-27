// src/components/landing/CreateRoomModal.tsx
import React, { useState } from 'react';
import { X, Shield, Users, Clock, Hash, Lock } from 'lucide-react';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (settings: {
    visibility: 'public' | 'private';
    questionTime: number;
    guessTime: number;
    totalRounds: number;
    minPlayers: number;
    maxPlayers: number;
    password?: string | null;
  }) => void;
  isLoading: boolean;
}

export const CreateRoomModal: React.FC<Props> = ({ isOpen, onClose, onCreate, isLoading }) => {
  const { playClick } = useSoundFX();
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [questionTime, setQuestionTime] = useState<number>(60);
  const [totalRounds, setTotalRounds] = useState<number>(3);
  const [minPlayers, setMinPlayers] = useState<number>(2);
  const [maxPlayers, setMaxPlayers] = useState<number>(6);
  const [password, setPassword] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    onCreate({
      visibility,
      questionTime,
      guessTime: 30,
      totalRounds,
      minPlayers,
      maxPlayers,
      password: visibility === 'private' && password.trim() ? password.trim() : null
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#101719] border border-[#293130] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80">
        <div className="flex items-center justify-between pb-4 border-b border-[#293130]">
          <div>
            <h2 className="font-display font-bold text-xl text-[#F1EBDD] tracking-wide">
              CREATE ROOM
            </h2>
            <p className="text-xs text-[#A8ADA7] font-sans mt-0.5">
              Customize game rules and arena parameters
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#151D1D] hover:bg-[#1E2728] text-[#A8ADA7] hover:text-[#F1EBDD] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Room Visibility */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#A8ADA7] mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#A8C66C]" />
              <span>Room Visibility</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setVisibility('public');
                }}
                className={`py-2.5 px-4 rounded-xl border text-xs font-mono font-semibold transition-all ${
                  visibility === 'public'
                    ? 'bg-[#151D1D] border-[#A8C66C] text-[#A8C66C]'
                    : 'bg-[#101719] border-[#293130] text-[#A8ADA7] hover:bg-[#151D1D]'
                }`}
              >
                Public Room
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setVisibility('private');
                }}
                className={`py-2.5 px-4 rounded-xl border text-xs font-mono font-semibold transition-all ${
                  visibility === 'private'
                    ? 'bg-[#151D1D] border-[#A8C66C] text-[#A8C66C]'
                    : 'bg-[#101719] border-[#293130] text-[#A8ADA7] hover:bg-[#151D1D]'
                }`}
              >
                Private Room
              </button>
            </div>
          </div>

          {/* Optional Password for Private Rooms */}
          {visibility === 'private' && (
            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-[#A8ADA7] mb-2 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#C6A45A]" />
                <span>Password (Optional)</span>
              </label>
              <input
                type="password"
                placeholder="Leave blank for no password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#151D1D] border border-[#293130] text-[#F1EBDD] placeholder-[#A8ADA7]/50 text-xs font-mono focus:outline-none focus:border-[#A8C66C]"
              />
            </div>
          )}

          {/* Question Deduction Window */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#A8ADA7] mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#A8C66C]" />
                <span>Question Window</span>
              </span>
              <span className="text-[#F1EBDD] font-bold">{questionTime}s</span>
            </label>
            <input
              type="range"
              min="30"
              max="120"
              step="15"
              value={questionTime}
              onChange={(e) => setQuestionTime(Number(e.target.value))}
              className="w-full accent-[#A8C66C] bg-[#151D1D]"
            />
          </div>

          {/* Total Rounds */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#A8ADA7] mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#A8C66C]" />
                <span>Total Match Rounds</span>
              </span>
              <span className="text-[#F1EBDD] font-bold">{totalRounds}</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 3, 5, 7].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    playClick();
                    setTotalRounds(num);
                  }}
                  className={`py-2 rounded-xl border text-xs font-mono font-bold transition-all ${
                    totalRounds === num
                      ? 'bg-[#151D1D] border-[#A8C66C] text-[#A8C66C]'
                      : 'bg-[#101719] border-[#293130] text-[#A8ADA7] hover:bg-[#151D1D]'
                  }`}
                >
                  {num} {num === 1 ? 'Round' : 'Rounds'}
                </button>
              ))}
            </div>
          </div>

          {/* Player Capacity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-[#A8ADA7] mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#A8C66C]" />
                <span>Min Players</span>
              </label>
              <select
                value={minPlayers}
                onChange={(e) => setMinPlayers(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#151D1D] border border-[#293130] text-[#F1EBDD] text-xs font-mono focus:outline-none focus:border-[#A8C66C]"
              >
                {[2, 3, 4, 5].map((n) => (
                  <option key={n} value={n} className="bg-[#101719] text-[#F1EBDD]">
                    {n} Players
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-[#A8ADA7] mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#A8C66C]" />
                <span>Max Capacity</span>
              </label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#151D1D] border border-[#293130] text-[#F1EBDD] text-xs font-mono focus:outline-none focus:border-[#A8C66C]"
              >
                {[4, 6, 8, 10].map((n) => (
                  <option key={n} value={n} className="bg-[#101719] text-[#F1EBDD]">
                    {n} Players
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#A8C66C] hover:bg-[#B8D47C] disabled:bg-[#151D1D] disabled:text-[#A8ADA7] text-[#070B0D] font-display font-bold text-sm tracking-wide transition-all shadow-md active:scale-98"
            >
              {isLoading ? 'Creating Room...' : 'CREATE & LAUNCH ROOM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
