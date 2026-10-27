// src/components/game/QuestionChatFeed.tsx
import React, { useEffect, useRef } from 'react';
import { GameMessage } from '../../types/game';
import { MessageSquare } from 'lucide-react';

interface Props {
  messages: GameMessage[];
  myPlayerId: string;
  onSelectQuestion?: (questionId: string) => void;
  selectedQuestionId?: string | null;
}

export const QuestionChatFeed: React.FC<Props> = ({
  messages,
  myPlayerId,
  onSelectQuestion,
  selectedQuestionId
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-[#C5A059]/20">
      {messages.length === 0 ? (
        <div className="h-44 flex flex-col items-center justify-center text-center text-xs font-mono text-[#8F8B83]">
          <MessageSquare className="w-6 h-6 mb-2 text-[#C5A059] opacity-40" />
          <span>No deduction inquiries yet. Ask a question below to deduce your number!</span>
        </div>
      ) : (
        messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div
                key={msg.id}
                className="text-center my-2 text-[11px] font-mono text-[#D4AF37] bg-[#131722] border border-[#C5A059]/25 py-1 px-3 rounded-full mx-auto max-w-sm"
              >
                {msg.content}
              </div>
            );
          }

          const isMyQuestion = msg.senderId === myPlayerId;
          const isSelected = selectedQuestionId === msg.id;

          return (
            <div
              key={msg.id}
              onClick={() => onSelectQuestion?.(msg.id)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#181E2C] border-[#D4AF37] shadow-md shadow-[#D4AF37]/15 ring-1 ring-[#D4AF37]/40'
                  : isMyQuestion
                  ? 'bg-[#131722] border-[#C5A059]/30'
                  : 'bg-[#0D1017] border-[#C5A059]/15 hover:border-[#C5A059]/35'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#8C6D34] to-[#D4AF37] flex items-center justify-center text-[10px] font-bold text-black">
                    {msg.senderName?.charAt(0) || '?'}
                  </div>
                  <span className="font-display font-bold text-xs text-[#FAF8F5]">
                    {msg.senderName}
                  </span>
                  {isMyQuestion && (
                    <span className="text-[9px] font-mono px-1 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                      YOU
                    </span>
                  )}
                </div>

                <span className="text-[10px] font-mono text-[#8F8B83]">
                  {new Date(msg.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}
                </span>
              </div>

              {/* Question Body */}
              <p className="text-sm text-[#F5F2EB] font-sans pl-6">
                "{msg.content}"
              </p>

              {/* Threaded Answers */}
              {msg.answers && msg.answers.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[#C5A059]/15 space-y-1 pl-6">
                  {msg.answers.map((ans) => {
                    const isMyAns = ans.senderId === myPlayerId;
                    return (
                      <div
                        key={ans.id}
                        className="flex items-center gap-2 text-xs font-mono"
                      >
                        <span className="text-[#A7A29A] font-semibold">{ans.senderName}:</span>
                        <span className="px-2 py-0.5 rounded-md bg-[#181E2C] text-[#D4AF37] font-bold border border-[#C5A059]/35">
                          {ans.answer}
                        </span>
                        {isMyAns && <span className="text-[9px] text-[#8F8B83]">(you)</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
};
