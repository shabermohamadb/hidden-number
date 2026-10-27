// src/components/game/FinalGuessModal.tsx
import React, { useState } from 'react';
import { Lock, Check, Clock, Minus, Plus } from 'lucide-react';
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
    const clamped = Math.max(1, Math.min(100, Math.round(guessVal)));
    playSubmitGuess();
    onSubmit(clamped);
  };

  const handleAdjust = (delta: number) => {
    playClick();
    setGuessVal(prev => Math.max(1, Math.min(100, prev + delta)));
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl animate-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-lg bg-[#0D1017] border-2 border-[#D4AF37]/60 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-black/90 text-center max-h-[92vh] overflow-y-auto">
        {/* Glow ambient highlight */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

        {/* Phase Header & Urgency Countdown */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#131722] border border-[#C5A059]/40 text-[#D4AF37] text-xs font-mono font-bold animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>FINAL GUESS WINDOW: {remainingSeconds}s</span>
          </div>
        </div>

        <h2 className="font-display font-black text-2xl sm:text-3xl text-[#FAF8F5] tracking-wide mb-1">
          WHAT IS YOUR NUMBER?
        </h2>
        <p className="text-xs text-[#8F8B83] font-sans mb-6">
          Based on the clues and deduction answers, submit your single final guess (1 to 100).
        </p>

        {hasSubmitted ? (
          <div className="py-8 space-y-4">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-[#131722] border-2 border-[#D4AF37] flex items-center justify-center text-[#D4AF37] font-display font-black text-5xl shadow-2xl shadow-[#D4AF37]/20 animate-in zoom-in duration-300">
              {submittedGuess}
            </div>
            <div className="text-[#D4AF37] font-mono font-bold text-sm flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>GUESS SECURELY LOCKED IN</span>
            </div>
            <p className="text-xs text-[#8F8B83] font-sans max-w-xs mx-auto">
              Your guess cannot be altered. Waiting for remaining players or countdown conclusion.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Number Display Dial with Steppers */}
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => handleAdjust(-1)}
                className="w-12 h-12 rounded-2xl bg-[#131722] hover:bg-[#1B2130] border border-[#C5A059]/30 text-[#D4AF37] flex items-center justify-center text-xl font-bold transition-all active:scale-95"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="relative w-28 h-28 rounded-3xl bg-[#131722] border-2 border-[#D4AF37] flex items-center justify-center text-[#FAF8F5] font-display font-black text-5xl shadow-2xl shadow-[#D4AF37]/20">
                <span>{guessVal}</span>
              </div>

              <button
                type="button"
                onClick={() => handleAdjust(1)}
                className="w-12 h-12 rounded-2xl bg-[#131722] hover:bg-[#1B2130] border border-[#C5A059]/30 text-[#D4AF37] flex items-center justify-center text-xl font-bold transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Precision Range Slider */}
            <div className="space-y-2 px-2">
              <input
                type="range"
                min="1"
                max="100"
                value={guessVal}
                onChange={(e) => {
                  playClick();
                  setGuessVal(parseInt(e.target.value, 10));
                }}
                className="w-full accent-[#D4AF37] h-2 bg-[#131722] rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-xs font-mono text-[#8F8B83]">
                <span>1 (Min)</span>
                <span>50</span>
                <span>100 (Max)</span>
              </div>
            </div>

            {/* Quick Step Buttons */}
            <div className="flex items-center justify-center gap-2">
              {[-10, -5, +5, +10].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => handleAdjust(delta)}
                  className="px-3 py-1.5 rounded-xl bg-[#131722] hover:bg-[#1B2130] border border-[#C5A059]/25 font-mono text-xs text-[#D4AF37] font-bold transition-all active:scale-95"
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>

            {/* Submit Lock-in Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#9A7B38] via-[#D4AF37] to-[#8C6D34] hover:from-[#B89243] hover:via-[#E5C158] hover:to-[#A7833D] text-black font-display font-black text-base sm:text-lg shadow-xl shadow-[#D4AF37]/25 border border-[#F3E5AB]/40 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <Lock className="w-5 h-5 fill-black" />
              <span>LOCK IN FINAL GUESS ({guessVal})</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
