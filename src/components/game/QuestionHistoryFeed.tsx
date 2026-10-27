// src/components/game/QuestionHistoryFeed.tsx
import React, { useState } from 'react';
import { MessageSquare, Check, X, ChevronDown, ChevronUp, History } from 'lucide-react';
import { ActiveQuestion } from '../../types/game';

interface Props {
  questionHistory: ActiveQuestion[];
  myPlayerId: string;
}

export const QuestionHistoryFeed: React.FC<Props> = ({ questionHistory, myPlayerId }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!questionHistory || questionHistory.length === 0) {
    return (
      <div className="p-5 rounded-3xl bg-[#0D1017] border border-[#C5A059]/20 text-center py-8 space-y-2">
        <History className="w-6 h-6 text-[#7A756D] mx-auto" />
        <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#A7A29A]">
          Question History Empty
        </h4>
        <p className="text-xs font-mono text-[#7A756D]">
          Inquiries and their YES / NO deductions will be archived here as questions resolve.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-[#0D1017] border border-[#C5A059]/25 shadow-lg space-y-3">
      <div className="flex items-center justify-between pb-2.5 border-b border-[#C5A059]/15">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#FAF8F5]">
            Resolved Inquiries ({questionHistory.length})
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#8F8B83]">
          Chronological Record
        </span>
      </div>

      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
        {questionHistory.slice().reverse().map((q) => {
          const isExpanded = expandedId === q.id;
          const isMyQuestion = q.askerId === myPlayerId;
          const yesCount = q.answers.filter(a => a.answer === 'YES').length;
          const noCount = q.answers.filter(a => a.answer === 'NO').length;

          return (
            <div
              key={q.id}
              className="p-3.5 rounded-2xl bg-[#07080B] border border-white/5 hover:border-[#D4AF37]/30 transition-all text-xs font-mono"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : q.id)}
                className="flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#181E2C] border border-[#D4AF37]/30 flex items-center justify-center font-display font-black text-xs text-[#D4AF37] shrink-0">
                    {q.askerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-bold text-xs text-[#FAF8F5] truncate">
                        {q.askerName}
                      </span>
                      {isMyQuestion && (
                        <span className="text-[8px] font-mono px-1 rounded bg-[#D4AF37]/20 text-[#D4AF37]">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#FAF8F5] font-sans truncate font-medium mt-0.5">
                      &ldquo;{q.content}&rdquo;
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                      {yesCount} YES
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-950/60 text-rose-400 border border-rose-500/30">
                      {noCount} NO
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#A7A29A]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#A7A29A]" />
                  )}
                </div>
              </div>

              {/* Expanded Breakdown */}
              {isExpanded && (
                <div className="mt-3 pt-2.5 border-t border-white/5 space-y-1.5 animate-in fade-in duration-150">
                  <div className="text-[10px] uppercase text-[#7A756D] font-bold">
                    Individual Player Responses:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {q.answers.map((a) => (
                      <div
                        key={a.playerId}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 ${
                          a.answer === 'YES'
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {a.answer === 'YES' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        <span>{a.nickname}: {a.answer}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
