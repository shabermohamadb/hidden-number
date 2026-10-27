// src/components/game/QuickAnswerBar.tsx
import React from 'react';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  onQuickAnswer: (answer: string) => void;
  disabled?: boolean;
}

const QUICK_OPTIONS = [
  { label: 'YES', color: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' },
  { label: 'NO', color: 'bg-rose-950/60 text-rose-300 border-rose-500/30' },
  { label: 'HIGHER ▲', color: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30' },
  { label: 'LOWER ▼', color: 'bg-indigo-950/60 text-indigo-300 border-indigo-500/30' },
  { label: 'EVEN', color: 'bg-violet-950/60 text-violet-300 border-violet-500/30' },
  { label: 'ODD', color: 'bg-fuchsia-950/60 text-fuchsia-300 border-fuchsia-500/30' },
  { label: 'VERY CLOSE!', color: 'bg-amber-950/60 text-amber-300 border-amber-500/30' },
  { label: 'WAY OFF', color: 'bg-slate-900 text-slate-400 border-white/10' }
];

export const QuickAnswerBar: React.FC<Props> = ({ onQuickAnswer, disabled = false }) => {
  const { playClick } = useSoundFX();

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
      <span className="text-[10px] font-mono uppercase text-slate-500 shrink-0 mr-1">
        Quick Clue:
      </span>
      {QUICK_OPTIONS.map((opt) => (
        <button
          key={opt.label}
          disabled={disabled}
          onClick={() => {
            playClick();
            onQuickAnswer(opt.label);
          }}
          className={`shrink-0 px-2.5 py-1 rounded-xl border text-[11px] font-mono font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-40 ${opt.color}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

