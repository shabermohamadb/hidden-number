// src/components/game/QuestionChatFeed.tsx
import React, { useEffect, useRef } from 'react';
import { GameMessage } from '../../types/game';
import { MessageSquare, HelpCircle, CheckCircle2 } from 'lucide-react';

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
    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10">
      {messages.length === 0 ? (
        <div className="h-44 flex flex-col items-center justify-center text-center text-xs font-mono text-slate-500">
          <MessageSquare className="w-6 h-6 mb-2 opacity-30" />
          <span>Interrogation feed active. Ask a question below to deduce your number!</span>
        </div>
      ) : (
        messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div
                key={msg.id}
                className="text-center my-2 text-[11px] font-mono text-cyan-400/80 bg-cyan-950/30 border border-cyan-800/30 py-1 px-3 rounded-full mx-auto max-w-sm"
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
                  ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-500/10'
                  : isMyQuestion
                  ? 'bg-indigo-950/30 border-indigo-500/30'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/15'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                    {msg.senderName?.charAt(0) || '?'}
                  </div>
                  <span className="font-display font-bold text-xs text-slate-200">
                    {msg.senderName}
                  </span>
                  {isMyQuestion && (
                    <span className="text-[9px] font-mono px-1 rounded bg-indigo-500/20 text-indigo-300">
                      YOU
                    </span>
                  )}
                </div>

                <span className="text-[10px] font-mono text-slate-500">
                  {new Date(msg.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}
                </span>
              </div>

              {/* Question Body */}
              <p className="text-sm text-slate-100 font-sans pl-6">
                "{msg.content}"
              </p>

              {/* Threaded Answers */}
              {msg.answers && msg.answers.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1 pl-6">
                  {msg.answers.map((ans) => {
                    const isMyAns = ans.senderId === myPlayerId;
                    return (
                      <div
                        key={ans.id}
                        className="flex items-center gap-2 text-xs font-mono"
                      >
                        <span className="text-slate-400 font-semibold">{ans.senderName}:</span>
                        <span className="px-2 py-0.5 rounded-md bg-cyan-950/60 text-cyan-300 font-bold border border-cyan-800/40">
                          {ans.answer}
                        </span>
                        {isMyAns && <span className="text-[9px] text-slate-500">(you)</span>}
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

