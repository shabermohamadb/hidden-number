// src/components/profile/ProfileDrawer.tsx
import React, { useState } from 'react';
import { X, User, Trophy, Award, Target, Check } from 'lucide-react';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  nickname: string;
  avatar: string;
  onSaveProfile: (nickname: string, avatar: string) => void;
}

const AVATAR_OPTIONS = [
  'avatar-1',
  'avatar-2',
  'avatar-3',
  'avatar-4',
  'avatar-5',
  'avatar-6',
  'avatar-7',
  'avatar-8'
];

export const ProfileDrawer: React.FC<Props> = ({ isOpen, onClose, nickname, avatar, onSaveProfile }) => {
  const { playClick } = useSoundFX();
  const [currentNickname, setCurrentNickname] = useState(nickname);
  const [currentAvatar, setCurrentAvatar] = useState(avatar);
  const [saved, setSaved] = useState(false);

  // Stats stored in localStorage
  const gamesPlayed = parseInt(localStorage.getItem('hn_stat_games') || '0', 10);
  const wins = parseInt(localStorage.getItem('hn_stat_wins') || '0', 10);
  const totalPoints = parseInt(localStorage.getItem('hn_stat_points') || '0', 10);
  const exactGuesses = parseInt(localStorage.getItem('hn_stat_exact') || '0', 10);
  const accuracy = gamesPlayed > 0 ? Math.round(totalPoints / (gamesPlayed * 100) * 100) : 0;

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentNickname.trim()) return;
    playClick();
    onSaveProfile(currentNickname.trim(), currentAvatar);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-[#0B0F19] border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              <h2 className="font-display font-black text-xl text-white">PLAYER PROFILE</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="mt-6 space-y-6">
            {/* Nickname */}
            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-2">
                Display Nickname
              </label>
              <input
                type="text"
                required
                maxLength={20}
                value={currentNickname}
                onChange={(e) => setCurrentNickname(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Avatar Selection */}
            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-2">
                Select Mind Core Avatar
              </label>
              <div className="grid grid-cols-4 gap-3">
                {AVATAR_OPTIONS.map((av, index) => {
                  const isSelected = currentAvatar === av;
                  return (
                    <button
                      key={av}
                      type="button"
                      onClick={() => {
                        playClick();
                        setCurrentAvatar(av);
                      }}
                      className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-500/25 scale-105'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-400'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 via-indigo-600 to-violet-600 flex items-center justify-center font-bold text-white text-xs">
                        #{index + 1}
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-cyan-400 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-black font-bold" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Career Stats */}
            <div className="pt-4 border-t border-white/10">
              <h3 className="text-xs font-mono font-semibold uppercase text-slate-300 mb-3 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Arena Record</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                  <div className="text-[10px] text-slate-400 uppercase">Matches Played</div>
                  <div className="text-xl font-bold text-white mt-0.5">{gamesPlayed}</div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                  <div className="text-[10px] text-slate-400 uppercase">Victories</div>
                  <div className="text-xl font-bold text-emerald-400 mt-0.5">{wins}</div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                  <div className="text-[10px] text-slate-400 uppercase">Total Points</div>
                  <div className="text-xl font-bold text-cyan-400 mt-0.5">{totalPoints}</div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                  <div className="text-[10px] text-slate-400 uppercase">Exact Guesses</div>
                  <div className="text-xl font-bold text-amber-400 mt-0.5">{exactGuesses}</div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Profile Saved!</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </form>
        </div>

        <div className="text-center text-[11px] font-mono text-slate-500">
          Player ID: {localStorage.getItem('hn_player_id')?.slice(0, 8)}...
        </div>
      </div>
    </div>
  );
};

