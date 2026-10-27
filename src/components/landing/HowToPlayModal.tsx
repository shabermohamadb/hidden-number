// src/components/landing/HowToPlayModal.tsx
import React from 'react';
import { X, Eye, HelpCircle, Lock, Trophy, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0B0F19] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-500/10 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="font-display font-black text-2xl text-white tracking-wide flex items-center gap-2">
              <span className="text-cyan-400">HOW TO PLAY</span>
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Master the psychological art of the Hidden Number
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 py-4 pr-1 text-slate-200">
          {/* Rule 1 */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">1. The Golden Rule</h3>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                At the start of each round, every player is secretly assigned a unique number from <span className="text-cyan-300 font-semibold">1 to 100</span>.
                You can see every other player's number on their card, but <span className="text-rose-400 font-semibold underline decoration-rose-500/40 underline-offset-4">your own number is completely hidden</span> from you!
              </p>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">2. Interrogation Phase (60s)</h3>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                Players have 60 synchronized seconds to ask free-form questions in the chat feed.
                Ask strategic queries:
                <span className="block mt-1 italic text-slate-400 text-xs">
                  "Is my number greater than 50?" • "Is it even or odd?" • "Is my number higher than Alice's?" • "Am I in the top quarter?"
                </span>
                Other players answer your questions truthfully or provide reaction clues!
              </p>
            </div>
          </div>

          {/* Rule 3 */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">3. Final Guess Window (15s)</h3>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                When the question timer expires, chat closes and the private guess phase begins.
                Use the slider or numeric input to lock in your single final guess (1–100).
                Your guess is kept 100% private until the reveal!
              </p>
            </div>
          </div>

          {/* Rule 4 */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">4. Dramatic Reveal & Scoring</h3>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                All numbers and guesses flip in a cinematic sequence. Points are awarded based on how close your guess was to your actual secret number. The closest players climb the match leaderboard!
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all"
          >
            <span>Got It</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

