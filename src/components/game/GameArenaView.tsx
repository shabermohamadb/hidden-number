// src/components/game/GameArenaView.tsx
import React, { useState } from 'react';
import { GameState } from '../../types/game';
import { TurnQueueBar } from './TurnQueueBar';
import { ActiveQuestionPanel } from './ActiveQuestionPanel';
import { QuestionHistoryFeed } from './QuestionHistoryFeed';
import { GuessPhaseView } from './GuessPhaseView';
import { MessageSquare, Target, Trophy, HelpCircle, Menu, Eye } from 'lucide-react';
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

  // Remaining time calculation
  const deadline = isGuessingPhase
    ? gameState.deadlines?.guessDeadline ?? null
    : gameState.deadlines?.questionDeadline ?? null;
  const totalDuration = isGuessingPhase
    ? gameState.settings.guessTime
    : gameState.settings.questionTime;
  const remainingSeconds = deadline
    ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
    : gameState.remainingSeconds ?? totalDuration;

  return (
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col justify-between max-w-6xl mx-auto px-4 sm:px-6 py-6 z-10 space-y-6">
      {/* Top Bar: Title, Round Indicator, and Menu Icon */}
      <div className="flex items-center justify-between pb-3 border-b border-[#293130]">
        <div className="flex items-center gap-3">
          <h1 className="font-display font-bold text-lg sm:text-xl text-[#F1EBDD] tracking-wide">
            {isGuessingPhase ? 'GUESS PHASE' : 'GAME'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#A8ADA7]">
            ROUND {gameState.currentRound} / {gameState.totalRounds}
          </span>
          <button
            title="Options"
            className="p-1.5 rounded-lg bg-[#101719] border border-[#293130] text-[#A8ADA7] hover:text-[#F1EBDD] transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Interactive Body */}
      {isGuessingPhase ? (
        /* SCREEN 4: GUESS PHASE */
        <GuessPhaseView
          roundNumber={gameState.currentRound}
          totalRounds={gameState.totalRounds}
          remainingSeconds={remainingSeconds}
          onSubmitGuess={onSubmitGuess}
          isSubmitting={isSubmittingGuess}
          hasSubmitted={Boolean(me?.hasSubmittedGuess)}
          submittedGuess={me?.guess ?? null}
        />
      ) : (
        /* SCREEN 3: QUESTION PHASE */
        <div className="space-y-6">
          {/* Turn Order Sequence Bar with Circular Timer */}
          <TurnQueueBar
            turnOrder={gameState.turnState?.turnOrder || []}
            currentAskerId={gameState.turnState?.currentAskerId || null}
            myPlayerId={me?.id || myPlayerId}
            onInspectPlayer={onInspectPlayer}
            remainingSeconds={remainingSeconds}
            totalDuration={totalDuration}
          />

          {/* Golden Rule Mystery Card & Opponents Numbers Bar */}
          <div className="p-4 rounded-2xl bg-[#101719] border border-[#293130] flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Self Mystery Card */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#151D1D] border border-[#293130] flex items-center justify-center font-mono font-bold text-lg text-[#C6A45A]">
                ?
              </div>
              <div>
                <span className="text-xs font-mono font-semibold text-[#F1EBDD] block">
                  {me?.nickname || 'Your Number'}
                </span>
                <span className="text-[10px] font-mono text-[#A8ADA7]">
                  Concealed from you (Others see your number)
                </span>
              </div>
            </div>

            {/* Other Players Visible Numbers (Golden Rule in action) */}
            <div className="flex items-center gap-2 overflow-x-auto max-w-full">
              <span className="text-[10px] font-mono text-[#A8ADA7] uppercase mr-1">Other Numbers:</span>
              {otherPlayers.map(p => (
                <div
                  key={p.id}
                  onClick={() => onInspectPlayer?.(p.id)}
                  className="px-2.5 py-1 rounded-lg bg-[#151D1D] border border-[#293130] text-xs font-mono flex items-center gap-1.5 cursor-pointer hover:border-[#394341]"
                >
                  <span className="text-[#A8ADA7] max-w-[70px] truncate">{p.nickname}:</span>
                  <span className="font-bold text-[#A8C66C]">{p.secretNumber ?? '?'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Center 2-Column Interrogation Arena */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Active Question Deduction Panel (7 cols) */}
            <div className="lg:col-span-7">
              <ActiveQuestionPanel
                activeQuestion={gameState.activeQuestion || null}
                turnState={gameState.turnState}
                myPlayerId={me?.id || myPlayerId}
                askerSecretNumber={askerSecretNumber}
                onAskQuestion={(content) => onAskQuestion(content)}
                onSubmitAnswer={(qId, ans) => onSubmitAnswer(qId, ans)}
              />
            </div>

            {/* Right-Hand Question History Sidebar (5 cols) */}
            <div className="lg:col-span-5 h-full">
              <QuestionHistoryFeed
                questionHistory={gameState.questionHistory || []}
                myPlayerId={me?.id || myPlayerId}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="pt-6 border-t border-[#293130] flex items-center justify-around text-xs font-mono text-[#A8ADA7]">
        <div className={`flex flex-col items-center gap-1 cursor-pointer ${!isGuessingPhase ? 'text-[#A8C66C]' : 'hover:text-[#F1EBDD]'}`}>
          <HelpCircle className="w-4 h-4" />
          <span className="text-[10px] uppercase font-bold tracking-wider">Questions</span>
        </div>
        <div className={`flex flex-col items-center gap-1 cursor-pointer ${isGuessingPhase ? 'text-[#A8C66C]' : 'hover:text-[#F1EBDD]'}`}>
          <Target className="w-4 h-4" />
          <span className="text-[10px] uppercase font-bold tracking-wider">Guess</span>
        </div>
        <div className="flex flex-col items-center gap-1 hover:text-[#F1EBDD] cursor-pointer transition-colors">
          <Trophy className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-wider">Rankings</span>
        </div>
        <div className="flex flex-col items-center gap-1 hover:text-[#F1EBDD] cursor-pointer transition-colors">
          <MessageSquare className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-wider">Chat</span>
        </div>
      </div>
    </div>
  );
};
