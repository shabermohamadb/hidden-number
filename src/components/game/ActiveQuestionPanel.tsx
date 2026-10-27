// src/components/game/ActiveQuestionPanel.tsx
import React, { useState } from 'react';
import {
  HelpCircle,
  Clock,
  Check,
  X,
  Send,
  Sparkles,
  AlertCircle,
  Eye,
  CheckCircle2,
  XCircle,
  Radio
} from 'lucide-react';
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
  'Is my number a single digit (1-9)?',
  'Is my number divisible by 5?',
  'Is my number higher than 70?'
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
  const { playClick, playTimerAlert } = useSoundFX();
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
  // CASE 1: ACTIVE QUESTION IN PROGRESS
  // ==========================================
  if (activeQuestion && activeQuestion.status === 'AWAITING_ANSWERS') {
    const isAsker = activeQuestion.askerId === myPlayerId;
    const myAnswer = activeQuestion.myAnswer;
    const progressPercent = activeQuestion.totalRequiredAnswers > 0
      ? Math.round((activeQuestion.answeredCount / activeQuestion.totalRequiredAnswers) * 100)
      : 0;

    return (
      <div className="p-5 sm:p-6 rounded-3xl bg-[#0D1017] border-2 border-[#D4AF37] shadow-2xl shadow-[#D4AF37]/15 animate-in fade-in zoom-in-95 duration-200">
        {/* Active Question Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#D4AF37]/25">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8C6D34] to-[#D4AF37] flex items-center justify-center font-display font-black text-black text-base shadow-md shrink-0">
              {activeQuestion.askerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-sm sm:text-base text-[#FAF8F5]">
                  {activeQuestion.askerName}
                </span>
                {isAsker && (
                  <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-bold">
                    YOU ASKED
                  </span>
                )}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#181E2C] text-[#D4AF37] border border-[#D4AF37]/40 font-bold animate-pulse">
                  ACTIVE INQUIRY
                </span>
              </div>
              <span className="text-xs text-[#8F8B83] font-mono">
                Deduction inquiry about their own hidden number
              </span>
            </div>
          </div>

          {/* Response Counter & Timer */}
          <div className="flex items-center gap-3 self-end sm:self-auto font-mono text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-[#07080B] border border-[#D4AF37]/40 text-[#D4AF37] font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
              <span>{activeQuestion.answeredCount} / {activeQuestion.totalRequiredAnswers} Answered</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#131722] border border-white/10 text-[#FAF8F5] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{activeQuestion.remainingAnswerSeconds}s left</span>
            </div>
          </div>
        </div>

        {/* Question Text Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#07080B] border border-[#D4AF37]/30 text-center mb-5">
          <span className="text-[10px] font-mono uppercase text-[#D4AF37] tracking-widest font-bold block mb-1">
            Question Submitted
          </span>
          <h2 className="font-display font-black text-xl sm:text-2xl text-[#FAF8F5] leading-relaxed">
            &ldquo;{activeQuestion.content}&rdquo;
          </h2>
        </div>

        {/* Progress Bar */}
        <div className="mb-5 space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono text-[#8F8B83]">
            <span>Arena Responses</span>
            <span>{progressPercent}% Complete</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#131722] overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-[#8C6D34] to-[#D4AF37] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ACTION AREA */}
        {isAsker ? (
          /* Asker State: Waiting for opponents to answer with YES/NO */
          <div className="p-4 rounded-2xl bg-[#131722] border border-[#D4AF37]/30 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold text-[#D4AF37]">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Awaiting YES / NO responses from all arena opponents...</span>
            </div>
            <p className="text-xs text-[#8F8B83] max-w-md mx-auto font-sans">
              Opponents see your hidden number and are verifying your question. Once all have responded or the deadline expires, the answers will be locked in.
            </p>

            {/* Live response pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {activeQuestion.answers.map((ans) => (
                <div
                  key={ans.playerId}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border flex items-center gap-1.5 ${
                    ans.answer === 'YES'
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {ans.answer === 'YES' ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>{ans.nickname}: {ans.answer}</span>
                </div>
              ))}
            </div>
          </div>
        ) : myAnswer ? (
          /* Answerer State: Already submitted YES/NO */
          <div className="p-4 rounded-2xl bg-[#131722] border border-emerald-500/40 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm font-mono font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>You answered: {myAnswer}</span>
            </div>
            <p className="text-xs font-mono text-[#8F8B83]">
              Response recorded on server. Waiting for remaining opponents to answer...
            </p>
          </div>
        ) : (
          /* Answerer State: Must submit YES or NO */
          <div className="p-4 sm:p-5 rounded-2xl bg-[#131722] border-2 border-[#D4AF37]/60 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
              <div>
                <span className="text-xs font-mono font-bold text-[#FAF8F5]">
                  YOUR ANSWER REQUIRED: Look at {activeQuestion.askerName}&apos;s assigned number:
                </span>
                <span className="block text-xs font-mono text-[#8F8B83]">
                  Verify whether their question is truthful based on their visible number.
                </span>
              </div>
              {askerSecretNumber !== null && (
                <div className="px-4 py-1.5 rounded-xl bg-[#07080B] border border-[#D4AF37] font-display font-black text-2xl text-[#D4AF37] shadow">
                  {askerSecretNumber}
                </div>
              )}
            </div>

            {/* Exactly TWO Action Buttons: YES or NO */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <button
                type="button"
                disabled={isSubmitting || disabled}
                onClick={() => handleAnswerSubmit('YES')}
                className="py-4 rounded-2xl bg-gradient-to-tr from-emerald-950 to-emerald-800 hover:from-emerald-900 hover:to-emerald-700 border-2 border-emerald-500/60 hover:border-emerald-400 text-emerald-200 font-display font-black text-xl tracking-wider shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-6 h-6 stroke-[3]" />
                <span>YES</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting || disabled}
                onClick={() => handleAnswerSubmit('NO')}
                className="py-4 rounded-2xl bg-gradient-to-tr from-rose-950 to-rose-900 hover:from-rose-900 hover:to-rose-800 border-2 border-rose-500/60 hover:border-rose-400 text-rose-200 font-display font-black text-xl tracking-wider shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <X className="w-6 h-6 stroke-[3]" />
                <span>NO</span>
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <p className="mt-3 text-center text-xs font-mono text-rose-400">
            {errorMsg}
          </p>
        )}
      </div>
    );
  }

  // ==========================================
  // CASE 2: NO ACTIVE QUESTION — TURN TO ASK
  // ==========================================
  const isMyTurn = turnState?.isMyTurnToAsk ?? false;
  const currentAskerName = turnState?.currentAskerName || 'Another player';
  const remainingAskSeconds = turnState?.remainingAskSeconds ?? 20;

  if (isMyTurn) {
    return (
      <div className="p-5 sm:p-6 rounded-3xl bg-[#0D1017] border-2 border-[#D4AF37] shadow-2xl shadow-[#D4AF37]/20 animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#D4AF37]/25">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#D4AF37] animate-spin" style={{ animationDuration: '4s' }} />
            <div>
              <h3 className="font-display font-black text-base sm:text-lg text-[#FAF8F5] uppercase tracking-wider">
                IT&apos;S YOUR TURN TO ASK
              </h3>
              <p className="text-xs text-[#8F8B83] font-mono">
                Submit one deduction question about your concealed number. All opponents will answer YES or NO.
              </p>
            </div>
          </div>
          <div className="px-3 py-1 rounded-xl bg-[#131722] border border-[#D4AF37]/40 text-xs font-mono text-[#D4AF37] font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{remainingAskSeconds}s left to ask</span>
          </div>
        </div>

        {/* Composer Form */}
        <form onSubmit={handleAskSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              required
              minLength={2}
              maxLength={140}
              disabled={isSubmitting || disabled}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g. Is my hidden number greater than 50?"
              className="w-full px-4 py-3.5 pr-28 rounded-2xl bg-[#07080B] border-2 border-[#D4AF37]/50 text-[#FAF8F5] text-sm font-mono placeholder:text-stone-600 focus:outline-none focus:border-[#D4AF37] shadow-inner"
            />
            <button
              type="submit"
              disabled={!questionText.trim() || isSubmitting || disabled}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#9A7B38] to-[#D4AF37] text-black font-extrabold text-xs font-mono hover:scale-105 active:scale-95 transition-all disabled:opacity-40 shadow flex items-center gap-1.5"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Deduction Suggestions */}
          <div>
            <span className="text-[10px] font-mono uppercase text-[#8F8B83] block mb-2">
              Suggested deduction queries:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUESTION_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  disabled={isSubmitting || disabled}
                  onClick={() => {
                    playClick();
                    setQuestionText(sug);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-[#131722] hover:bg-[#1A1F2C] border border-[#C5A059]/30 text-[11px] font-mono text-[#A7A29A] hover:text-[#FAF8F5] transition-all"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-mono text-rose-400">{errorMsg}</p>
          )}
        </form>
      </div>
    );
  }

  // ==========================================
  // CASE 3: NO ACTIVE QUESTION — WAITING FOR ANOTHER ASKER
  // ==========================================
  return (
    <div className="p-6 rounded-3xl bg-[#0D1017] border border-[#C5A059]/30 text-center space-y-3 shadow-xl">
      <div className="w-12 h-12 rounded-2xl bg-[#131722] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mx-auto animate-pulse">
        <Clock className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-display font-bold text-base text-[#FAF8F5]">
          Waiting for {currentAskerName} to ask a question...
        </h3>
        <p className="text-xs text-[#8F8B83] font-mono mt-1">
          {remainingAskSeconds}s remaining on their turn. Inspect their assigned number to prepare your YES/NO answer.
        </p>
      </div>
    </div>
  );
};
