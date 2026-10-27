// src/components/common/NavigationHeader.tsx
import React, { useState } from 'react';
import { Volume2, VolumeX, HelpCircle, BookOpen, User, Wifi, WifiOff, Copy, Check } from 'lucide-react';
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
}

export const NavigationHeader: React.FC<Props> = ({
  connected,
  roomCode,
  currentRound,
  totalRounds,
  nickname,
  avatar,
  onOpenHowToPlay,
  onOpenRules,
  onOpenProfile,
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
    <header className="relative z-30 w-full px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-white/5 bg-[#06080F]/80 backdrop-blur-md">
      {/* Brand Logo & Tagline */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/40">
          <span className="font-display font-black text-xl text-white">?</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display font-black tracking-wider text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-200">
              HIDDEN NUMBER
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
              Arena v1.0
            </span>
          </div>
          <p className="hidden sm:block text-[11px] text-slate-400 font-sans">
            Everyone knows your number. Except you.
          </p>
        </div>
      </div>

      {/* Center Room / Round Status if active */}
      {roomCode && (
        <div className="flex items-center gap-2 sm:gap-4 bg-slate-900/80 border border-white/10 px-3 py-1.5 rounded-xl shadow-inner">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 uppercase font-mono">Room:</span>
            <button
              onClick={handleCopyCode}
              title="Click to copy room code"
              className="group flex items-center gap-1 font-mono font-bold text-xs sm:text-sm text-cyan-300 hover:text-cyan-200 transition-colors"
            >
              <span>{roomCode}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />}
            </button>
          </div>

          {currentRound && totalRounds && (
            <>
              <div className="w-px h-3.5 bg-white/15" />
              <div className="text-xs font-mono font-semibold text-slate-300">
                Round <span className="text-cyan-400">{currentRound}</span>/{totalRounds}
              </div>
            </>
          )}
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Connection status */}
        <div
          title={connected ? 'Connected to server' : 'Disconnected'}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono"
        >
          {connected ? (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden md:inline text-emerald-400 text-[11px]">ONLINE</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="hidden md:inline text-rose-400 text-[11px]">OFFLINE</span>
            </>
          )}
        </div>

        {/* Audio Toggle & Popover */}
        <div className="relative">
          <button
            onClick={() => {
              playClick();
              setShowAudioPopover(!showAudioPopover);
            }}
            title="Audio settings"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {showAudioPopover && (
            <div className="absolute right-0 mt-2 w-64 p-4 rounded-2xl bg-slate-900/95 border border-white/15 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">Sound Settings</span>
                <button
                  onClick={() => {
                    playClick();
                    toggleMute();
                  }}
                  className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-white/10 hover:bg-white/15 text-slate-200"
                >
                  {isMuted ? 'UNMUTE' : 'MUTE'}
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1 font-mono">
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
                    className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1 font-mono">
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
                    className="w-full accent-violet-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
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
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Rules & Scoring */}
        <button
          onClick={() => {
            playClick();
            onOpenRules();
          }}
          title="Rules & Scoring System"
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        {/* Profile */}
        <button
          onClick={() => {
            playClick();
            onOpenProfile();
          }}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/40 text-cyan-200 transition-all"
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
            {nickname.charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:inline font-mono text-xs font-semibold max-w-[90px] truncate">
            {nickname}
          </span>
        </button>
      </div>
    </header>
  );
};

