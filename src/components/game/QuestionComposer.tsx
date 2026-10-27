// src/components/game/QuestionComposer.tsx
import React, { useState } from 'react';
import { Send, Clock } from 'lucide-react';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  onAsk: (content: string) => Promise<{ success: boolean; error?: string }>;
  disabled?: boolean;
  targetNickname?: string;
}

export const QuestionComposer: React.FC<Props> = ({ onAsk, disabled = false, targetNickname }) => {
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
      setTimeout(() => setCooldown(false), 1500);
    } else {
      setErrorMsg(res.error || 'Failed to submit question');
    }
  };

  const handleTemplateClick = (template: string) => {
    setContent(template);
  };

  const templates = [
    'Is my number higher than 50?',
    'Is my number even?',
    'Is my number between 20 and 40?',
    targetNickname ? `Is my number greater than ${targetNickname}'s?` : 'Is my number greater than yours?'
  ];

  return (
    <div className="w-full space-y-2">
      {/* Quick deduction query templates */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
        <span className="text-[10px] font-mono text-[#8F8B83] shrink-0 mr-1">Templates:</span>
        {templates.map((tpl) => (
          <button
            key={tpl}
            type="button"
            disabled={disabled}
            onClick={() => handleTemplateClick(tpl)}
            className="shrink-0 text-[10px] font-mono px-2 py-1 rounded-lg bg-[#131722] hover:bg-[#1B2130] text-[#D4AF37] border border-[#C5A059]/25 hover:border-[#D4AF37]/50 transition-all truncate max-w-[220px]"
          >
            {tpl}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          maxLength={140}
          disabled={disabled || cooldown}
          placeholder={
            cooldown
              ? 'Transmitting query...'
              : targetNickname
              ? `Ask ${targetNickname} about your concealed number...`
              : 'Ask a deduction question... (e.g. "Is my number higher than 50?")'
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full pl-4 pr-24 py-3 rounded-2xl bg-[#131722] border border-[#C5A059]/30 text-[#F5F2EB] placeholder-[#5A564F] text-sm font-sans focus:outline-none focus:border-[#D4AF37] transition-all disabled:opacity-50"
        />

        <div className="absolute right-2 flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#8F8B83]">
            {140 - content.length}
          </span>
          <button
            type="submit"
            disabled={disabled || cooldown || !content.trim()}
            className="p-2.5 rounded-xl bg-gradient-to-r from-[#9A7B38] via-[#D4AF37] to-[#8C6D34] hover:from-[#B89243] hover:via-[#E5C158] hover:to-[#A7833D] text-black font-bold shadow-md shadow-[#D4AF37]/20 disabled:opacity-40 transition-all border border-[#F3E5AB]/30"
          >
            {cooldown ? <Clock className="w-4 h-4 animate-spin text-black" /> : <Send className="w-4 h-4 text-black" />}
          </button>
        </div>
      </form>

      {errorMsg && (
        <div className="mt-1 text-[11px] font-mono text-rose-400">
          {errorMsg}
        </div>
      )}
    </div>
  );
};
