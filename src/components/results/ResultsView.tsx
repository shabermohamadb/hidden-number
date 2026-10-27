// src/components/results/ResultsView.tsx
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameResults } from '../../types/game';
import { Trophy, Menu, HelpCircle, Target, Award } from 'lucide-react';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  results: GameResults;
  myPlayerId: string;
  isHost: boolean;
  onNextRound: () => void;
  onRematch: () => void;
  onReturnToLobby: () => void;
  onInspectPlayer?: (playerId: string) => void;
}

export const ResultsView: React.FC<Props> = ({
  results,
  myPlayerId,
  isHost,
  onNextRound,
  onRematch,
  onReturnToLobby,
  onInspectPlayer
}) => {
  const { playReveal, playVictory, playClick } = useSoundFX();

  useEffect(() => {
    playReveal();

    const hasExact = results.roundScores.some(s => s.isExact);
    if (results.isMatchOver || hasExact) {
      setTimeout(() => {
        playVictory();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#A8C66C', '#C6A45A', '#F1EBDD']
        });
      }, 400);
    }
  }, [results, playReveal, playVictory]);

  const sortedScores = results.roundScores;
  const isMatchOver = results.isMatchOver;
  const winner = results.matchWinner || sortedScores[0];
  const isWinnerExact = winner?.isExact;

  return (
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col justify-between max-w-5xl mx-auto px-4 sm:px-6 py-6 z-10 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#293130]">
        <h1 className="font-display font-bold text-lg sm:text-xl text-[#F1EBDD] tracking-wide">
          RESULTS
        </h1>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#A8ADA7]">
            ROUND {results.roundNumber} / {results.totalRounds}
          </span>
          <button
            title="Options"
            className="p-1.5 rounded-lg bg-[#101719] border border-[#293130] text-[#A8ADA7]"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Winner Card (Left) vs Standings Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: WINNER Card (4 cols) */}
        {winner && (
          <div className="lg:col-span-4 p-6 rounded-2xl bg-[#101719] border border-[#293130] flex flex-col items-center justify-center text-center space-y-4">
            <span className="text-xs font-mono font-bold tracking-widest text-[#A8C66C] uppercase">
              WINNER
            </span>

            <Trophy className="w-7 h-7 text-[#C6A45A]" />

            {/* Winner Avatar */}
            <div className="w-20 h-20 rounded-full bg-[#151D1D] ring-2 ring-[#C6A45A]/70 flex items-center justify-center font-display font-bold text-2xl text-[#F1EBDD] shadow-lg shadow-black/60">
              {winner.nickname.charAt(0).toUpperCase()}
            </div>

            <div className="space-y-1">
              <span className="font-display font-bold text-lg text-[#F1EBDD] block">
                {winner.nickname}
              </span>
              <div className="font-mono font-bold text-2xl text-[#C6A45A]">
                {winner.roundScore} <span className="text-sm uppercase font-normal text-[#A8ADA7]">POINTS</span>
              </div>
            </div>

            {isWinnerExact && (
              <span className="px-3 py-1 rounded-full bg-[#A8C66C]/15 border border-[#A8C66C]/40 text-[#A8C66C] text-[11px] font-mono font-bold">
                Perfect Guess!
              </span>
            )}
          </div>
        )}

        {/* Right: Standings Table (8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-[#101719] border border-[#293130] flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#293130] text-[10px] text-[#A8ADA7] uppercase tracking-wider">
                  <th className="pb-3 font-semibold">PLAYER</th>
                  <th className="pb-3 text-center font-semibold">ACTUAL NUMBER</th>
                  <th className="pb-3 text-center font-semibold">YOUR GUESS</th>
                  <th className="pb-3 text-center font-semibold">DIFFERENCE</th>
                  <th className="pb-3 text-right font-semibold">POINTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#293130]/40">
                {sortedScores.map((score) => {
                  const isMe = score.playerId === myPlayerId;

                  return (
                    <tr
                      key={score.playerId}
                      onClick={() => onInspectPlayer?.(score.playerId)}
                      className={`hover:bg-[#151D1D]/50 transition-colors cursor-pointer ${
                        isMe ? 'bg-[#151D1D]/80 font-bold' : ''
                      }`}
                    >
                      {/* Player Info */}
                      <td className="py-3.5 pr-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#151D1D] border border-[#293130] flex items-center justify-center font-bold text-xs text-[#F1EBDD]">
                            {score.nickname.charAt(0).toUpperCase()}
                          </div>
                          <span className={`truncate max-w-[110px] sm:max-w-[140px] ${isMe ? 'text-[#A8C66C]' : 'text-[#F1EBDD]'}`}>
                            {score.nickname} {isMe && '(You)'}
                          </span>
                        </div>
                      </td>

                      {/* Actual Number */}
                      <td className="py-3.5 text-center text-[#F1EBDD] font-bold">
                        {score.actualNumber}
                      </td>

                      {/* Your Guess */}
                      <td className="py-3.5 text-center text-[#A8ADA7]">
                        {score.guess !== null ? score.guess : '—'}
                      </td>

                      {/* Difference */}
                      <td className="py-3.5 text-center text-[#A8ADA7]">
                        {score.difference !== null ? score.difference : '—'}
                      </td>

                      {/* Points */}
                      <td className="py-3.5 text-right font-bold text-[#F1EBDD]">
                        {score.roundScore}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-5 mt-4 border-t border-[#293130]">
            <button
              onClick={() => {
                playClick();
                if (isMatchOver) {
                  onRematch();
                } else {
                  onNextRound();
                }
              }}
              className="w-full sm:flex-1 py-3 rounded-xl bg-[#A8C66C] hover:bg-[#B8D47C] text-[#070B0D] font-display font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-98"
            >
              {isMatchOver ? 'PLAY AGAIN' : 'NEXT ROUND'}
            </button>

            <button
              onClick={() => {
                playClick();
                onReturnToLobby();
              }}
              className="w-full sm:flex-1 py-3 rounded-xl bg-[#151D1D] hover:bg-[#1E2728] border border-[#293130] text-[#F1EBDD] font-display font-semibold text-xs uppercase tracking-wider transition-all active:scale-98"
            >
              BACK TO LOBBY
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="pt-6 border-t border-[#293130] flex items-center justify-around text-xs font-mono text-[#A8ADA7]">
        <div className="flex flex-col items-center gap-1 hover:text-[#F1EBDD] cursor-pointer transition-colors">
          <HelpCircle className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-wider">Questions</span>
        </div>
        <div className="flex flex-col items-center gap-1 hover:text-[#F1EBDD] cursor-pointer transition-colors">
          <Target className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-wider">Guess</span>
        </div>
        <div className="flex flex-col items-center gap-1 hover:text-[#F1EBDD] cursor-pointer transition-colors">
          <Trophy className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-wider">Rankings</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-[#A8C66C] cursor-pointer">
          <Award className="w-4 h-4" />
          <span className="text-[10px] uppercase font-bold tracking-wider">Results</span>
        </div>
      </div>
    </div>
  );
};
