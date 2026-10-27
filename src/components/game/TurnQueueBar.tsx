// src/components/game/TurnQueueBar.tsx
import React from 'react';
import { ArrowUp } from 'lucide-react';
import { TurnOrderEntry } from '../../types/game';

interface Props {
  turnOrder: TurnOrderEntry[];
  currentAskerId: string | null;
  myPlayerId: string;
  onInspectPlayer?: (playerId: string) => void;
  remainingSeconds?: number;
  totalDuration?: number;
}

export const TurnQueueBar: React.FC<Props> = ({
  turnOrder,
  currentAskerId,
  myPlayerId,
  onInspectPlayer,
  remainingSeconds = 45,
  totalDuration = 60
}) => {
  if (!turnOrder || turnOrder.length === 0) return null;

  // Circular timer progress calculation
  const safeTotal = Math.max(1, totalDuration);
  const safeRemaining = Math.max(0, remainingSeconds);
  const strokeDashoffset = 100 - (safeRemaining / safeTotal) * 100;

  // Format MM:SS
  const mins = Math.floor(safeRemaining / 60);
  const secs = safeRemaining % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="p-4 rounded-2xl bg-[#101719] border border-[#293130] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      {/* Turn Order Sequence */}
      <div className="flex-1 min-w-0 w-full">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#A8ADA7] block mb-2 font-bold">
          TURN ORDER
        </span>

        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-2 scrollbar-none">
          {turnOrder.map((entry) => {
            const isCurrent = entry.playerId === currentAskerId;
            const isMe = entry.playerId === myPlayerId;

            return (
              <div
                key={entry.playerId}
                onClick={() => onInspectPlayer?.(entry.playerId)}
                className="flex flex-col items-center shrink-0 cursor-pointer group"
                title={`${entry.nickname}${isMe ? ' (You)' : ''}`}
              >
                {/* Circular Avatar */}
                <div
                  className={`relative w-11 h-11 rounded-full flex items-center justify-center font-display font-bold text-sm transition-all ${
                    isCurrent
                      ? 'bg-[#151D1D] ring-2 ring-[#A8C66C] shadow-md shadow-[#A8C66C]/20 text-[#A8C66C]'
                      : 'bg-[#151D1D] border border-[#293130] text-[#A8ADA7] group-hover:border-[#394341]'
                  }`}
                >
                  <span>{entry.nickname.charAt(0).toUpperCase()}</span>

                  {/* Active Indicator Arrow Underneath */}
                  {isCurrent && (
                    <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                      <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#A8C66C]" />
                    </div>
                  )}
                </div>

                {/* Nickname */}
                <span
                  className={`mt-2 font-mono text-[11px] truncate max-w-[70px] text-center ${
                    isCurrent ? 'font-bold text-[#F1EBDD]' : 'text-[#A8ADA7]'
                  }`}
                >
                  {entry.nickname}
                </span>

                {isMe && (
                  <span className="text-[9px] font-mono text-[#A8C66C] leading-none mt-0.5">
                    (You)
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Circular Countdown Timer */}
      <div className="flex items-center gap-3 self-end md:self-center shrink-0 pl-0 md:pl-4 border-t md:border-t-0 md:border-l border-[#293130]/60 pt-3 md:pt-0">
        <div className="flex flex-col items-end text-right">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#A8ADA7]">
            TIME LEFT
          </span>
          <span className="font-mono font-bold text-xl sm:text-2xl text-[#F1EBDD] tracking-tight">
            {timeFormatted}
          </span>
        </div>

        {/* SVG Circular Ring */}
        <div className="relative w-12 h-12 flex items-center justify-center">
          <svg className="w-12 h-12 transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="#293130"
              strokeWidth="3"
              fill="transparent"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="#A8C66C"
              strokeWidth="3"
              strokeDasharray="125.6"
              strokeDashoffset={(125.6 * strokeDashoffset) / 100}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-300"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
