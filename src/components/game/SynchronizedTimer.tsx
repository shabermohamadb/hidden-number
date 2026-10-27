// src/components/game/SynchronizedTimer.tsx
import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  deadline: number | null;
  totalDuration: number; // e.g. 60 or 15
  phaseName: string;
}

export const SynchronizedTimer: React.FC<Props> = ({ deadline, totalDuration, phaseName }) => {
  const { playTick, playHeartbeat } = useSoundFX();
  const [remaining, setRemaining] = useState<number>(totalDuration);

  useEffect(() => {
    if (!deadline) {
      setRemaining(totalDuration);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diffMs = deadline - now;
      const sec = Math.max(0, Math.ceil(diffMs / 1000));
      setRemaining(sec);

      // Play tick audio on every whole second
      if (sec <= 10 && sec > 0) {
        playTick(true);
        if (sec <= 5) {
          playHeartbeat();
        }
      } else if (sec > 10 && sec % 10 === 0) {
        playTick(false);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [deadline, totalDuration, playTick, playHeartbeat]);

  const isUrgent = remaining <= 10;
  const progressPercent = Math.max(0, Math.min(100, (remaining / totalDuration) * 100));

  return (
    <div className="flex items-center gap-3 bg-slate-900/90 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-md shadow-xl">
      <div className="relative w-8 h-8 flex items-center justify-center">
        {/* SVG Circular Progress Bar */}
        <svg className="w-8 h-8 transform -rotate-90">
          <circle
            cx="16"
            cy="16"
            r="13"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-white/10"
            fill="transparent"
          />
          <circle
            cx="16"
            cy="16"
            r="13"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray={81.68}
            strokeDashoffset={81.68 - (81.68 * progressPercent) / 100}
            strokeLinecap="round"
            className={`transition-all duration-300 ${isUrgent ? 'text-amber-400' : 'text-cyan-400'}`}
            fill="transparent"
          />
        </svg>

        <Clock className={`w-3.5 h-3.5 absolute ${isUrgent ? 'text-amber-400 animate-pulse' : 'text-cyan-400'}`} />
      </div>

      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
          {phaseName}
        </div>
        <div className={`font-mono font-black text-lg leading-tight ${isUrgent ? 'text-amber-400 animate-pulse' : 'text-white'}`}>
          0:{remaining.toString().padStart(2, '0')}
        </div>
      </div>
    </div>
  );
};

