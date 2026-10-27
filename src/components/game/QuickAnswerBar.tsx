// src/components/game/QuickAnswerBar.tsx
import React from 'react';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  onQuickAnswer: (answer: string) => void;
  disabled?: boolean;
}

const QUICK_OPTIONS = [
  { label: 'YES', color: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60' },
  { label: 'NO', color: 'bg-rose-950/60 text-rose-300 border-rose-500/40 hover:bg-rose-900/60' },
  { label: 'HIGHER ▲', color: 'bg-[#181E2C] text-[#D4AF37] border-[#D4AF37]/50 hover:bg-[#222A3E]' },
  { label: 'LOWER ▼', color: 'bg-[#131722] text-[#C5A059] border-[#C5A059]/40 hover:bg-[#1B2130]' },
  { label: 'EVEN', color: 'bg-[#131722] text-[#F3E5AB] border-[#C5A059]/30 hover:bg-[#1B2130]' },
  { label: 'ODD', color: 'bg-[#131722] text-[#A7A29A] border-[#C5A059]/30 hover:bg-[#1B2130]' },
  { label: 'VERY CLOSE!', color: 'bg-amber-950/60 text-amber-300 border-amber-500/40 hover:bg-amber-900/60' }
];

export const QuickAnswerBar: React.FC<Props> = ({ onQuickAnswer, disabled = false }) => {
  const { playClick } = useSoundFX();

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
      <span className="text-[10px] font-mono uppercase text-[#8F8B83] shrink-0 mr-1">
        Quick Clue:
      </span>
      {QUICK_OPTIONS.map((opt) => (
        <button
          key={opt.label}
          type="button"
          disabled={disabled}
          onClick={() => {
            playClick();
            onQuickAnswer(opt.label);
          }}
          className={`shrink-0 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-40 min-h-[34px] ${opt.color}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};
