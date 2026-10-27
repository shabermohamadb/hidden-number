// src/components/game/FinalGuessModal.tsx
import React, { useState } from 'react';
import { Lock, Check, Clock } from 'lucide-react';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  remainingSeconds: number;
  onSubmit: (guess: number) => void;
  isSubmitting: boolean;
  hasSubmitted: boolean;
  submittedGuess: number | null;
}

export const FinalGuessModal: React.FC<Props> = ({
  remainingSeconds,
  onSubmit,
  isSubmitting,
  hasSubmitted,
  submittedGuess
}) => {
  const { playClick, playSubmitGuess } = useSoundFX();
  const [guessVal, setGuessVal] = useState<number>(50);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasSubmitted || isSubmitting) return;
    playSubmitGuess();
    onSubmit(guessVal);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-lg bg-[#0B0F19] border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-500/20 text-center overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        {/* Phase Header & Urgency Countdown */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>FINAL GUESS WINDOW: {remainingSeconds}s</span>
          </div>
        </div>

        <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide mb-1">
          WHAT IS YOUR NUMBER?
        </h2>
        <p className="text-xs text-slate-400 font-sans mb-8">
          Based on the clues and answers you analyzed, submit your single final deduction (1 to 100).
        </p>

        {hasSubmitted ? (
          <div className="py-8 space-y-4">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 font-display font-black text-4xl shadow-xl shadow-emerald-500/20 animate-in zoom-in duration-300">
              {submittedGuess}
            </div>
            <div className="text-emerald-400 font-mono font-bold text-sm flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              <span>GUESS SECURELY LOCKED IN</span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Waiting for other players to lock in or timer expiration...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Number Display Dial */}
            <div className="relative w-28 h-28 mx-auto rounded-3xl bg-slate-900 border-2 border-cyan-400/80 flex items-center justify-center text-white font-display font-black text-5xl shadow-2xl shadow-cyan-500/30">
              <span>{guessVal}</span>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <input
                type="range"
                min="1"
                max="100"
                value={guessVal}
                onChange={(e) => {
                  playClick();
                  setGuessVal(parseInt(e.target.value, 10));
                }}
                className="w-full accent-cyan-400 h-2.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>1 (Min)</span>
                <span>50</span>
                <span>100 (Max)</span>
              </div>
            </div>

            {/* Quick Increment buttons */}
            <div className="flex items-center justify-center gap-2">
              {[-10, -1, +1, +10].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => {
                    playClick();
                    setGuessVal(prev => Math.max(1, Math.min(100, prev + delta)));
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-mono text-xs text-slate-300 font-bold"
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>

            {/* Submit Lock-in Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white font-display font-black text-lg shadow-2xl shadow-amber-500/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <Lock className="w-5 h-5" />
              <span>LOCK IN MY GUESS ({guessVal})</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

