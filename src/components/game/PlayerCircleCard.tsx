// src/components/game/PlayerCircleCard.tsx
import React from 'react';
import { Player } from '../../types/game';
import { Shield, Eye, HelpCircle, Check, Crown } from 'lucide-react';

interface Props {
  player: Player;
  isMe: boolean;
  onTarget?: () => void;
  isTargeted?: boolean;
}

export const PlayerCircleCard: React.FC<Props> = ({ player, isMe, onTarget, isTargeted }) => {
  return (
    <div
      onClick={!isMe ? onTarget : undefined}
      className={`relative p-4 sm:p-5 rounded-3xl border transition-all ${
        isMe
          ? 'bg-gradient-to-b from-cyan-950/40 via-slate-900/80 to-[#0B0F19] border-cyan-400/60 shadow-2xl shadow-cyan-500/20 ring-1 ring-cyan-400/40'
          : isTargeted
          ? 'bg-indigo-950/40 border-indigo-400 shadow-xl shadow-indigo-500/20 scale-105 cursor-pointer'
          : 'bg-slate-900/70 border-white/10 hover:border-white/20 hover:scale-[1.02] cursor-pointer'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
            {player.nickname.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-xs sm:text-sm text-white max-w-[100px] truncate">
                {player.nickname}
              </span>
              {player.isHost && <Crown className="w-3 h-3 text-amber-400" />}
            </div>
            {isMe && (
              <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-wider">
                (YOU)
              </span>
            )}
          </div>
        </div>

        {/* Guess Status Badge */}
        {player.hasGuessed ? (
          <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
            <Check className="w-3 h-3" />
            <span>GUESSED</span>
          </div>
        ) : (
          <div className="text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
            THINKING
          </div>
        )}
      </div>

      {/* Central Number Display Box */}
      <div className="relative py-4 flex flex-col items-center justify-center">
        {isMe ? (
          /* THE CONCEALED MYSTERY CARD (NEVER REVEALED TO ITS OWNER!) */
          <div className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-2xl bg-[#070A12] border-2 border-dashed border-cyan-500/50 flex flex-col items-center justify-center overflow-hidden shadow-inner group">
            {/* Shimmer sweep */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-400/10 to-transparent animate-pulse" />

            <div className="relative text-cyan-400 font-display font-black text-5xl sm:text-6xl animate-bounce">
              ?
            </div>

            <div className="relative mt-1 text-[9px] font-mono text-cyan-300 uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/40">
              CONCEALED
            </div>
          </div>
        ) : (
          /* OTHER PLAYERS: CLEARLY VISIBLE NUMBER */
          <div className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-white/20 flex flex-col items-center justify-center shadow-xl shadow-cyan-500/5 hover:border-cyan-400/60 transition-all">
            <div className="text-white font-display font-black text-5xl sm:text-6xl tracking-tight">
              {player.secretNumber !== null ? player.secretNumber : '--'}
            </div>
            <div className="mt-1 text-[9px] font-mono text-slate-400 uppercase tracking-wider">
              ASSIGNED
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Score:</span>
        <span className="text-white font-bold">{player.cumulativeScore} pts</span>
      </div>
    </div>
  );
};

