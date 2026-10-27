// src/components/results/ResultsView.tsx
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameResults } from '../../types/game';
import { Trophy, Award, ArrowRight, RotateCcw, Home, Sparkles } from 'lucide-react';
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
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#F3E5AB', '#C5A059', '#FFFFFF']
        });
      }, 500);
    }
  }, [results, playReveal, playVictory]);

  const sortedScores = results.roundScores;
  const isMatchOver = results.isMatchOver;
  const winner = results.matchWinner || sortedScores[0];

  return (
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col justify-between max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8 z-10 animate-in fade-in zoom-in-95 duration-300">
      {/* Header Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#131722] border border-[#C5A059]/40 text-[#D4AF37] text-xs font-mono font-medium mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ROUND {results.roundNumber} OF {results.totalRounds} RESULTS</span>
        </div>

        <h1 className="font-display font-black text-3xl sm:text-5xl text-[#FAF8F5] tracking-wide">
          {isMatchOver ? 'ARENA CHAMPION CROWNED' : 'THE REVEAL IS COMPLETE'}
        </h1>

        {isMatchOver && winner && (
          <p className="text-sm font-sans text-[#D4AF37] mt-2 flex items-center justify-center gap-1.5 font-bold">
            <Trophy className="w-4 h-4 text-[#D4AF37]" />
            <span>Winner: {winner.nickname} with {winner.cumulativeScore} total points!</span>
          </p>
        )}
      </div>

      {/* Cinematic Reveal Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {sortedScores.map((score, index) => {
          const isMe = score.playerId === myPlayerId;
          return (
            <div
              key={score.playerId}
              className={`relative p-5 rounded-3xl border transition-all ${
                score.isExact
                  ? 'bg-[#181E2C] border-[#D4AF37] shadow-2xl shadow-[#D4AF37]/20 ring-1 ring-[#D4AF37]/50'
                  : isMe
                  ? 'bg-[#131722] border-[#D4AF37]/60 shadow-xl shadow-[#D4AF37]/10'
                  : 'bg-[#0D1017] border-[#C5A059]/20'
              }`}
            >
              {/* Rank Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-black text-xs ${
                    index === 0
                      ? 'bg-[#D4AF37] text-black shadow-md'
                      : index === 1
                      ? 'bg-[#C5A059] text-black'
                      : index === 2
                      ? 'bg-[#8C6D34] text-white'
                      : 'bg-[#181E2C] text-[#8F8B83] border border-[#C5A059]/20'
                  }`}>
                    #{index + 1}
                  </div>
                  <span
                    onClick={() => onInspectPlayer?.(score.playerId)}
                    className="font-display font-bold text-sm text-[#FAF8F5] max-w-[120px] truncate cursor-pointer hover:text-[#D4AF37] transition-colors"
                    title="Click to view player dossier"
                  >
                    {score.nickname}
                  </span>
                  {isMe && <span className="text-[9px] font-mono px-1 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">YOU</span>}
                </div>

                {score.isExact && (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#D4AF37] bg-[#181E2C] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/50">
                    <Award className="w-3 h-3" /> EXACT MATCH
                  </span>
                )}
              </div>

              {/* Reveal Comparison Box */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-[#07080B] border border-[#C5A059]/20 text-center mb-4">
                <div>
                  <div className="text-[10px] font-mono text-[#8F8B83] uppercase">Secret Number</div>
                  <div className="font-display font-black text-3xl text-[#D4AF37] mt-0.5">
                    {score.secretNumber}
                  </div>
                </div>

                <div className="border-l border-[#C5A059]/15">
                  <div className="text-[10px] font-mono text-[#8F8B83] uppercase">Submitted Guess</div>
                  <div className={`font-display font-black text-3xl mt-0.5 ${
                    score.submittedGuess === null
                      ? 'text-[#5A564F]'
                      : score.isExact
                      ? 'text-emerald-400'
                      : 'text-[#FAF8F5]'
                  }`}>
                    {score.submittedGuess ?? '--'}
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-[#8F8B83]">
                  <span>Difference:</span>
                  <span className="text-[#FAF8F5] font-bold">
                    {score.difference !== null ? `±${score.difference}` : 'No Guess'}
                  </span>
                </div>

                <div className="flex justify-between text-[#8F8B83]">
                  <span>Accuracy:</span>
                  <span className="text-[#D4AF37] font-bold">{score.accuracy}%</span>
                </div>

                <div className="flex justify-between text-[#8F8B83] pt-1.5 border-t border-[#C5A059]/15">
                  <span>Round Points:</span>
                  <span className="text-emerald-400 font-bold">+{score.roundPoints} pts</span>
                </div>

                {score.isFirstExact && (
                  <div className="text-[10px] text-[#D4AF37] font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Includes +10 First Exact Bonus!
                  </div>
                )}

                <div className="flex justify-between text-[#FAF8F5] pt-1 border-t border-[#C5A059]/15 font-bold">
                  <span>Total Match Score:</span>
                  <span className="text-[#D4AF37]">{score.cumulativeScore} pts</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Host / Player Control Actions */}
      <div className="bg-[#0D1017]/95 border border-[#C5A059]/30 rounded-3xl p-5 sm:p-6 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
        <div className="text-xs font-mono text-[#8F8B83]">
          {isHost
            ? isMatchOver
              ? 'Match is complete! Host may initiate a rematch or return to lobby.'
              : `Round ${results.roundNumber} complete. Host can proceed to round ${results.roundNumber + 1}.`
            : 'Waiting for host to proceed to next round...'}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isHost && (
            <>
              <button
                onClick={() => {
                  playClick();
                  onReturnToLobby();
                }}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#131722] hover:bg-[#1B2130] border border-[#C5A059]/30 text-xs font-mono text-[#A7A29A] hover:text-[#FAF8F5] transition-all"
              >
                <Home className="w-4 h-4" />
                <span>Return to Lobby</span>
              </button>

              {isMatchOver ? (
                <button
                  onClick={() => {
                    playClick();
                    onRematch();
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#9A7B38] via-[#D4AF37] to-[#8C6D34] hover:from-[#B89243] hover:via-[#E5C158] hover:to-[#A7833D] text-black font-display font-black text-sm shadow-xl shadow-[#D4AF37]/25 border border-[#F3E5AB]/40 transition-all"
                >
                  <RotateCcw className="w-4 h-4 text-black" />
                  <span>START REMATCH</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    playClick();
                    onNextRound();
                  }}
                  className="flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-[#9A7B38] via-[#D4AF37] to-[#8C6D34] hover:from-[#B89243] hover:via-[#E5C158] hover:to-[#A7833D] text-black font-display font-black text-sm shadow-xl shadow-[#D4AF37]/25 border border-[#F3E5AB]/40 transition-all"
                >
                  <span>NEXT ROUND ({results.roundNumber + 1}/{results.totalRounds})</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
