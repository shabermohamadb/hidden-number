// src/components/profile/ProfileDrawer.tsx
import React, { useState } from 'react';
import { X, User, Trophy, Check } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-[#0D1017] border-l border-[#C5A059]/30 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[#C5A059]/20">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="font-display font-black text-xl text-[#FAF8F5]">PLAYER PROFILE</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#131722] hover:bg-[#1B2130] text-[#A7A29A] hover:text-[#FAF8F5] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="mt-6 space-y-6">
            {/* Nickname */}
            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-[#A7A29A] mb-2">
                Display Nickname
              </label>
              <input
                type="text"
                required
                maxLength={20}
                value={currentNickname}
                onChange={(e) => setCurrentNickname(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#131722] border border-[#C5A059]/30 text-[#F5F2EB] text-sm font-mono focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* Avatar Selection */}
            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-[#A7A29A] mb-2">
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
                          ? 'bg-[#181E2C] border-[#D4AF37] shadow-md shadow-[#D4AF37]/20 scale-105'
                          : 'bg-[#131722] border-[#C5A059]/20 hover:bg-[#1B2130] text-[#A7A29A]'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8C6D34] to-[#D4AF37] flex items-center justify-center font-bold text-black text-xs">
                        #{index + 1}
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#D4AF37] flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-black font-bold" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Career Stats */}
            <div className="pt-4 border-t border-[#C5A059]/20">
              <h3 className="text-xs font-mono font-semibold uppercase text-[#A7A29A] mb-3 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Arena Record</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="p-3 rounded-xl bg-[#131722] border border-[#C5A059]/20">
                  <div className="text-[10px] text-[#8F8B83] uppercase">Matches Played</div>
                  <div className="text-xl font-bold text-[#FAF8F5] mt-0.5">{gamesPlayed}</div>
                </div>

                <div className="p-3 rounded-xl bg-[#131722] border border-[#C5A059]/20">
                  <div className="text-[10px] text-[#8F8B83] uppercase">Victories</div>
                  <div className="text-xl font-bold text-emerald-400 mt-0.5">{wins}</div>
                </div>

                <div className="p-3 rounded-xl bg-[#131722] border border-[#C5A059]/20">
                  <div className="text-[10px] text-[#8F8B83] uppercase">Total Points</div>
                  <div className="text-xl font-bold text-[#D4AF37] mt-0.5">{totalPoints}</div>
                </div>

                <div className="p-3 rounded-xl bg-[#131722] border border-[#C5A059]/20">
                  <div className="text-[10px] text-[#8F8B83] uppercase">Exact Guesses</div>
                  <div className="text-xl font-bold text-[#F3E5AB] mt-0.5">{exactGuesses}</div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#9A7B38] via-[#D4AF37] to-[#8C6D34] hover:from-[#B89243] hover:via-[#E5C158] hover:to-[#A7833D] text-black font-bold text-sm shadow-lg shadow-[#D4AF37]/20 border border-[#F3E5AB]/30 transition-all"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-black" />
                  <span>Profile Saved!</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </form>
        </div>

        <div className="text-center text-[11px] font-mono text-[#5A564F]">
          Player ID: {localStorage.getItem('hn_player_id')?.slice(0, 8)}...
        </div>
      </div>
    </div>
  );
};
