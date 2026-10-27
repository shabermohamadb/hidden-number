// src/components/matchmaking/MatchmakingOverlay.tsx
import React from 'react';
import { X, Search, Users, Loader2 } from 'lucide-react';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  queueLength?: number;
  onCancel: () => void;
}

export const MatchmakingOverlay: React.FC<Props> = ({ queueLength = 1, onCancel }) => {
  const { playClick } = useSoundFX();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0B0F19] border border-cyan-500/40 rounded-3xl p-8 text-center shadow-2xl shadow-cyan-500/20 overflow-hidden">
        {/* Animated Radar Rings */}
        <div className="relative w-44 h-44 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping" />
          <div className="absolute inset-4 rounded-full border border-cyan-500/30 animate-pulse" />
          <div className="absolute inset-8 rounded-full border border-indigo-500/40" />

          {/* Central radar scan icon */}
          <div className="w-20 h-20 rounded-full bg-cyan-950/80 border border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Search className="w-8 h-8 text-cyan-300 animate-pulse" />
          </div>
        </div>

        <h3 className="font-display font-black text-2xl text-white tracking-wide mb-2">
          SEARCHING ARENA...
        </h3>

        <p className="text-sm text-slate-300 max-w-xs mx-auto mb-6 font-sans">
          Connecting with other minds. Matching 3 or more players to initiate round.
        </p>

        {/* Status Indicator */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono text-cyan-300 mb-8">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span>In Queue: {queueLength} Player{queueLength === 1 ? '' : 's'}</span>
        </div>

        <div>
          <button
            onClick={() => {
              playClick();
              onCancel();
            }}
            className="flex items-center justify-center gap-2 mx-auto px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs font-mono uppercase tracking-wider transition-all"
          >
            <X className="w-4 h-4" />
            <span>Cancel Search</span>
          </button>
        </div>
      </div>
    </div>
  );
};

