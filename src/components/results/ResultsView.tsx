// src/components/results/ResultsView.tsx
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameResults } from '../../types/game';
import { Trophy, Award, ArrowRight, RotateCcw, Home, Sparkles, Check, X } from 'lucide-react';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  results: GameResults;
  myPlayerId: string;
  isHost: boolean;
  onNextRound: () => void;
  onRematch: () => void;
  onReturnToLobby: () => void;
}

export const ResultsView: React.FC<Props> = ({
  results,
  myPlayerId,
  isHost,
  onNextRound,
  onRematch,
  onReturnToLobby
}) => {
  const { playReveal, playVictory, playClick } = useSoundFX();

  useEffect(() => {
    // Play dramatic reveal sounds
    playReveal();

    // Trigger celebration confetti if match is completed or an exact match was achieved
    const hasExact = results.roundScores.some(s => s.isExact);
    if (results.isMatchOver || hasExact) {
      setTimeout(() => {
        playVictory();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 600);
    }
  }, [results, playReveal, playVictory]);

  const sortedScores = results.roundScores;
  const isMatchOver = results.isMatchOver;
  const winner = results.matchWinner || sortedScores[0];

  return (
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col justify-between max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8 z-10 animate-in fade-in zoom-in-95 duration-300">
      {/* Header Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ROUND {results.roundNumber} OF {results.totalRounds} RESULTS</span>
        </div>

        <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-wide">
          {isMatchOver ? 'ARENA CHAMPION CROWNED' : 'THE REVEAL IS COMPLETE'}
        </h1>

        {isMatchOver && winner && (
          <p className="text-sm font-sans text-amber-300 mt-2 flex items-center justify-center gap-1.5 font-bold">
            <Trophy className="w-4 h-4 text-amber-400" />
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
                  ? 'bg-gradient-to-b from-amber-950/40 via-slate-900 to-[#0B0F19] border-amber-400 shadow-2xl shadow-amber-500/20'
                  : isMe
                  ? 'bg-gradient-to-b from-cyan-950/40 via-slate-900 to-[#0B0F19] border-cyan-400 shadow-xl shadow-cyan-500/10'
                  : 'bg-slate-900/80 border-white/10'
              }`}
            >
              {/* Rank Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                    index === 0
                      ? 'bg-amber-500 text-black'
                      : index === 1
                      ? 'bg-slate-300 text-black'
                      : index === 2
                      ? 'bg-amber-700 text-white'
                      : 'bg-white/10 text-slate-300'
                  }`}>
                    #{index + 1}
                  </div>
                  <span className="font-display font-bold text-sm text-white max-w-[120px] truncate">
                    {score.nickname}
                  </span>
                  {isMe && <span className="text-[9px] font-mono px-1 rounded bg-cyan-500/20 text-cyan-300">YOU</span>}
                </div>

                {score.isExact && (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/40">
                    <Award className="w-3 h-3" /> EXACT MATCH
                  </span>
                )}
              </div>

              {/* Reveal Comparison Box */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-black/40 border border-white/5 text-center mb-4">
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Secret Was</div>
                  <div className="font-display font-black text-3xl text-cyan-300 mt-0.5">
                    {score.secretNumber}
                  </div>
                </div>

                <div className="border-l border-white/10">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Submitted Guess</div>
                  <div className={`font-display font-black text-3xl mt-0.5 ${
                    score.submittedGuess === null
                      ? 'text-slate-600'
                      : score.isExact
                      ? 'text-emerald-400'
                      : 'text-white'
                  }`}>
                    {score.submittedGuess ?? '--'}
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Difference:</span>
                  <span className="text-white font-bold">
                    {score.difference !== null ? `±${score.difference}` : 'No Guess'}
                  </span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Accuracy:</span>
                  <span className="text-cyan-300 font-bold">{score.accuracy}%</span>
                </div>

                <div className="flex justify-between text-slate-400 pt-1.5 border-t border-white/10">
                  <span>Round Points:</span>
                  <span className="text-emerald-400 font-bold">+{score.roundPoints} pts</span>
                </div>

                {score.isFirstExact && (
                  <div className="text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Includes +10 First Exact Bonus!
                  </div>
                )}

                <div className="flex justify-between text-slate-300 pt-1 border-t border-white/10 font-bold">
                  <span>Total Match Score:</span>
                  <span className="text-white">{score.cumulativeScore} pts</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Host / Player Control Actions */}
      <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
        <div className="text-xs font-mono text-slate-400">
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
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 transition-all"
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
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-display font-bold text-sm shadow-xl shadow-amber-500/25 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>START REMATCH</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    playClick();
                    onNextRound();
                  }}
                  className="flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-display font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all"
                >
                  <span>NEXT ROUND ({results.roundNumber + 1}/{results.totalRounds})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

