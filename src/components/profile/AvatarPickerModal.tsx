// src/components/profile/AvatarPickerModal.tsx
import React, { useState, useRef } from 'react';
import { X, Check, Upload, Sparkles, Shield, User } from 'lucide-react';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string;
  currentCustomAvatar: string | null;
  currentFrame: string;
  currentTitle: string;
  unlockedFrames?: string[];
  unlockedTitles?: string[];
  onApply: (selected: {
    avatar: string;
    customAvatar: string | null;
    frame: string;
    title: string;
  }) => void;
}

const BUILTIN_AVATARS = [
  { id: 'avatar-1', label: 'Mind Core Alpha', icon: '◈' },
  { id: 'avatar-2', label: 'Prism Nova', icon: '❖' },
  { id: 'avatar-3', label: 'Quantum Node', icon: '◆' },
  { id: 'avatar-4', label: 'Echo Sentinel', icon: '◇' },
  { id: 'avatar-5', label: 'Cipher Oracle', icon: '▲' },
  { id: 'avatar-6', label: 'Solar Pulse', icon: '◉' },
  { id: 'avatar-7', label: 'Obsidian Helix', icon: '❂' },
  { id: 'avatar-8', label: 'Celestial Matrix', icon: '✦' }
];

const FRAMES = [
  { id: 'frame-bronze', name: 'Muted Bronze', borderClass: 'border-[#C5A059]/40', glowClass: 'shadow-[#C5A059]/10' },
  { id: 'frame-stone', name: 'Charcoal Stone', borderClass: 'border-white/20', glowClass: 'shadow-white/5' },
  { id: 'frame-obsidian-ring', name: 'Obsidian Ring', borderClass: 'border-[#1E2538] ring-2 ring-[#D4AF37]/50', glowClass: 'shadow-[#D4AF37]/20' },
  { id: 'frame-gilded-laurel', name: 'Gilded Laurel', borderClass: 'border-[#D4AF37] ring-2 ring-[#F3E5AB]/60', glowClass: 'shadow-[#D4AF37]/35' },
  { id: 'frame-celestial-sol', name: 'Celestial Sol', borderClass: 'border-[#E5A83B] ring-2 ring-[#F5D061]', glowClass: 'shadow-[#E5A83B]/40 animate-pulse' }
];

