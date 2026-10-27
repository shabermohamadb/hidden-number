// src/components/profile/AvatarPickerModal.tsx
import React, { useState, useRef } from 'react';
import { X, Check, Upload, Sparkles } from 'lucide-react';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string;
  currentCustomAvatar: string | null;
  currentFrame?: string;
  currentTitle?: string;
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
  { id: 'avatar-1', label: 'Alpha', icon: '◈' },
  { id: 'avatar-2', label: 'Nova', icon: '❖' },
  { id: 'avatar-3', label: 'Quantum', icon: '◆' },
  { id: 'avatar-4', label: 'Echo', icon: '◇' },
  { id: 'avatar-5', label: 'Cipher', icon: '▲' },
  { id: 'avatar-6', label: 'Pulse', icon: '◉' },
  { id: 'avatar-7', label: 'Helix', icon: '❂' },
  { id: 'avatar-8', label: 'Matrix', icon: '✦' }
];

export const AvatarPickerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentAvatar,
  currentCustomAvatar,
  currentFrame = 'frame-bronze',
  currentTitle = 'The Silent Deducer',
  onApply
}) => {
  const { playClick } = useSoundFX();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
  const [selectedCustomAvatar, setSelectedCustomAvatar] = useState<string | null>(currentCustomAvatar);
  const [selectedFrame, setSelectedFrame] = useState(currentFrame);
  const [selectedTitle, setSelectedTitle] = useState(currentTitle);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('Only PNG, JPG, or WEBP allowed');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image size must be under 2MB');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedCustomAvatar(result);
      playClick();
    };
    reader.readAsDataURL(file);
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
      <div className="w-full max-w-md bg-[#101719] border border-[#293130] rounded-3xl p-6 flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#293130]">
          <h3 className="font-display font-bold text-lg text-[#F1EBDD]">
            AVATAR & CUSTOMIZATION
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#151D1D] hover:bg-[#1E2728] text-[#A8ADA7] hover:text-[#F1EBDD]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1 text-xs font-mono">
          {/* Custom Avatar Upload */}
          <div className="space-y-2">
            <span className="text-[#A8ADA7] uppercase text-[10px] tracking-wider block">
              Upload Custom Avatar
            </span>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-xl bg-[#151D1D] hover:bg-[#1E2728] border border-[#293130] text-[#F1EBDD] flex items-center justify-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4 text-[#A8C66C]" />
              <span>{selectedCustomAvatar ? 'Replace Image' : 'Select Image File (Max 2MB)'}</span>
            </button>
            {uploadError && <p className="text-[#E05D52] text-[11px]">{uploadError}</p>}
          </div>

          {/* Built-in Avatars Grid */}
          <div className="space-y-2">
            <span className="text-[#A8ADA7] uppercase text-[10px] tracking-wider block">
              Or Choose Built-in Avatar
            </span>
            <div className="grid grid-cols-4 gap-2.5">
              {BUILTIN_AVATARS.map((av) => {
                const isSelected = !selectedCustomAvatar && selectedAvatar === av.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => {
                      playClick();
                      setSelectedAvatar(av.id);
                      setSelectedCustomAvatar(null);
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-[#151D1D] border-[#A8C66C] text-[#A8C66C]'
                        : 'bg-[#101719] border-[#293130] text-[#A8ADA7] hover:bg-[#151D1D]'
                    }`}
                  >
                    <span className="text-xl">{av.icon}</span>
                    <span className="text-[10px] font-mono">{av.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#293130] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#151D1D] hover:bg-[#1E2728] border border-[#293130] text-[#A8ADA7] text-xs font-mono"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl bg-[#A8C66C] hover:bg-[#B8D47C] text-[#070B0D] font-display font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-98"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
