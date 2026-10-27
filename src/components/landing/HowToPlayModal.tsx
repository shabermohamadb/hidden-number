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
      <div className="relative w-full max-w-2xl bg-[#101719] border border-[#293130] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-[#293130]">
          <div>
            <h2 className="font-display font-bold text-xl text-[#F1EBDD] tracking-wide">
              HOW TO PLAY
            </h2>
            <p className="text-xs text-[#A8ADA7] font-sans mt-0.5">
              Master the art of the Hidden Number
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#151D1D] hover:bg-[#1E2728] text-[#A8ADA7] hover:text-[#F1EBDD] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-3.5 py-4 pr-1 text-[#F1EBDD]">
          {/* Rule 1 */}
          <div className="p-4 rounded-xl bg-[#151D1D] border border-[#293130] flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-[#101719] border border-[#293130] flex items-center justify-center shrink-0 text-[#A8C66C]">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[#F1EBDD]">1. The Golden Rule</h3>
              <p className="text-xs text-[#A8ADA7] mt-1 leading-relaxed font-sans">
                Every player is secretly assigned a unique number from <span className="text-[#A8C66C] font-semibold">1 to 100</span>.
                Every other player can see your number, but <strong className="text-[#F1EBDD]">you cannot see your own number</strong>!
              </p>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="p-4 rounded-xl bg-[#151D1D] border border-[#293130] flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-[#101719] border border-[#293130] flex items-center justify-center shrink-0 text-[#A8C66C]">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[#F1EBDD]">2. One Question At A Time</h3>
              <p className="text-xs text-[#A8ADA7] mt-1 leading-relaxed font-sans">
                Each round rotates turns fairly. When it is your turn, ask one free-form deduction question about your number (e.g., <em>"Is my number greater than 50?"</em>).
                Other players answer with strictly <strong>YES</strong> or <strong>NO</strong>!
              </p>
            </div>
          </div>

          {/* Rule 3 */}
          <div className="p-4 rounded-xl bg-[#151D1D] border border-[#293130] flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-[#101719] border border-[#293130] flex items-center justify-center shrink-0 text-[#A8C66C]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[#F1EBDD]">3. Final Guess Phase</h3>
              <p className="text-xs text-[#A8ADA7] mt-1 leading-relaxed font-sans">
                When the question timer expires, use the tactile stepper to submit your single final guess (1–100).
                Your guess is private until the reveal!
              </p>
            </div>
          </div>

          {/* Rule 4 */}
          <div className="p-4 rounded-xl bg-[#151D1D] border border-[#293130] flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-[#101719] border border-[#293130] flex items-center justify-center shrink-0 text-[#C6A45A]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[#F1EBDD]">4. Reveal & Scoring</h3>
              <p className="text-xs text-[#A8ADA7] mt-1 leading-relaxed font-sans">
                All numbers and guesses are revealed simultaneously. Exact match awards <strong>100 PTS</strong>, close guesses award 75, 50, or 25 PTS!
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#293130] flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#A8C66C] hover:bg-[#B8D47C] text-[#070B0D] font-display font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-98"
          >
            <span>Got It</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
