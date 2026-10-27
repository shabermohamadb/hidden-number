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
      <div className="relative w-full max-w-2xl bg-[#0D1017] border border-[#C5A059]/35 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-[#C5A059]/20">
          <div>
            <h2 className="font-display font-black text-2xl text-[#FAF8F5] tracking-wide flex items-center gap-2">
              <Award className="w-6 h-6 text-[#D4AF37]" />
              <span>SCORING & RULES</span>
            </h2>
            <p className="text-xs text-[#8F8B83] font-sans mt-0.5">
              Server-authoritative scoring table & precision metrics
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#131722] hover:bg-[#1B2130] text-[#A7A29A] hover:text-[#FAF8F5] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-6 py-4 pr-1 text-[#F5F2EB]">
          {/* Scoring Table */}
          <div>
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-[#D4AF37] mb-3 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#D4AF37]" />
              <span>Round Points Breakdown</span>
            </h3>

            <div className="border border-[#C5A059]/25 rounded-2xl overflow-hidden bg-[#131722]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#181E2C] border-b border-[#C5A059]/20 text-xs font-mono uppercase text-[#A7A29A]">
                  <tr>
                    <th className="py-2.5 px-4">Guess Difference</th>
                    <th className="py-2.5 px-4 text-center">Precision</th>
                    <th className="py-2.5 px-4 text-right">Awarded Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C5A059]/15 font-mono text-xs">
                  <tr className="bg-[#1B2232] text-[#D4AF37] font-bold">
                    <td className="py-3 px-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                      Exact Match (diff = 0)
                    </td>
                    <td className="py-3 px-4 text-center">100% Accuracy</td>
                    <td className="py-3 px-4 text-right text-sm text-[#F3E5AB]">+100 pts</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4">Difference of 1 to 2</td>
                    <td className="py-2.5 px-4 text-center text-[#8F8B83]">98% – 99%</td>
                    <td className="py-2.5 px-4 text-right text-[#D4AF37] font-bold">+75 pts</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4">Difference of 3 to 5</td>
                    <td className="py-2.5 px-4 text-center text-[#8F8B83]">95% – 97%</td>
                    <td className="py-2.5 px-4 text-right text-[#C5A059] font-bold">+50 pts</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4">Difference of 6 to 10</td>
                    <td className="py-2.5 px-4 text-center text-[#8F8B83]">90% – 94%</td>
                    <td className="py-2.5 px-4 text-right text-[#A7A29A] font-bold">+25 pts</td>
                  </tr>
                  <tr className="text-[#5A564F]">
                    <td className="py-2.5 px-4">Difference &gt; 10</td>
                    <td className="py-2.5 px-4 text-center">&lt; 90%</td>
                    <td className="py-2.5 px-4 text-right font-bold">0 pts</td>
                  </tr>
                  <tr className="text-[#5A564F]">
                    <td className="py-2.5 px-4">No guess submitted</td>
                    <td className="py-2.5 px-4 text-center">0%</td>
                    <td className="py-2.5 px-4 text-right font-bold">0 pts</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* First Exact Bonus */}
          <div className="p-4 rounded-2xl bg-[#131722] border border-[#C5A059]/25 flex gap-3 items-center">
            <div className="w-9 h-9 rounded-xl bg-[#181E2C] text-[#D4AF37] border border-[#C5A059]/30 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display font-bold text-sm text-[#F5F2EB]">First Exact Bonus (+10 Points)</div>
              <p className="text-xs text-[#A7A29A] mt-0.5">
                The first player to lock in an exact guess during the round receives an extra +10 bonus points based on authoritative server receipt timestamps.
              </p>
            </div>
          </div>

          {/* Golden Rule Security Guarantee */}
          <div className="p-4 rounded-2xl bg-[#131722] border border-[#C5A059]/25 flex gap-3 items-center">
            <div className="w-9 h-9 rounded-xl bg-[#181E2C] text-[#D4AF37] border border-[#C5A059]/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display font-bold text-sm text-[#F5F2EB]">Zero-Knowledge Anti-Cheat</div>
              <p className="text-xs text-[#A7A29A] mt-0.5">
                The server strips your secret number from all Socket.IO payloads and DOM states during active play. It is mathematically impossible to inspect or leak your number before the reveal phase.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#C5A059]/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#9A7B38] via-[#D4AF37] to-[#8C6D34] hover:from-[#B89243] hover:via-[#E5C158] hover:to-[#A7833D] text-black font-bold text-sm shadow-lg shadow-[#D4AF37]/20 border border-[#F3E5AB]/30 transition-all"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
