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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0D1017] border border-[#C5A059]/35 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-[#C5A059]/20">
          <div>
            <h2 className="font-display font-black text-2xl text-[#FAF8F5] tracking-wide flex items-center gap-2">
              <span className="text-[#D4AF37]">HOW TO PLAY</span>
            </h2>
            <p className="text-xs text-[#8F8B83] font-sans mt-0.5">
              Master the psychological art of the Hidden Number
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#131722] hover:bg-[#1B2130] text-[#A7A29A] hover:text-[#FAF8F5] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-3.5 py-4 pr-1 text-[#F5F2EB]">
          {/* Rule 1 */}
          <div className="p-4 rounded-2xl bg-[#131722] border border-[#C5A059]/20 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-[#181E2C] border border-[#C5A059]/35 flex items-center justify-center shrink-0 text-[#D4AF37]">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[#FAF8F5]">1. The Golden Rule</h3>
              <p className="text-sm text-[#A7A29A] mt-1 leading-relaxed">
                At the start of each round, every player is secretly assigned a unique number from <span className="text-[#D4AF37] font-semibold">1 to 100</span>.
                You can see every other player's number on their card, but <span className="text-amber-300 font-semibold underline decoration-amber-500/40 underline-offset-4">your own number is completely hidden</span> from you!
              </p>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="p-4 rounded-2xl bg-[#131722] border border-[#C5A059]/20 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-[#181E2C] border border-[#C5A059]/35 flex items-center justify-center shrink-0 text-[#D4AF37]">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[#FAF8F5]">2. Focused Deduction Phase (60s)</h3>
              <p className="text-sm text-[#A7A29A] mt-1 leading-relaxed">
                Players select one opponent to interrogate at a time. Ask strategic questions about your secret number:
                <span className="block mt-1 italic text-[#8F8B83] text-xs">
                  "Is my number greater than 50?" • "Is it even or odd?" • "Is my number higher than yours?" • "Am I between 20 and 40?"
                </span>
                The target answers with Yes, No, Higher, Lower, Even, or Odd!
              </p>
            </div>
          </div>

          {/* Rule 3 */}
          <div className="p-4 rounded-2xl bg-[#131722] border border-[#C5A059]/20 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-[#181E2C] border border-[#C5A059]/35 flex items-center justify-center shrink-0 text-[#D4AF37]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[#FAF8F5]">3. Final Guess Lock-In (15s)</h3>
              <p className="text-sm text-[#A7A29A] mt-1 leading-relaxed">
                When the question timer expires, chat closes and the private guess phase begins.
                Use the precision controls to lock in your single final guess (1–100).
                Your guess is kept 100% private until the reveal!
              </p>
            </div>
          </div>

          {/* Rule 4 */}
          <div className="p-4 rounded-2xl bg-[#131722] border border-[#C5A059]/20 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-[#181E2C] border border-[#C5A059]/35 flex items-center justify-center shrink-0 text-[#D4AF37]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[#FAF8F5]">4. Dramatic Reveal & Scoring</h3>
              <p className="text-sm text-[#A7A29A] mt-1 leading-relaxed">
                All numbers and guesses flip in a cinematic sequence. Points are awarded based on how close your guess was to your actual secret number. The closest players climb the match leaderboard!
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#C5A059]/20 flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#9A7B38] via-[#D4AF37] to-[#8C6D34] hover:from-[#B89243] hover:via-[#E5C158] hover:to-[#A7833D] text-black font-bold text-sm shadow-lg shadow-[#D4AF37]/20 border border-[#F3E5AB]/30 transition-all"
          >
            <span>Got It</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
