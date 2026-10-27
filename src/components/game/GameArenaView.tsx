// src/components/game/GameArenaView.tsx
import React, { useState } from 'react';
import { GameState, Player } from '../../types/game';
import { SynchronizedTimer } from './SynchronizedTimer';
import { TurnQueueBar } from './TurnQueueBar';
import { ActiveQuestionPanel } from './ActiveQuestionPanel';
import { QuestionHistoryFeed } from './QuestionHistoryFeed';
import { FinalGuessModal } from './FinalGuessModal';
import {
  Users,
  Crown,
  Eye,
  HelpCircle,
  Sparkles,
  Check
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

  const myNickname = localStorage.getItem('hn_nickname');
  const me = gameState.players.find(p => p.id === myPlayerId || (myNickname && p.nickname === myNickname));
  const otherPlayers = gameState.players.filter(p => p.id !== me?.id);
  const isGuessingPhase = gameState.phase === 'GUESSING_PHASE';

  // Find active asker's visible number for other answering players
  const currentActiveAsker = otherPlayers.find(p => p.id === gameState.activeQuestion?.askerId);
  const askerSecretNumber = currentActiveAsker ? currentActiveAsker.secretNumber : null;

  return (
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col justify-between max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-6 z-10 space-y-5">
      {/* Top Arena Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-[#131722] text-[#D4AF37] border border-[#C5A059]/30 font-bold">
              ROUND {gameState.currentRound} OF {gameState.totalRounds}
            </span>
            <span className="text-[11px] sm:text-xs font-mono text-[#8F8B83]">
              {isGuessingPhase ? 'FINAL GUESS PHASE' : 'TURN-BASED INTERROGATION PHASE'}
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
          phaseName={isGuessingPhase ? 'Guess Deadline' : 'Interrogation Window'}
        />
      </div>

      {/* Concealed Mystery Number Card (Self) */}
      {me && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#0D1017] border-2 border-[#D4AF37]/50 shadow-2xl shadow-black/80">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center md:text-left">
              <div
                onClick={() => onInspectPlayer?.(me.id)}
                className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8C6D34] to-[#D4AF37] flex items-center justify-center font-display font-black text-black text-xl shadow-md shrink-0 cursor-pointer hover:scale-105 transition-transform"
                title="Click to view dossier"
              >
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
                  Your number is concealed. Ask deduction questions on your turn to figure it out.
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
                    Hidden to you • Visible to opponents
                  </div>
                </div>
              </div>

              <div className="hidden sm:block text-right font-mono text-xs">
                <div className="text-[#8F8B83]">Career Score</div>
                <div className="text-base font-bold text-[#FAF8F5]">{me.cumulativeScore} pts</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Opponents' Visible Numbers Grid */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="font-display font-bold text-xs sm:text-sm text-[#FAF8F5] uppercase tracking-wider">
              Opponents&apos; Assigned Numbers (Known to You)
            </h2>
          </div>
          <span className="text-xs font-mono text-[#D4AF37]">
            Inspect their numbers to answer their inquiries accurately
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {otherPlayers.map((player) => (
            <div
              key={player.id}
              className={`p-3.5 rounded-2xl bg-[#0D1017] border transition-all ${
                gameState.activeQuestion?.askerId === player.id
                  ? 'border-[#D4AF37] shadow-lg shadow-[#D4AF37]/15 ring-1 ring-[#D4AF37]/40'
                  : 'border-[#C5A059]/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    onClick={() => onInspectPlayer?.(player.id)}
                    className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8C6D34] to-[#D4AF37] flex items-center justify-center font-display font-black text-black text-xs shadow shrink-0 cursor-pointer hover:scale-105 transition-transform"
                    title="Click to view dossier"
                  >
                    {player.nickname.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        onClick={() => onInspectPlayer?.(player.id)}
                        className="font-display font-bold text-xs text-[#FAF8F5] hover:text-[#D4AF37] transition-colors cursor-pointer"
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

              {/* Big Prominent Number Card */}
              <div className="p-2.5 rounded-xl bg-[#131722] border border-[#C5A059]/30 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-[#A7A29A]">
                  Their Number:
                </span>
                <span className="text-2xl font-display font-black text-[#D4AF37]">
                  {player.secretNumber !== null ? player.secretNumber : '--'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Turn Queue Ribbon */}
      {gameState.turnState && (
        <TurnQueueBar
          turnOrder={gameState.turnState.turnOrder}
          currentAskerId={gameState.turnState.currentAskerId}
          myPlayerId={myPlayerId}
          onInspectPlayer={onInspectPlayer}
        />
      )}

      {/* Centerpiece: ACTIVE QUESTION & TURN COMPOSER */}
      <ActiveQuestionPanel
        activeQuestion={gameState.activeQuestion ?? null}
        turnState={gameState.turnState}
        myPlayerId={myPlayerId}
        askerSecretNumber={askerSecretNumber}
        onAskQuestion={(content) => onAskQuestion(content)}
        onSubmitAnswer={(qId, ans) => onSubmitAnswer(qId, ans)}
        disabled={isGuessingPhase}
      />

      {/* Question History Feed */}
      <QuestionHistoryFeed
        questionHistory={gameState.questionHistory || []}
        myPlayerId={myPlayerId}
      />

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
