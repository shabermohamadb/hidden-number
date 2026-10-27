// src/components/game/PlayerCircleCard.tsx
import React from 'react';
import { Player } from '../../types/game';
import { Check, Crown, ArrowRight, Crosshair } from 'lucide-react';

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
      className={`relative p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all ${
        isMe
          ? 'bg-[#181E2C] border-[#D4AF37] shadow-xl shadow-[#D4AF37]/10 ring-1 ring-[#D4AF37]/40'
          : isTargeted
          ? 'bg-[#181E2C] border-[#D4AF37] shadow-xl shadow-[#D4AF37]/20 scale-[1.02] cursor-pointer'
          : 'bg-[#0D1017] border-[#C5A059]/25 hover:border-[#D4AF37]/60 hover:scale-[1.01] cursor-pointer'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8C6D34] to-[#D4AF37] flex items-center justify-center text-xs font-bold text-black shadow-md shrink-0">
            {player.nickname.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-xs sm:text-sm text-[#FAF8F5] max-w-[110px] truncate">
                {player.nickname}
              </span>
              {player.isHost && <Crown className="w-3 h-3 text-[#D4AF37]" />}
            </div>
            {isMe && (
              <span className="text-[10px] font-mono text-[#D4AF37] font-bold tracking-wider">
                (YOU)
              </span>
            )}
          </div>
        </div>

        {/* Guess Status Badge */}
        {player.hasGuessed ? (
          <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
            <Check className="w-3 h-3" />
            <span>GUESSED</span>
          </div>
        ) : (
          <div className="text-[10px] font-mono text-[#8F8B83] bg-[#131722] px-2 py-0.5 rounded-full border border-[#C5A059]/20">
            THINKING
          </div>
        )}
      </div>

      {/* Central Number Display Box */}
      <div className="relative py-3 flex flex-col items-center justify-center">
        {isMe ? (
          /* THE CONCEALED MYSTERY CARD (NEVER REVEALED TO ITS OWNER!) */
          <div className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-2xl bg-[#07080B] border-2 border-dashed border-[#D4AF37]/50 flex flex-col items-center justify-center overflow-hidden shadow-inner group">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#D4AF37]/10 to-transparent animate-pulse" />

            <div className="relative text-[#D4AF37] font-display font-black text-5xl sm:text-6xl animate-bounce">
              ?
            </div>

            <div className="relative mt-1 text-[9px] font-mono text-[#F3E5AB] uppercase tracking-widest px-2 py-0.5 rounded bg-[#131722] border border-[#C5A059]/30">
              CONCEALED
            </div>
          </div>
        ) : (
          /* OTHER PLAYERS: CLEARLY VISIBLE NUMBER */
          <div className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-2xl bg-[#131722] border-2 border-[#C5A059]/30 flex flex-col items-center justify-center shadow-lg hover:border-[#D4AF37] transition-all">
            <div className="text-[#FAF8F5] font-display font-black text-5xl sm:text-6xl tracking-tight">
              {player.secretNumber !== null ? player.secretNumber : '--'}
            </div>
            <div className="mt-1 text-[9px] font-mono text-[#D4AF37] uppercase tracking-wider font-semibold">
              VISIBLE TO YOU
            </div>
          </div>
        )}
      </div>

      {/* Footer Info & Target Action */}
      <div className="pt-2 border-t border-[#C5A059]/15 flex items-center justify-between text-[11px] font-mono">
        <div className="text-[#8F8B83]">
          Score: <span className="text-[#FAF8F5] font-bold">{player.cumulativeScore} pts</span>
        </div>

        {!isMe && (
          <div className="flex items-center gap-1 text-[11px] text-[#D4AF37] font-semibold group-hover:text-[#F3E5AB]">
            <Crosshair className="w-3.5 h-3.5" />
            <span>{isTargeted ? 'Targeted' : 'Interrogate'}</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        )}
      </div>
    </div>
  );
};
