// src/components/common/NavigationHeader.tsx
import React, { useState } from 'react';
import { Settings, HelpCircle, Trophy, User, Copy, Check, Server } from 'lucide-react';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  connected: boolean;
  roomCode?: string | null;
  currentRound?: number;
  totalRounds?: number;
  nickname: string;
  avatar: string;
  onOpenHowToPlay: () => void;
  onOpenRules: () => void;
  onOpenProfile: () => void;
  onOpenServerConfig: () => void;
}

export const NavigationHeader: React.FC<Props> = ({
  connected,
  roomCode,
  currentRound,
  totalRounds,
  nickname,
  onOpenHowToPlay,
  onOpenRules,
  onOpenProfile,
  onOpenServerConfig,
}) => {
  const { playClick } = useSoundFX();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!roomCode) return;
    playClick();
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="relative z-30 w-full px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-[#293130] bg-[#070B0D]">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg border border-[#C6A45A]/70 flex items-center justify-center bg-[#101719] shrink-0">
          <span className="font-display font-black text-xs tracking-tight text-[#C6A45A]">HN</span>
        </div>
        <div className="flex flex-col">
          <span className="font-display font-bold text-sm sm:text-base tracking-wider text-[#F1EBDD] leading-none">
            HIDDEN
          </span>
          <span className="font-display font-bold text-[11px] sm:text-xs tracking-widest text-[#A8ADA7] leading-none mt-0.5">
            NUMBER
          </span>
        </div>
      </div>

      {/* Center Room Status (when active in match) */}
      {roomCode && (
        <div className="hidden md:flex items-center gap-3 bg-[#101719] border border-[#293130] px-3.5 py-1.5 rounded-xl">
          <span className="text-[11px] font-mono text-[#A8ADA7] uppercase">Room:</span>
          <button
            onClick={handleCopyCode}
            title="Click to copy room code"
            className="flex items-center gap-1.5 font-mono font-bold text-xs text-[#F1EBDD] hover:text-[#A8C66C] transition-colors"
          >
            <span>{roomCode}</span>
            {copied ? <Check className="w-3.5 h-3.5 text-[#A8C66C]" /> : <Copy className="w-3.5 h-3.5 text-[#A8ADA7]" />}
          </button>
          {currentRound && totalRounds && (
            <>
              <div className="w-px h-3 bg-[#293130]" />
              <span className="text-xs font-mono text-[#A8ADA7]">
                Round <strong className="text-[#F1EBDD]">{currentRound}</strong>/{totalRounds}
              </span>
            </>
          )}
        </div>
      )}

      {/* Navigation Links & Actions */}
      <div className="flex items-center gap-3 sm:gap-6 text-xs font-medium text-[#A8ADA7]">
        <button
          onClick={() => {
            playClick();
            onOpenHowToPlay();
          }}
          className="hover:text-[#F1EBDD] transition-colors hidden sm:inline-flex items-center gap-1"
        >
          <span>How to Play</span>
        </button>

        <button
          onClick={() => {
            playClick();
            onOpenRules();
          }}
          className="hover:text-[#F1EBDD] transition-colors hidden sm:inline-flex items-center gap-1"
        >
          <span>Leaderboard</span>
        </button>

        <button
          onClick={() => {
            playClick();
            onOpenProfile();
          }}
          className="hover:text-[#F1EBDD] transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#101719] hover:bg-[#151D1D] border border-[#293130] text-[#F1EBDD]"
        >
          <User className="w-3.5 h-3.5 text-[#A8C66C]" />
          <span className="truncate max-w-[90px] sm:max-w-[130px] font-mono">{nickname}</span>
        </button>

        <button
          onClick={() => {
            playClick();
            onOpenServerConfig();
          }}
          title={connected ? 'Connected to multiplayer server' : 'Server offline - click to configure'}
          className="p-2 rounded-lg bg-[#101719] hover:bg-[#151D1D] border border-[#293130] text-[#A8ADA7] hover:text-[#F1EBDD] transition-colors relative"
        >
          <Settings className="w-4 h-4" />
          <span
            className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
              connected ? 'bg-[#A8C66C]' : 'bg-[#E05D52]'
            }`}
          />
        </button>
      </div>
    </header>
  );
};
