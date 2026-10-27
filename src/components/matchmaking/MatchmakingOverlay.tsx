// src/components/matchmaking/MatchmakingOverlay.tsx
import React from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  queueLength?: number;
  onCancel: () => void;
}

export const MatchmakingOverlay: React.FC<Props> = ({ queueLength = 1, onCancel }) => {
  const { playClick } = useSoundFX();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0D1017] border border-[#C5A059]/40 rounded-3xl p-8 text-center shadow-2xl shadow-black/90 overflow-hidden">
        {/* Animated Radar Rings */}
        <div className="relative w-44 h-44 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-[#D4AF37]/20 animate-ping" />
          <div className="absolute inset-4 rounded-full border border-[#C5A059]/30 animate-pulse" />
          <div className="absolute inset-8 rounded-full border border-[#8C6D34]/40" />

          {/* Central radar scan icon */}
          <div className="w-20 h-20 rounded-full bg-[#131722] border border-[#D4AF37] flex items-center justify-center shadow-lg shadow-[#D4AF37]/15">
            <Search className="w-8 h-8 text-[#D4AF37] animate-pulse" />
          </div>
        </div>

        <h3 className="font-display font-black text-2xl text-[#FAF8F5] tracking-wide mb-2">
          SEARCHING ARENA...
        </h3>

        <p className="text-sm text-[#A7A29A] max-w-xs mx-auto mb-6 font-sans">
          Connecting with other minds. Matching players to initiate round.
        </p>

        {/* Status Indicator */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#131722] border border-[#C5A059]/30 text-xs font-mono text-[#D4AF37] mb-8">
          <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
          <span>In Queue: {queueLength} Player{queueLength === 1 ? '' : 's'}</span>
        </div>

        <div>
          <button
            onClick={() => {
              playClick();
              onCancel();
            }}
            className="flex items-center justify-center gap-2 mx-auto px-6 py-2.5 rounded-xl bg-[#131722] hover:bg-[#1B2130] border border-[#C5A059]/25 text-[#A7A29A] hover:text-[#FAF8F5] text-xs font-mono uppercase tracking-wider transition-all"
          >
            <X className="w-4 h-4" />
            <span>Cancel Search</span>
          </button>
        </div>
      </div>
    </div>
  );
};
