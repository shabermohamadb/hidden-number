// src/components/game/QuestionHistoryFeed.tsx
import React from 'react';
import { MessageSquare } from 'lucide-react';
import { ActiveQuestion } from '../../types/game';

interface Props {
  questionHistory: ActiveQuestion[];
  myPlayerId: string;
}

export const QuestionHistoryFeed: React.FC<Props> = ({ questionHistory, myPlayerId }) => {
  return (
    <div className="p-5 rounded-2xl bg-[#101719] border border-[#293130] flex flex-col justify-between h-full space-y-4">
      <div>
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#A8ADA7] block pb-2 border-b border-[#293130]/60 mb-3">
          QUESTION HISTORY
        </span>

        {(!questionHistory || questionHistory.length === 0) ? (
          <div className="py-8 text-center text-xs font-mono text-[#A8ADA7]/60">
            No questions asked yet in this round.
          </div>
        ) : (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {questionHistory.map((q, idx) => (
              <div key={q.id} className="text-xs font-mono space-y-1.5 pb-2.5 border-b border-[#293130]/40 last:border-0">
                <div className="text-[#F1EBDD] font-medium leading-snug">
                  <span className="text-[#A8C66C] mr-1">{idx + 1}.</span>
                  {q.content}
                </div>

                {/* YES / NO Answers pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {q.answers.map((ans) => (
                    <span
                      key={ans.id}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        ans.answer === 'YES'
                          ? 'text-[#A8C66C] bg-[#A8C66C]/10'
                          : 'text-[#E05D52] bg-[#E05D52]/10'
                      }`}
                    >
                      {ans.answer === 'YES' ? 'Yes' : 'No'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend at bottom */}
      <div className="pt-3 border-t border-[#293130]/60 flex items-center justify-start gap-4 text-[10px] font-mono text-[#A8ADA7]">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A8C66C]" />
          <span>Yes</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E05D52]" />
          <span>No</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A8ADA7]" />
          <span>Pending</span>
        </div>
      </div>
    </div>
  );
};
