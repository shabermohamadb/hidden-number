// src/components/common/NavigationHeader.tsx
import React, { useState } from 'react';
import { Volume2, VolumeX, HelpCircle, BookOpen, Copy, Check } from 'lucide-react';
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
  const { isMuted, toggleMute, sfxVolume, setSfxVolume, musicVolume, setMusicVolume, playClick } = useSoundFX();
  const [showAudioPopover, setShowAudioPopover] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!roomCode) return;
    playClick();
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="relative z-30 w-full px-3 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between border-b border-[#C5A059]/15 bg-[#07080B]/90 backdrop-blur-md">
      {/* Brand Logo & Tagline */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0D1017] border border-[#D4AF37]/50 flex items-center justify-center shadow-md shadow-[#D4AF37]/10 shrink-0">
          <span className="font-display font-black text-lg sm:text-xl text-[#D4AF37]">?</span>
        </div>
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-display font-black tracking-wider text-base sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-[#FAF8F5] via-[#F5F2EB] to-[#D4AF37]">
              HIDDEN NUMBER
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md bg-[#131722] text-[#D4AF37] border border-[#C5A059]/30">
              Arena v1.0
            </span>
          </div>
          <p className="hidden md:block text-[11px] text-[#8F8B83] font-sans">
            Everyone knows your number. Except you.
          </p>
        </div>
      </div>

      {/* Center Room / Round Status if active (desktop) */}
      {roomCode && (
        <div className="hidden md:flex items-center gap-2 sm:gap-4 bg-[#0D1017] border border-[#C5A059]/25 px-3.5 py-1.5 rounded-xl shadow-inner">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#8F8B83] uppercase font-mono">Room:</span>
            <button
              onClick={handleCopyCode}
              title="Click to copy room code"
              className="group flex items-center gap-1.5 font-mono font-bold text-xs sm:text-sm text-[#D4AF37] hover:text-[#F3E5AB] transition-colors"
            >
              <span>{roomCode}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />}
            </button>
          </div>

          {currentRound && totalRounds && (
            <>
              <div className="w-px h-3.5 bg-[#C5A059]/20" />
              <div className="text-xs font-mono font-semibold text-[#F5F2EB]">
                Round <span className="text-[#D4AF37] font-bold">{currentRound}</span>/{totalRounds}
              </div>
            </>
          )}
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Connection status (clickable to configure backend) */}
        <button
          onClick={() => {
            playClick();
            onOpenServerConfig();
          }}
          title={connected ? 'Connected to server (click to view settings)' : 'Disconnected (click to connect backend)'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all hover:scale-105 ${
            connected
              ? 'bg-emerald-950/40 border-emerald-500/30 hover:bg-emerald-900/40'
              : 'bg-rose-950/60 border-rose-500/50 hover:bg-rose-900/60 animate-pulse'
          }`}
        >
          {connected ? (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-[11px] font-bold">ONLINE</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-rose-300 text-[11px] font-bold">OFFLINE (CONNECT)</span>
            </>
          )}
        </button>

        {/* Audio Toggle & Popover */}
        <div className="relative">
          <button
            onClick={() => {
              playClick();
              setShowAudioPopover(!showAudioPopover);
            }}
            title="Audio settings"
            className="p-2 rounded-xl bg-[#131722] hover:bg-[#1B2130] border border-[#C5A059]/25 text-[#A7A29A] hover:text-[#F5F2EB] transition-all"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#D4AF37]" />}
          </button>

          {showAudioPopover && (
            <div className="absolute right-0 mt-2 w-64 p-4 rounded-2xl bg-[#0D1017]/95 border border-[#C5A059]/30 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#C5A059]/20">
                <span className="text-xs font-bold text-[#F5F2EB] uppercase tracking-wider font-mono">Sound Settings</span>
                <button
                  onClick={() => {
                    playClick();
                    toggleMute();
                  }}
                  className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-[#181E2C] hover:bg-[#222A3E] text-[#D4AF37] border border-[#C5A059]/30"
                >
                  {isMuted ? 'UNMUTE' : 'MUTE'}
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-[#A7A29A] mb-1 font-mono">
                    <span>SFX</span>
                    <span>{Math.round(sfxVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={sfxVolume}
                    disabled={isMuted}
                    onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                    className="w-full accent-[#D4AF37] h-1.5 bg-[#181E2C] rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-[#A7A29A] mb-1 font-mono">
                    <span>Music</span>
                    <span>{Math.round(musicVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={musicVolume}
                    disabled={isMuted}
                    onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                    className="w-full accent-[#C5A059] h-1.5 bg-[#181E2C] rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* How to Play */}
        <button
          onClick={() => {
            playClick();
            onOpenHowToPlay();
          }}
          title="How to Play"
          className="p-2 rounded-xl bg-[#131722] hover:bg-[#1B2130] border border-[#C5A059]/25 text-[#A7A29A] hover:text-[#F5F2EB] transition-all"
        >
          <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
        </button>

        {/* Rules & Scoring */}
        <button
          onClick={() => {
            playClick();
            onOpenRules();
          }}
          title="Rules & Scoring System"
          className="p-2 rounded-xl bg-[#131722] hover:bg-[#1B2130] border border-[#C5A059]/25 text-[#A7A29A] hover:text-[#F5F2EB] transition-all"
        >
          <BookOpen className="w-4 h-4 text-[#D4AF37]" />
        </button>

        {/* Profile */}
        <button
          onClick={() => {
            playClick();
            onOpenProfile();
          }}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#131722] hover:bg-[#1B2130] border border-[#C5A059]/30 text-[#F5F2EB] transition-all"
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#8C6D34] to-[#D4AF37] flex items-center justify-center text-[10px] font-bold text-black">
            {nickname.charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:inline font-mono text-xs font-semibold max-w-[90px] truncate text-[#FAF8F5]">
            {nickname}
          </span>
        </button>
      </div>
    </header>
  );
};