export const AvatarPickerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentAvatar,
  currentCustomAvatar,
  currentFrame,
  currentTitle,
  unlockedFrames = ['frame-bronze', 'frame-stone'],
  unlockedTitles = ['Deduction Novice', 'Number Seeker'],
  onApply
}) => {
  const { playClick } = useSoundFX();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
  const [selectedCustomAvatar, setSelectedCustomAvatar] = useState<string | null>(currentCustomAvatar);
  const [selectedFrame, setSelectedFrame] = useState(currentFrame || 'frame-bronze');
  const [selectedTitle, setSelectedTitle] = useState(currentTitle || 'Deduction Novice');
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Type validation
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Only PNG, JPG, WebP, or GIF images are accepted.');
      return;
    }

    // Size validation: 2MB max
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedCustomAvatar(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomAvatar = () => {
    setSelectedCustomAvatar(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirm = () => {
    playClick();
    onApply({
      avatar: selectedAvatar,
      customAvatar: selectedCustomAvatar,
      frame: selectedFrame,
      title: selectedTitle
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#0D1017] border border-[#D4AF37]/35 rounded-3xl p-6 sm:p-8 flex flex-col max-h-[90vh] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#D4AF37]/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1A1F2C] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-[#FAF8F5]">CUSTOMIZE IDENTITY</h2>
              <p className="text-xs text-[#A7A29A]">Mind Core Avatars, Frames & Honorary Titles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#131722] hover:bg-[#1A1F2C] text-[#A7A29A] hover:text-[#FAF8F5] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto py-5 space-y-6 pr-1">
          {/* Live Preview */}
          <div className="p-4 rounded-2xl bg-[#07080B] border border-[#D4AF37]/20 flex items-center justify-center gap-4">
            <div className="relative">
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden bg-[#131722] border-2 shadow-lg transition-all ${
                  FRAMES.find(f => f.id === selectedFrame)?.borderClass || 'border-[#C5A059]/40'
                } ${FRAMES.find(f => f.id === selectedFrame)?.glowClass || ''}`}
              >
                {selectedCustomAvatar ? (
                  <img src={selectedCustomAvatar} alt="Custom Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl text-[#D4AF37]">
                    {BUILTIN_AVATARS.find(a => a.id === selectedAvatar)?.icon || '◈'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-mono uppercase tracking-wider text-[#D4AF37] font-bold">
                {selectedTitle}
              </span>
              <span className="text-sm font-display font-bold text-[#FAF8F5]">Live Identity Preview</span>
              <span className="text-xs text-[#7A756D]">
                Frame: {FRAMES.find(f => f.id === selectedFrame)?.name}
              </span>
            </div>
          </div>

          {/* Custom Avatar Upload */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#A7A29A] mb-2">
              Custom Avatar Upload (Max 2MB)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-[#131722] hover:bg-[#1A1F2C] border border-[#D4AF37]/30 text-xs font-mono text-[#FAF8F5] flex items-center gap-2 transition-all"
              >
                <Upload className="w-4 h-4 text-[#D4AF37]" />
                <span>Upload Image File</span>
              </button>
              {selectedCustomAvatar && (
                <button
                  type="button"
                  onClick={handleRemoveCustomAvatar}
                  className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-500/30 text-xs font-mono text-rose-300 transition-all"
                >
                  Remove Custom
                </button>
              )}
            </div>
            {uploadError && (
              <p className="mt-2 text-xs text-rose-400 font-mono">{uploadError}</p>
            )}
          </div>

          {/* Mind Core Preset Avatars */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#A7A29A] mb-2">
              Or Choose Built-in Mind Core Avatar
            </label>
            <div className="grid grid-cols-4 gap-3">
              {BUILTIN_AVATARS.map((av) => {
                const isSelected = !selectedCustomAvatar && selectedAvatar === av.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => {
                      playClick();
                      setSelectedCustomAvatar(null);
                      setSelectedAvatar(av.id);
                    }}
                    className={`relative p-3 rounded-2xl flex flex-col items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-[#1A1F2C] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/15 ring-2 ring-[#D4AF37]/40'
                        : 'bg-[#131722] border-[#2A2E3D]/50 hover:border-[#D4AF37]/40 text-[#A7A29A]'
                    }`}
                  >
                    <span className="text-2xl mb-1 text-[#D4AF37]">{av.icon}</span>
                    <span className="text-[10px] font-mono truncate w-full text-center text-[#FAF8F5]">
                      {av.label.split(' ')[0]}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#D4AF37] flex items-center justify-center text-black">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Avatar Frames */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#A7A29A] mb-2 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Avatar Frame</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {FRAMES.map((f) => {
                const isUnlocked = unlockedFrames.includes(f.id);
                const isSelected = selectedFrame === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    disabled={!isUnlocked}
                    onClick={() => {
                      if (isUnlocked) {
                        playClick();
                        setSelectedFrame(f.id);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      !isUnlocked
                        ? 'opacity-40 bg-[#07080B] border-white/5 cursor-not-allowed'
                        : isSelected
                        ? 'bg-[#1A1F2C] border-[#D4AF37] ring-1 ring-[#D4AF37]/40'
                        : 'bg-[#131722] border-white/10 hover:border-[#D4AF37]/40'
                    }`}
                  >
                    <div className="text-xs font-semibold text-[#FAF8F5] mb-1">{f.name}</div>
                    <div className="text-[10px] font-mono text-[#A7A29A]">
                      {isUnlocked ? (isSelected ? 'Selected' : 'Unlocked') : 'Locked (Achievement)'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Titles */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#A7A29A] mb-2 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Honorary Title</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {unlockedTitles.map((t) => {
                const isSelected = selectedTitle === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      playClick();
                      setSelectedTitle(t);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#1A1F2C] border-[#D4AF37] ring-1 ring-[#D4AF37]/40 text-[#FAF8F5]'
                        : 'bg-[#131722] border-white/10 hover:border-[#D4AF37]/40 text-[#A7A29A]'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono text-[#D4AF37]">{t}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#D4AF37]/20 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#131722] hover:bg-[#1A1F2C] text-xs font-mono text-[#A7A29A] transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#9A7B38] via-[#D4AF37] to-[#8C6D34] text-black font-extrabold text-xs font-mono tracking-wider shadow-lg shadow-[#D4AF37]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};
