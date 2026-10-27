// src/components/game/QuestionComposer.tsx
import React, { useState } from 'react';
import { Send, Clock } from 'lucide-react';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  onAsk: (content: string) => Promise<{ success: boolean; error?: string }>;
  disabled?: boolean;
}

export const QuestionComposer: React.FC<Props> = ({ onAsk, disabled = false }) => {
  const { playClick, playDing } = useSoundFX();
  const [content, setContent] = useState('');
  const [cooldown, setCooldown] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || disabled || cooldown) return;

    playClick();
    const res = await onAsk(content.trim());
    if (res.success) {
      setContent('');
      setErrorMsg(null);
      playDing();
      setCooldown(true);
      setTimeout(() => setCooldown(false), 2000);
    } else {
      setErrorMsg(res.error || 'Failed to submit question');
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          maxLength={140}
          disabled={disabled || cooldown}
          placeholder={cooldown ? 'Rate limited... (cooling down)' : 'Ask a deduction question... (e.g. "Is my number higher than 50?")'}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full pl-4 pr-24 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm font-sans focus:outline-none focus:border-cyan-400/80 transition-all disabled:opacity-50"
        />

        <div className="absolute right-2 flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-500">
            {140 - content.length}
          </span>
          <button
            type="submit"
            disabled={disabled || cooldown || !content.trim()}
            className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-md shadow-cyan-500/20 disabled:opacity-40 transition-all"
          >
            {cooldown ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>

      {errorMsg && (
        <div className="mt-1.5 text-[11px] font-mono text-rose-400">
          {errorMsg}
        </div>
      )}
    </div>
  );
};

