// src/components/game/GuessPhaseView.tsx
import React, { useState } from 'react';
import { Hourglass, Minus, Plus, Check } from 'lucide-react';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  roundNumber: number;
  totalRounds: number;
  remainingSeconds: number;
  onSubmitGuess: (guess: number) => Promise<{ success: boolean; error?: string }>;
  isSubmitting: boolean;
  hasSubmitted: boolean;
  submittedGuess: number | null;
}

export const GuessPhaseView: React.FC<Props> = ({
  roundNumber,
  totalRounds,
  remainingSeconds,
  onSubmitGuess,
  isSubmitting,
  hasSubmitted,
  submittedGuess
}) => {
  const { playClick, playSubmitGuess } = useSoundFX();
  const [guessVal, setGuessVal] = useState<number>(57);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAdjust = (delta: number) => {
    playClick();
    setGuessVal(prev => Math.max(1, Math.min(100, prev + delta)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasSubmitted || isSubmitting) return;

    setErrorMsg(null);
    playSubmitGuess();
    const clamped = Math.max(1, Math.min(100, Math.round(guessVal)));
    const res = await onSubmitGuess(clamped);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to submit guess');
    }
  };

  // Format MM:SS
  const mins = Math.floor(Math.max(0, remainingSeconds) / 60);
  const secs = Math.max(0, remainingSeconds) % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center justify-center max-w-xl mx-auto py-8 sm:py-16 text-center space-y-8">
      {/* Timer Section */}
      <div className="flex flex-col items-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-[#101719] border border-[#293130] flex items-center justify-center text-[#C6A45A]">
          <Hourglass className="w-6 h-6 animate-pulse" />
        </div>
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#A8ADA7]">
          TIME LEFT
        </span>
        <span className="font-mono font-bold text-4xl sm:text-5xl text-[#F1EBDD] tracking-tight">
          {timeFormatted}
        </span>
      </div>

      {/* Subtitles */}
      <div className="space-y-1">
        <h2 className="font-display font-bold text-lg text-[#F1EBDD]">
          Enter your final guess
        </h2>
        <p className="text-xs text-[#A8ADA7] font-sans">
          This is your own number
        </p>
      </div>

      {/* Tactile Stepper or Locked State */}
      {hasSubmitted ? (
        <div className="p-8 rounded-2xl bg-[#101719] border border-[#293130] w-full max-w-sm mx-auto space-y-3">
          <div className="text-5xl font-mono font-bold text-[#A8C66C]">
            {submittedGuess}
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-[#F1EBDD]">
            <Check className="w-4 h-4 text-[#A8C66C]" />
            <span>GUESS SUBMITTED & LOCKED</span>
          </div>
          <p className="text-[11px] font-mono text-[#A8ADA7]">
            Waiting for remaining players or timer completion...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-6">
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => handleAdjust(-1)}
              className="w-14 h-14 rounded-2xl bg-[#151D1D] hover:bg-[#1E2728] border border-[#293130] text-[#F1EBDD] text-2xl font-bold flex items-center justify-center transition-all active:scale-95 shadow-sm"
            >
              <Minus className="w-6 h-6" />
            </button>

            {/* Central Display */}
            <div className="w-28 h-24 rounded-2xl bg-[#101719] border border-[#293130] flex items-center justify-center">
              <input
                type="number"
                min={1}
                max={100}
                value={guessVal}
                onChange={(e) => setGuessVal(Number(e.target.value))}
                className="w-full bg-transparent text-center font-mono font-bold text-4xl sm:text-5xl text-[#F1EBDD] focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => handleAdjust(1)}
              className="w-14 h-14 rounded-2xl bg-[#151D1D] hover:bg-[#1E2728] border border-[#293130] text-[#F1EBDD] text-2xl font-bold flex items-center justify-center transition-all active:scale-95 shadow-sm"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <div className="text-[11px] font-mono uppercase tracking-wider text-[#A8ADA7]">
            NUMBER RANGE: 1 - 100
          </div>

          <div className="space-y-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl bg-[#A8C66C] hover:bg-[#B8D47C] disabled:bg-[#1E2728] disabled:text-[#A8ADA7] text-[#070B0D] font-display font-bold text-sm tracking-wider transition-all shadow-md active:scale-98"
            >
              {isSubmitting ? 'SUBMITTING...' : 'SUBMIT GUESS'}
            </button>
            <p className="text-[11px] font-mono text-[#A8ADA7]">
              You can only submit once
            </p>
          </div>

          {errorMsg && (
            <p className="text-xs font-mono text-[#E05D52]">{errorMsg}</p>
          )}
        </form>
      )}
    </div>
  );
};
