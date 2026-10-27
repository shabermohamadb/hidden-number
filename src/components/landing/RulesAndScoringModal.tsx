// src/components/landing/RulesAndScoringModal.tsx
import React from 'react';
import { X, Award, ShieldCheck, Zap } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesAndScoringModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#101719] border border-[#293130] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-[#293130]">
          <div>
            <h2 className="font-display font-bold text-xl text-[#F1EBDD] tracking-wide flex items-center gap-2">
              <Award className="w-5 h-5 text-[#C6A45A]" />
              <span>SCORING & RULES</span>
            </h2>
            <p className="text-xs text-[#A8ADA7] font-sans mt-0.5">
              Server-authoritative scoring table & precision metrics
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#151D1D] hover:bg-[#1E2728] text-[#A8ADA7] hover:text-[#F1EBDD] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-6 py-4 pr-1 text-[#F1EBDD]">
          {/* Scoring Table */}
          <div>
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#A8C66C] mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#A8C66C]" />
              <span>Round Points Breakdown</span>
            </h3>

            <div className="border border-[#293130] rounded-xl overflow-hidden bg-[#151D1D]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#101719] border-b border-[#293130] text-[10px] uppercase text-[#A8ADA7]">
                  <tr>
                    <th className="py-2.5 px-4">Guess Difference</th>
                    <th className="py-2.5 px-4 text-center">Precision</th>
                    <th className="py-2.5 px-4 text-right">Awarded Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#293130]">
                  <tr className="bg-[#151D1D] text-[#A8C66C] font-bold">
                    <td className="py-3 px-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#A8C66C]" />
                      Exact Match (diff = 0)
                    </td>
                    <td className="py-3 px-4 text-center">100% Accuracy</td>
                    <td className="py-3 px-4 text-right text-sm text-[#F1EBDD]">+100 pts</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-[#F1EBDD]">Off by 1 or 2</td>
                    <td className="py-2.5 px-4 text-center text-[#A8ADA7]">Near Miss</td>
                    <td className="py-2.5 px-4 text-right text-[#C6A45A] font-bold">+75 pts</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-[#F1EBDD]">Off by 3, 4 or 5</td>
                    <td className="py-2.5 px-4 text-center text-[#A8ADA7]">Close Guess</td>
                    <td className="py-2.5 px-4 text-right text-[#F1EBDD] font-bold">+50 pts</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-[#F1EBDD]">Off by 6 to 10</td>
                    <td className="py-2.5 px-4 text-center text-[#A8ADA7]">Ballpark Guess</td>
                    <td className="py-2.5 px-4 text-right text-[#A8ADA7] font-bold">+25 pts</td>
                  </tr>
                  <tr className="text-[#A8ADA7]/60">
                    <td className="py-2.5 px-4">Off by 11+ or No Guess</td>
                    <td className="py-2.5 px-4 text-center">Outside Target</td>
                    <td className="py-2.5 px-4 text-right">0 pts</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Golden Rule Security Guarantee */}
          <div className="p-4 rounded-xl bg-[#151D1D] border border-[#293130] space-y-2">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#C6A45A] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#C6A45A]" />
              <span>Anti-Cheat & The Golden Rule</span>
            </h4>
            <p className="text-xs text-[#A8ADA7] leading-relaxed font-sans">
              Your secret number is never transmitted to your browser prior to the results phase. All answers, turns, deadlines, and points are validated authoritatively by the game engine.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-[#293130] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#151D1D] hover:bg-[#1E2728] border border-[#293130] text-[#F1EBDD] font-display font-semibold text-xs uppercase tracking-wider transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
