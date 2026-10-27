// src/components/game/ActiveQuestionPanel.tsx
import React, { useState } from 'react';
import { HelpCircle, Clock, Check, X, Send, Eye, Radio } from 'lucide-react';
import { ActiveQuestion, TurnState } from '../../types/game';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  activeQuestion: ActiveQuestion | null;
  turnState?: TurnState;
  myPlayerId: string;
  askerSecretNumber: number | null;
  onAskQuestion: (content: string) => Promise<{ success: boolean; error?: string }>;
  onSubmitAnswer: (questionId: string, answer: string) => Promise<{ success: boolean; error?: string }>;
  disabled?: boolean;
}

const QUESTION_SUGGESTIONS = [
  'Is my number greater than 50?',
  'Is my number an even number?',
  'Is my number between 25 and 75?',
  'Is my number divisible by 5?'
];

export const ActiveQuestionPanel: React.FC<Props> = ({
  activeQuestion,
  turnState,
  myPlayerId,
  askerSecretNumber,
  onAskQuestion,
  onSubmitAnswer,
  disabled = false
}) => {
  const { playClick } = useSoundFX();
  const [questionText, setQuestionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || isSubmitting || disabled) return;

    setErrorMsg(null);
    setIsSubmitting(true);
    playClick();

    const res = await onAskQuestion(questionText.trim());
    setIsSubmitting(false);

    if (res.success) {
      setQuestionText('');
    } else {
      setErrorMsg(res.error || 'Failed to submit question');
    }
  };

  const handleAnswerSubmit = async (answer: 'YES' | 'NO') => {
    if (!activeQuestion || isSubmitting || disabled) return;
    setErrorMsg(null);
    setIsSubmitting(true);
    playClick();

    const res = await onSubmitAnswer(activeQuestion.id, answer);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to submit answer');
    }
  };

  // ==========================================
  // CASE 1: ACTIVE QUESTION AWAITING ANSWERS
  // ==========================================
  if (activeQuestion && activeQuestion.status === 'AWAITING_ANSWERS') {
    const isAsker = activeQuestion.askerId === myPlayerId;
    const myAnswer = activeQuestion.myAnswer;
    const answersMap = new Map(activeQuestion.answers.map(a => [a.playerId, a.answer]));

    return (
      <div className="p-6 rounded-2xl bg-[#101719] border border-[#293130] space-y-6">
        {/* Asker & Question Text */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase text-[#A8C66C]">
              {isAsker ? 'YOUR QUESTION' : `${activeQuestion.askerName.toUpperCase()}'S QUESTION`}
            </span>
            <span className="text-[10px] font-mono text-[#A8ADA7]">
              ({activeQuestion.answeredCount}/{activeQuestion.totalRequiredAnswers} Answered)
            </span>
          </div>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-[#F1EBDD] tracking-wide">
            &ldquo;{activeQuestion.content}&rdquo;
          </h2>
        </div>

        {/* If Current User is an Answerer: Tactile YES / NO Controls */}
        {!isAsker && (
          <div className="p-4 rounded-xl bg-[#151D1D] border border-[#293130] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#A8ADA7]">
                Evaluating {activeQuestion.askerName}'s Secret Number:
              </span>
              {askerSecretNumber !== null && (
                <span className="px-2.5 py-0.5 rounded-lg bg-[#101719] border border-[#C6A45A]/40 font-mono font-bold text-[#C6A45A]">
                  #{askerSecretNumber}
                </span>
              )}
            </div>

            {myAnswer ? (
              <div className="flex items-center justify-center gap-2 py-2 text-xs font-mono font-bold">
                <Check className="w-4 h-4 text-[#A8C66C]" />
                <span className="text-[#F1EBDD]">
                  You answered: <strong className={myAnswer === 'YES' ? 'text-[#A8C66C]' : 'text-[#E05D52]'}>{myAnswer}</strong>
                </span>
                <span className="text-[10px] text-[#A8ADA7] ml-2">(Waiting for other players)</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  disabled={isSubmitting || disabled}
                  onClick={() => handleAnswerSubmit('YES')}
                  className="py-3 rounded-xl bg-[#A8C66C] hover:bg-[#B8D47C] text-[#070B0D] font-display font-bold text-sm tracking-wide transition-all shadow-md active:scale-98 disabled:opacity-50"
                >
                  YES
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || disabled}
                  onClick={() => handleAnswerSubmit('NO')}
                  className="py-3 rounded-xl bg-[#151D1D] hover:bg-[#1E2728] border border-[#E05D52]/50 text-[#E05D52] font-display font-bold text-sm tracking-wide transition-all active:scale-98 disabled:opacity-50"
                >
                  NO
                </button>
              </div>
            )}
          </div>
        )}

        {/* Awaiting Answers Status Cards */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#A8ADA7] font-semibold block">
            AWAITING ANSWERS
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {turnState?.turnOrder
              .filter(p => p.playerId !== activeQuestion.askerId)
              .map(player => {
                const ans = answersMap.get(player.playerId);
                const isPending = !ans;

                return (
                  <div
                    key={player.playerId}
                    className="p-3 rounded-xl bg-[#151D1D] border border-[#293130] flex flex-col items-center justify-center text-center"
                  >
                    <span className="text-xs font-mono font-medium text-[#F1EBDD] truncate max-w-[120px]">
                      {player.nickname}
                    </span>
                    <span className="text-xs font-mono text-[#A8ADA7] my-0.5">—</span>
                    <span
                      className={`text-[10px] font-mono font-bold tracking-wider ${
                        isPending
                          ? 'text-[#A8ADA7]'
                          : ans === 'YES'
                          ? 'text-[#A8C66C]'
                          : 'text-[#E05D52]'
                      }`}
                    >
                      {isPending ? 'PENDING' : ans}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs font-mono text-[#E05D52] text-center">{errorMsg}</p>
        )}
      </div>
    );
  }

  // ==========================================
  // CASE 2: CURRENT USER'S TURN TO ASK
  // ==========================================
  if (turnState?.isMyTurnToAsk) {
    return (
      <div className="p-6 rounded-2xl bg-[#101719] border border-[#293130] space-y-4">
        <div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-[#A8C66C] tracking-wide">
            YOUR TURN
          </h2>
          <p className="text-xs text-[#A8ADA7] font-sans mt-0.5">
            Ask a question to find your number
          </p>
        </div>

        {/* Question Form */}
        <form onSubmit={handleAskSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              required
              disabled={isSubmitting || disabled}
              placeholder="Type your question here..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-[#151D1D] border border-[#293130] text-[#F1EBDD] placeholder-[#A8ADA7]/60 text-sm font-sans focus:outline-none focus:border-[#A8C66C]"
            />
            <button
              type="submit"
              disabled={isSubmitting || disabled || !questionText.trim()}
              className="px-6 py-3 rounded-xl bg-[#A8C66C] hover:bg-[#B8D47C] disabled:bg-[#1E2728] disabled:text-[#A8ADA7] text-[#070B0D] font-display font-bold text-sm tracking-wide transition-all shadow-md active:scale-98"
            >
              ASK
            </button>
          </div>

          <p className="text-[11px] font-mono text-[#A8ADA7]">
            Example: Is my number greater than 50?
          </p>

          {/* Quick Deduction Suggestion Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-mono text-[#A8ADA7] mr-1">Quick Suggestions:</span>
            {QUESTION_SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => setQuestionText(sug)}
                className="px-2.5 py-1 rounded-lg bg-[#151D1D] hover:bg-[#1E2728] border border-[#293130] text-[11px] font-mono text-[#A8ADA7] hover:text-[#F1EBDD] transition-colors"
              >
                {sug}
              </button>
            ))}
          </div>

          {errorMsg && (
            <p className="text-xs font-mono text-[#E05D52]">{errorMsg}</p>
          )}
        </form>
      </div>
    );
  }

  // ==========================================
  // CASE 3: WAITING FOR ANOTHER ASKER
  // ==========================================
  const currentAskerName = turnState?.currentAskerName || 'Another player';

  return (
    <div className="p-8 rounded-2xl bg-[#101719] border border-[#293130] text-center space-y-2">
      <div className="w-10 h-10 rounded-full bg-[#151D1D] border border-[#293130] flex items-center justify-center mx-auto text-[#A8C66C]">
        <Clock className="w-5 h-5" />
      </div>
      <h3 className="font-display font-bold text-base text-[#F1EBDD]">
        Waiting for {currentAskerName}
      </h3>
      <p className="text-xs text-[#A8ADA7] font-sans max-w-sm mx-auto">
        It is currently {currentAskerName}'s turn to formulate and submit a deduction inquiry. You will be prompted to answer YES or NO once submitted.
      </p>
    </div>
  );
};
