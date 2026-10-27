// src/components/game/GameArenaView.tsx
import React, { useState } from 'react';
import { GameState } from '../../types/game';
import { PlayerCircleCard } from './PlayerCircleCard';
import { SynchronizedTimer } from './SynchronizedTimer';
import { QuestionChatFeed } from './QuestionChatFeed';
import { QuestionComposer } from './QuestionComposer';
import { QuickAnswerBar } from './QuickAnswerBar';
import { FinalGuessModal } from './FinalGuessModal';
import { MessageSquare, Shield, HelpCircle, Users, LayoutGrid } from 'lucide-react';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  gameState: GameState;
  myPlayerId: string;
  onAskQuestion: (content: string) => Promise<{ success: boolean; error?: string }>;
  onSubmitAnswer: (questionId: string, answer: string, targetPlayerId?: string) => Promise<{ success: boolean; error?: string }>;
  onSubmitGuess: (guess: number) => Promise<{ success: boolean; error?: string }>;
  isSubmittingGuess: boolean;
}

export const GameArenaView: React.FC<Props> = ({
  gameState,
  myPlayerId,
  onAskQuestion,
  onSubmitAnswer,
  onSubmitGuess,
  isSubmittingGuess
}) => {
  const { playClick } = useSoundFX();
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [targetedPlayerId, setTargetedPlayerId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'cards' | 'chat'>('cards');

  const myNickname = localStorage.getItem('hn_nickname');
  const me = gameState.players.find(p => p.id === myPlayerId || (myNickname && p.nickname === myNickname));
  const otherPlayers = gameState.players.filter(p => p.id !== me?.id);
  const isGuessingPhase = gameState.phase === 'GUESSING_PHASE';

  const handleQuickAnswer = (answer: string) => {
    const activeQuestion = gameState.messages
      .slice()
      .reverse()
      .find(m => m.type === 'question' && (selectedQuestionId ? m.id === selectedQuestionId : true));

    if (activeQuestion) {
      onSubmitAnswer(activeQuestion.id, answer, targetedPlayerId || activeQuestion.senderId);
    }
  };

  const targetedPlayer = gameState.players.find(p => p.id === targetedPlayerId);

  return (
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col justify-between max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-6 z-10">
      {/* Top Arena Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/40">
              ROUND {gameState.currentRound} OF {gameState.totalRounds}
            </span>
            <span className="text-[11px] sm:text-xs font-mono text-slate-400">
              {isGuessingPhase ? 'FINAL GUESS PHASE' : 'INTERROGATION PHASE'}
            </span>
          </div>
          <h1 className="font-display font-black text-xl sm:text-2xl text-white tracking-wide">
            {isGuessingPhase ? 'DEDUCTION LOCK-IN' : 'DIGITAL MIND ARENA'}
          </h1>
        </div>

        {/* Authoritative Synchronized Timer */}
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
          phaseName={isGuessingPhase ? 'Guess Deadline' : 'Question Window'}
        />
      </div>

      {/* Mobile Tab Switcher (Visible only on small screens < 1024px) */}
      <div className="flex lg:hidden w-full bg-slate-900/90 border border-white/10 rounded-2xl p-1 mb-4 shadow-xl">
        <button
          onClick={() => {
            playClick();
            setMobileTab('cards');
          }}
          className={`flex-1 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'cards'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Arena Cards</span>
        </button>

        <button
          onClick={() => {
            playClick();
            setMobileTab('chat');
          }}
          className={`flex-1 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'chat'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat Feed ({gameState.messages.length})</span>
        </button>
      </div>

      {/* Main Arena Workspace (Left: Player Grid, Right: Interrogation Feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 flex-1 items-start">
        {/* Left Column: Player Cards (7 cols) */}
        <div className={`lg:col-span-7 space-y-4 sm:space-y-6 ${mobileTab !== 'cards' ? 'hidden lg:block' : 'block'}`}>
          {/* Target selection banner if clicked an opponent */}
          {targetedPlayer && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-xs font-mono">
              <span className="text-indigo-200">
                Cluing: <strong className="text-white">{targetedPlayer.nickname}</strong> (Their number: {targetedPlayer.secretNumber})
              </span>
              <button
                onClick={() => setTargetedPlayerId(null)}
                className="text-[10px] text-indigo-400 hover:text-white underline font-semibold"
              >
                Clear Target
              </button>
            </div>
          )}

          {/* Current Player's Mystery Concealed Card (Featured Prominently) */}
          {me && (
            <div className="max-w-md mx-auto sm:max-w-none">
              <PlayerCircleCard
                player={me}
                isMe={true}
              />
            </div>
          )}

          {/* Other Players Cards Grid */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="font-display font-bold text-xs sm:text-sm text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Other Minds (Visible Numbers)</span>
              </h2>
              <span className="text-[10px] sm:text-[11px] font-mono text-slate-400">
                Tap card to target
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {otherPlayers.map((player) => (
                <PlayerCircleCard
                  key={player.id}
                  player={player}
                  isMe={false}
                  isTargeted={targetedPlayerId === player.id}
                  onTarget={() => setTargetedPlayerId(player.id === targetedPlayerId ? null : player.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Q&A Interrogation Terminal (5 cols) */}
        <div className={`lg:col-span-5 flex flex-col h-[480px] sm:h-[520px] lg:h-[580px] bg-slate-900/80 border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-5 backdrop-blur-xl shadow-2xl ${mobileTab !== 'chat' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <h2 className="font-display font-bold text-xs sm:text-sm text-white uppercase tracking-wider">
                Interrogation Feed
              </h2>
            </div>
            <span className="text-[9px] sm:text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-800/40">
              Live Real-Time
            </span>
          </div>

          {/* Chat Messages Feed */}
          <QuestionChatFeed
            messages={gameState.messages}
            myPlayerId={myPlayerId}
            onSelectQuestion={setSelectedQuestionId}
            selectedQuestionId={selectedQuestionId}
          />

          {/* Quick Reaction Bar */}
          <div className="pt-2.5 border-t border-white/10">
            <QuickAnswerBar
              onQuickAnswer={handleQuickAnswer}
              disabled={isGuessingPhase}
            />
          </div>

          {/* Question Composer */}
          <div className="pt-2.5">
            <QuestionComposer
              onAsk={onAskQuestion}
              disabled={isGuessingPhase}
            />
          </div>
        </div>
      </div>

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
