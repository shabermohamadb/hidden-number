// src/components/game/GameArenaView.tsx
import React, { useState } from 'react';
import { GameState, Player } from '../../types/game';
import { SynchronizedTimer } from './SynchronizedTimer';
import { QuestionChatFeed } from './QuestionChatFeed';
import { QuestionComposer } from './QuestionComposer';
import { QuickAnswerBar } from './QuickAnswerBar';
import { FinalGuessModal } from './FinalGuessModal';
import {
  MessageSquare,
  Users,
  ArrowLeft,
  Crosshair,
  Check,
  Crown,
  Eye,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  gameState: GameState;
  myPlayerId: string;
  onAskQuestion: (content: string, targetPlayerId?: string) => Promise<{ success: boolean; error?: string }>;
  onSubmitAnswer: (questionId: string, answer: string, targetPlayerId?: string) => Promise<{ success: boolean; error?: string }>;
  onSubmitGuess: (guess: number) => Promise<{ success: boolean; error?: string }>;
  onInspectPlayer?: (playerId: string) => void;
  isSubmittingGuess: boolean;
}

export const GameArenaView: React.FC<Props> = ({
  gameState,
  myPlayerId,
  onAskQuestion,
  onSubmitAnswer,
  onSubmitGuess,
  onInspectPlayer,
  isSubmittingGuess
}) => {
  const { playClick } = useSoundFX();
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'target' | 'all'>('all');

  const myNickname = localStorage.getItem('hn_nickname');
  const me = gameState.players.find(p => p.id === myPlayerId || (myNickname && p.nickname === myNickname));
  const otherPlayers = gameState.players.filter(p => p.id !== me?.id);
  const isGuessingPhase = gameState.phase === 'GUESSING_PHASE';

  // Target player details if in focused 1-on-1 view
  const targetPlayer = otherPlayers.find(p => p.id === selectedTargetId);

  // Filter messages for the focused target view
  const filteredMessages = React.useMemo(() => {
    if (!targetPlayer || filterMode === 'all') {
      return gameState.messages;
    }
    // Filter messages that involve the current target or the player
    return gameState.messages.filter(m => {
      if (m.type === 'system') return true;
      if (m.senderId === targetPlayer.id || m.senderId === me?.id) return true;
      if (m.targetPlayerId === targetPlayer.id || m.targetPlayerId === me?.id) return true;
      return false;
    });
  }, [gameState.messages, targetPlayer, filterMode, me?.id]);

  const handleQuickAnswer = (answer: string) => {
    const activeQuestion = gameState.messages
      .slice()
      .reverse()
      .find(m => m.type === 'question' && (selectedQuestionId ? m.id === selectedQuestionId : true));

    if (activeQuestion) {
      onSubmitAnswer(activeQuestion.id, answer, targetPlayer?.id || activeQuestion.senderId);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col justify-between max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-6 z-10">
      {/* Top Arena Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-[#131722] text-[#D4AF37] border border-[#C5A059]/30">
              ROUND {gameState.currentRound} OF {gameState.totalRounds}
            </span>
            <span className="text-[11px] sm:text-xs font-mono text-[#8F8B83]">
              {isGuessingPhase ? 'FINAL GUESS PHASE' : 'ONE-ON-ONE DEDUCTION PHASE'}
            </span>
          </div>
          <h1 className="font-display font-black text-xl sm:text-2xl text-[#FAF8F5] tracking-wide">
            {isGuessingPhase ? 'DEDUCTION LOCK-IN' : 'DIGITAL MIND ARENA'}
          </h1>
        </div>

        {/* Synchronized Server Timer */}
        <SynchronizedTimer
          deadline={
            isGuessingPhase
              ? gameState.deadlines?.guessDeadline ?? null
              : gameState.deadlines?.questionDeadline ?? null
          }
          totalDuration={
            isGuessingPhase
              ? gameState.settings.guessTime
              : gameState.settings.questionTime
          }
          phaseName={isGuessingPhase ? 'Guess Deadline' : 'Deduction Window'}
        />
      </div>

      {/* STAGE A: TARGET SELECTOR VIEW (No opponent currently focused) */}
      {!targetPlayer ? (
        <div className="space-y-6 flex-1">
          {/* Current Player's Concealed Mystery Card (Clear Golden Rule Distinction) */}
          {me && (
            <div className="p-4 sm:p-6 rounded-3xl bg-[#0D1017] border-2 border-[#D4AF37]/50 shadow-2xl shadow-black/80">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-center md:text-left">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8C6D34] to-[#D4AF37] flex items-center justify-center font-display font-black text-black text-xl shadow-md shrink-0">
                    {me.nickname.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <span className="font-display font-black text-lg text-[#FAF8F5]">
                        {me.nickname}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-bold">
                        YOU
                      </span>
                    </div>
                    <p className="text-xs text-[#8F8B83] mt-0.5">
                      Your number is secret. Interrogate opponents below to figure out your concealed number.
                    </p>
                  </div>
                </div>

                {/* Concealed Number Box */}
                <div className="flex items-center gap-3">
                  <div className="relative px-6 py-2 rounded-2xl bg-[#07080B] border-2 border-dashed border-[#D4AF37]/60 flex items-center gap-3 shadow-inner">
                    <span className="text-[#D4AF37] font-display font-black text-3xl animate-bounce">
                      ?
                    </span>
                    <div className="text-left font-mono">
                      <div className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-wider">
                        CONCEALED NUMBER
                      </div>
                      <div className="text-[10px] text-[#8F8B83]">
                        Visible to all opponents
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:block text-right font-mono text-xs">
                    <div className="text-[#8F8B83]">Current Score</div>
                    <div className="text-base font-bold text-[#FAF8F5]">{me.cumulativeScore} pts</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Opponent Selector Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#D4AF37]" />
                <h2 className="font-display font-bold text-sm sm:text-base text-[#FAF8F5] uppercase tracking-wider">
                  Select Opponent to Interrogate
                </h2>
              </div>
              <span className="text-xs font-mono text-[#D4AF37]">
                Tap any player to open 1-on-1 deduction
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {otherPlayers.map((player) => (
                <div
                  key={player.id}
                  onClick={() => {
                    playClick();
                    setSelectedTargetId(player.id);
                  }}
                  className="group relative p-4 rounded-3xl bg-[#0D1017] border border-[#C5A059]/25 hover:border-[#D4AF37] shadow-lg hover:shadow-[#D4AF37]/10 transition-all cursor-pointer hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectPlayer?.(player.id);
                        }}
                        className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8C6D34] to-[#D4AF37] flex items-center justify-center font-display font-black text-black text-sm shadow shrink-0 hover:scale-105 transition-transform"
                        title="Click to view dossier"
                      >
                        {player.nickname.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              onInspectPlayer?.(player.id);
                            }}
                            className="font-display font-bold text-sm text-[#FAF8F5] hover:text-[#D4AF37] transition-colors"
                            title="Click to view dossier"
                          >
                            {player.nickname}
                          </span>
                          {player.isHost && <Crown className="w-3 h-3 text-[#D4AF37]" />}
                        </div>
                        <span className="text-[10px] font-mono text-[#8F8B83]">
                          Score: {player.cumulativeScore} pts
                        </span>
                      </div>
                    </div>

                    {player.hasGuessed ? (
                      <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Guessed
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#8F8B83] bg-[#131722] px-2 py-0.5 rounded-full border border-[#C5A059]/20">
                        Thinking
                      </span>
                    )}
                  </div>

                  {/* Big Visible Number for Opponent */}
                  <div className="my-2 p-3 rounded-2xl bg-[#131722] border border-[#C5A059]/30 flex items-center justify-between group-hover:border-[#D4AF37]/50 transition-all">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-[#A7A29A]">
                        Assigned Number:
                      </div>
                      <div className="text-[10px] text-[#8F8B83]">
                        (Known to you • Hidden to them)
                      </div>
                    </div>
                    <div className="text-3xl sm:text-4xl font-display font-black text-[#D4AF37]">
                      {player.secretNumber !== null ? player.secretNumber : '--'}
                    </div>
                  </div>

                  {/* Interrogate Action Button */}
                  <div className="mt-3 pt-2.5 border-t border-[#C5A059]/15 flex items-center justify-between text-xs font-mono text-[#D4AF37] group-hover:text-[#F3E5AB]">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>Interrogate {player.nickname}</span>
                    </span>
                    <span className="font-bold">Enter →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Arena Recent Activity / Clue Feed */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#0D1017]/80 border border-[#C5A059]/20">
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#C5A059]/15">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#FAF8F5]">
                  Arena Deduction Feed ({gameState.messages.length} inquiries)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#D4AF37] bg-[#131722] px-2 py-0.5 rounded-full border border-[#C5A059]/25">
                Live Broadcast
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto">
              <QuestionChatFeed
                messages={gameState.messages}
                myPlayerId={myPlayerId}
                onSelectQuestion={setSelectedQuestionId}
                selectedQuestionId={selectedQuestionId}
              />
            </div>
          </div>
        </div>
      ) : (
        /* STAGE B: FOCUSED 1-ON-1 DEDUCTION WORKSPACE FOR TARGET */
        <div className="space-y-4 flex-1">
          {/* Back Button & Target Identity Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-3xl bg-[#0D1017] border-2 border-[#D4AF37]/50 shadow-2xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  playClick();
                  setSelectedTargetId(null);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#131722] hover:bg-[#1B2130] border border-[#C5A059]/40 text-xs font-mono font-bold text-[#D4AF37] transition-all hover:scale-105 active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>← Back to Arena Roster</span>
              </button>

              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8C6D34] to-[#D4AF37] flex items-center justify-center font-display font-black text-black text-sm shadow">
                  {targetPlayer.nickname.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono uppercase text-[#8F8B83]">Interrogating:</span>
                    <span className="font-display font-bold text-sm text-[#FAF8F5]">{targetPlayer.nickname}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Target's Visible Assigned Number (Featured Boldly) */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="text-right font-mono">
                <div className="text-[10px] uppercase text-[#A7A29A]">
                  Their Number (Known to You):
                </div>
                <div className="text-[10px] text-[#8F8B83]">
                  Hidden to {targetPlayer.nickname}
                </div>
              </div>

              <div className="px-5 py-2 rounded-2xl bg-[#131722] border-2 border-[#D4AF37] text-3xl font-display font-black text-[#D4AF37] shadow-lg">
                {targetPlayer.secretNumber !== null ? targetPlayer.secretNumber : '--'}
              </div>
            </div>
          </div>

          {/* Focused 1-on-1 Deduction Terminal */}
          <div className="flex flex-col h-[520px] sm:h-[560px] bg-[#0D1017] border border-[#C5A059]/30 rounded-3xl p-4 sm:p-5 shadow-2xl">
            {/* Filter mode header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#C5A059]/20">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-display font-bold text-xs sm:text-sm text-[#FAF8F5] uppercase tracking-wider">
                  Deduction Channel with {targetPlayer.nickname}
                </h3>
              </div>

              <div className="flex items-center gap-1 bg-[#131722] p-1 rounded-xl border border-[#C5A059]/20 text-xs font-mono">
                <button
                  onClick={() => setFilterMode('target')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    filterMode === 'target'
                      ? 'bg-[#181E2C] text-[#D4AF37] font-bold border border-[#C5A059]/30'
                      : 'text-[#8F8B83] hover:text-[#FAF8F5]'
                  }`}
                >
                  With {targetPlayer.nickname}
                </button>
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    filterMode === 'all'
                      ? 'bg-[#181E2C] text-[#D4AF37] font-bold border border-[#C5A059]/30'
                      : 'text-[#8F8B83] hover:text-[#FAF8F5]'
                  }`}
                >
                  All Inquiries
                </button>
              </div>
            </div>

            {/* Conversation Messages */}
            <QuestionChatFeed
              messages={filteredMessages}
              myPlayerId={myPlayerId}
              onSelectQuestion={setSelectedQuestionId}
              selectedQuestionId={selectedQuestionId}
            />

            {/* Quick Clue Pills (Yes, No, Higher, Lower, Even, Odd) */}
            <div className="pt-2.5 border-t border-[#C5A059]/15">
              <QuickAnswerBar
                onQuickAnswer={handleQuickAnswer}
                disabled={isGuessingPhase}
              />
            </div>

            {/* Question Composer tailored for this target */}
            <div className="pt-2">
              <QuestionComposer
                onAsk={(content) => onAskQuestion(content, targetPlayer.id)}
                disabled={isGuessingPhase}
                targetNickname={targetPlayer.nickname}
              />
            </div>
          </div>
        </div>
      )}

      {/* Final Guessing Modal Overlay when Phase triggers */}
      {isGuessingPhase && (
        <FinalGuessModal
          remainingSeconds={gameState.remainingSeconds}
          onSubmit={onSubmitGuess}
          isSubmitting={isSubmittingGuess}
          hasSubmitted={gameState.mySubmittedGuess !== null}
          submittedGuess={gameState.mySubmittedGuess}
        />
      )}
    </div>
  );
};
