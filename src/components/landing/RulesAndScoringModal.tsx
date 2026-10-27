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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0B0F19] border border-violet-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-500/10 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="font-display font-black text-2xl text-white tracking-wide flex items-center gap-2">
              <Award className="w-6 h-6 text-violet-400" />
              <span>SCORING & RULES</span>
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Server-authoritative scoring table & precision metrics
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-6 py-4 pr-1 text-slate-200">
          {/* Scoring Table */}
          <div>
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-cyan-300 mb-3 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Round Points Breakdown</span>
            </h3>

            <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02]">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 border-b border-white/10 text-xs font-mono uppercase text-slate-400">
                  <tr>
                    <th className="py-2.5 px-4">Guess Difference</th>
                    <th className="py-2.5 px-4 text-center">Precision</th>
                    <th className="py-2.5 px-4 text-right">Awarded Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-xs">
                  <tr className="bg-emerald-950/20 text-emerald-300 font-bold">
                    <td className="py-3 px-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Exact Match (diff = 0)
                    </td>
                    <td className="py-3 px-4 text-center">100% Accuracy</td>
                    <td className="py-3 px-4 text-right text-sm text-emerald-400">+100 pts</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4">Difference of 1 to 2</td>
                    <td className="py-2.5 px-4 text-center text-slate-400">98% – 99%</td>
                    <td className="py-2.5 px-4 text-right text-cyan-400 font-bold">+75 pts</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4">Difference of 3 to 5</td>
                    <td className="py-2.5 px-4 text-center text-slate-400">95% – 97%</td>
                    <td className="py-2.5 px-4 text-right text-indigo-300 font-bold">+50 pts</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4">Difference of 6 to 10</td>
                    <td className="py-2.5 px-4 text-center text-slate-400">90% – 94%</td>
                    <td className="py-2.5 px-4 text-right text-amber-300 font-bold">+25 pts</td>
                  </tr>
                  <tr className="text-slate-500">
                    <td className="py-2.5 px-4">Difference &gt; 10</td>
                    <td className="py-2.5 px-4 text-center">&lt; 90%</td>
                    <td className="py-2.5 px-4 text-right font-bold">0 pts</td>
                  </tr>
                  <tr className="text-slate-500">
                    <td className="py-2.5 px-4">No guess submitted</td>
                    <td className="py-2.5 px-4 text-center">0%</td>
                    <td className="py-2.5 px-4 text-right font-bold">0 pts</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* First Exact Bonus */}
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex gap-3 items-center">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display font-bold text-sm text-amber-200">First Exact Bonus (+10 Points)</div>
              <p className="text-xs text-amber-300/80 mt-0.5">
                The first player to lock in an exact guess during the round receives an extra +10 bonus points based on authoritative server receipt timestamps.
              </p>
            </div>
          </div>

          {/* Golden Rule Guarantee */}
          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex gap-3 items-center">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display font-bold text-sm text-cyan-200">Zero-Trust Anti-Cheat</div>
              <p className="text-xs text-cyan-300/80 mt-0.5">
                Your secret number is never transmitted to your browser client in any shape or form until the server finalizes results. No devtools inspection can reveal your number ahead of time.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

