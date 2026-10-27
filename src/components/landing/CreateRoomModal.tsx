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
  const [maxPlayers, setMaxPlayers] = useState<number>(8);
  const [password, setPassword] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    onCreate({
      visibility,
      questionTime,
      guessTime: 15,
      totalRounds,
      minPlayers,
      maxPlayers,
      password: visibility === 'private' && password.trim() ? password.trim() : null
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0D1017] border border-[#C5A059]/35 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80">
        <div className="flex items-center justify-between pb-4 border-b border-[#C5A059]/20">
          <div>
            <h2 className="font-display font-black text-xl text-[#FAF8F5] tracking-wide">
              CREATE ROOM
            </h2>
            <p className="text-xs text-[#8F8B83] font-sans mt-0.5">
              Customize game rules and arena parameters
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#131722] hover:bg-[#1B2130] text-[#A7A29A] hover:text-[#FAF8F5] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Room Visibility */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#A7A29A] mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
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
                    ? 'bg-[#181E2C] border-[#D4AF37] text-[#D4AF37] shadow-md shadow-[#D4AF37]/10'
                    : 'bg-[#131722] border-[#C5A059]/20 text-[#8F8B83] hover:bg-[#1B2130]'
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
                    ? 'bg-[#181E2C] border-[#D4AF37] text-[#D4AF37] shadow-md shadow-[#D4AF37]/10'
                    : 'bg-[#131722] border-[#C5A059]/20 text-[#8F8B83] hover:bg-[#1B2130]'
                }`}
              >
                Private Room
              </button>
            </div>
          </div>

          {/* Password (if private) */}
          {visibility === 'private' && (
            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-[#A7A29A] mb-2 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#E5A83B]" />
                <span>Optional Password</span>
              </label>
              <input
                type="password"
                placeholder="Leave blank for open invite link"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#131722] border border-[#C5A059]/30 text-[#F5F2EB] placeholder-[#5A564F] text-sm font-mono focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          )}

          {/* Question Phase Duration */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#A7A29A] mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Question Phase Timer</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[45, 60, 90].map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  onClick={() => {
                    playClick();
                    setQuestionTime(seconds);
                  }}
                  className={`py-2 rounded-xl border text-xs font-mono font-semibold transition-all ${
                    questionTime === seconds
                      ? 'bg-[#181E2C] border-[#D4AF37] text-[#D4AF37]'
                      : 'bg-[#131722] border-[#C5A059]/20 text-[#8F8B83] hover:bg-[#1B2130]'
                  }`}
                >
                  {seconds}s
                </button>
              ))}
            </div>
          </div>

          {/* Total Rounds */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#A7A29A] mb-2 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Match Length</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 3, 5].map((rounds) => (
                <button
                  key={rounds}
                  type="button"
                  onClick={() => {
                    playClick();
                    setTotalRounds(rounds);
                  }}
                  className={`py-2 rounded-xl border text-xs font-mono font-semibold transition-all ${
                    totalRounds === rounds
                      ? 'bg-[#181E2C] border-[#D4AF37] text-[#D4AF37]'
                      : 'bg-[#131722] border-[#C5A059]/20 text-[#8F8B83] hover:bg-[#1B2130]'
                  }`}
                >
                  {rounds} {rounds === 1 ? 'Round' : 'Rounds'}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum Players to Start */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#A7A29A] mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Minimum Players to Start Game</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => {
                    playClick();
                    setMinPlayers(count);
                  }}
                  className={`py-2 rounded-xl border text-xs font-mono font-semibold transition-all ${
                    minPlayers === count
                      ? 'bg-[#181E2C] border-[#D4AF37] text-[#D4AF37]'
                      : 'bg-[#131722] border-[#C5A059]/20 text-[#8F8B83] hover:bg-[#1B2130]'
                  }`}
                >
                  {count} Players {count === 2 ? '(1v1)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Max Players */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#A7A29A] mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Player Limit: {maxPlayers} Players</span>
            </label>
            <input
              type="range"
              min="3"
              max="10"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
              className="w-full accent-[#D4AF37] h-2 bg-[#131722] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-[#8F8B83] mt-1">
              <span>3 Min</span>
              <span>10 Max</span>
            </div>
          </div>

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
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#9A7B38] via-[#D4AF37] to-[#8C6D34] hover:from-[#B89243] hover:via-[#E5C158] hover:to-[#A7833D] text-black font-bold text-sm shadow-lg shadow-[#D4AF37]/20 border border-[#F3E5AB]/30 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Creating Room...' : 'Create & Enter Lobby'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
