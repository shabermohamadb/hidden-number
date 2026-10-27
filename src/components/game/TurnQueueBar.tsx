// src/components/game/TurnQueueBar.tsx
import React from 'react';
import { Users, Clock, Crown, ArrowRight, Radio } from 'lucide-react';
import { TurnOrderEntry } from '../../types/game';

interface Props {
  turnOrder: TurnOrderEntry[];
  currentAskerId: string | null;
  myPlayerId: string;
  onInspectPlayer?: (playerId: string) => void;
}

export const TurnQueueBar: React.FC<Props> = ({
  turnOrder,
  currentAskerId,
  myPlayerId,
  onInspectPlayer
}) => {
  if (!turnOrder || turnOrder.length === 0) return null;

  return (
    <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-[#0D1017] border border-[#C5A059]/25 shadow-lg">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#C5A059]/15">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse" />
          <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#FAF8F5]">
            Interrogation Turn Queue
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#8F8B83]">
          Rotating Question Order
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
        {turnOrder.map((entry, idx) => {
          const isCurrent = entry.playerId === currentAskerId;
          const isMe = entry.playerId === myPlayerId;

          return (
            <React.Fragment key={entry.playerId}>
              <div
                onClick={() => onInspectPlayer?.(entry.playerId)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'bg-[#181E2C] border-[#D4AF37] shadow-md shadow-[#D4AF37]/20 ring-1 ring-[#D4AF37]/50'
                    : 'bg-[#131722] border-white/5 hover:border-white/20 opacity-75'
                }`}
                title="Click to view dossier"
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-display font-black text-xs shrink-0 ${
                    isCurrent
                      ? 'bg-gradient-to-tr from-[#8C6D34] to-[#D4AF37] text-black'
                      : 'bg-[#1E2538] text-[#FAF8F5]'
                  }`}
                >
                  {entry.nickname.charAt(0).toUpperCase()}
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-display font-bold text-xs max-w-[100px] truncate ${
                      isCurrent ? 'text-[#FAF8F5]' : 'text-[#A7A29A]'
                    }`}
                  >
                    {entry.nickname}
                  </span>
                  {isMe && (
                    <span className="text-[9px] font-mono px-1 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                      YOU
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[#D4AF37] text-black font-extrabold uppercase">
                      Turn
                    </span>
                  )}
                </div>
              </div>

              {idx < turnOrder.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-[#5C564B] shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
