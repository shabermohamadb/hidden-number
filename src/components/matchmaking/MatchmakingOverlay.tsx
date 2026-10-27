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
      <div className="relative w-full max-w-md bg-[#101719] border border-[#293130] rounded-3xl p-8 text-center shadow-2xl shadow-black/90 overflow-hidden">
        {/* Animated Radar Rings */}
        <div className="relative w-40 h-40 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-[#A8C66C]/20 animate-ping" />
          <div className="absolute inset-4 rounded-full border border-[#A8C66C]/30 animate-pulse" />
          <div className="absolute inset-8 rounded-full border border-[#293130]" />

          {/* Central radar scan icon */}
          <div className="w-16 h-16 rounded-full bg-[#151D1D] border border-[#A8C66C] flex items-center justify-center shadow-lg shadow-[#A8C66C]/10">
            <Search className="w-7 h-7 text-[#A8C66C] animate-pulse" />
          </div>
        </div>

        <h3 className="font-display font-bold text-xl text-[#F1EBDD] tracking-wide mb-2">
          SEARCHING ARENA...
        </h3>

        <p className="text-xs text-[#A8ADA7] max-w-xs mx-auto mb-6 font-sans">
          Matching with other players to initiate deduction round.
        </p>

        {/* Status Indicator */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#151D1D] border border-[#293130] text-xs font-mono text-[#A8C66C] mb-8">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#A8C66C]" />
          <span>In Queue: {queueLength} Player{queueLength === 1 ? '' : 's'}</span>
        </div>

        <div>
          <button
            onClick={() => {
              playClick();
              onCancel();
            }}
            className="flex items-center justify-center gap-2 mx-auto px-6 py-2.5 rounded-xl bg-[#151D1D] hover:bg-[#1E2728] border border-[#293130] text-[#A8ADA7] hover:text-[#F1EBDD] text-xs font-mono uppercase tracking-wider transition-all"
          >
            <X className="w-4 h-4" />
            <span>Cancel Search</span>
          </button>
        </div>
      </div>
    </div>
  );
};
