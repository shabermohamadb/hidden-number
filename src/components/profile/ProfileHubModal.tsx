// src/components/profile/ProfileHubModal.tsx
import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  BarChart3,
  Award,
  History,
  Users,
  Settings,
  Shield,
  Sparkles,
  Copy,
  Check,
  Save,
  Trash2,
  Send,
  UserPlus,
  Volume2,
  Eye,
  CheckCircle,
  Clock,
  Search,
  ExternalLink
} from 'lucide-react';
import { UserProfile, FriendSummary, FriendRequest, PublicUserProfile } from '../../types/game';
import { AvatarPickerModal } from './AvatarPickerModal';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  friends: FriendSummary[];
  friendRequests: { incoming: FriendRequest[]; outgoing: FriendRequest[] };
  currentRoomCode?: string | null;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; profile?: UserProfile; error?: string }>;
  onSearchPlayers: (query: string) => Promise<FriendSummary[]>;
  onSendFriendRequest: (targetPlayerId: string) => Promise<{ success: boolean; error?: string; status?: string }>;
  onRespondFriendRequest: (senderPlayerId: string, accept: boolean) => Promise<{ success: boolean; error?: string }>;
  onRemoveFriend: (friendPlayerId: string) => Promise<{ success: boolean; error?: string }>;
  onInviteToRoom: (friendPlayerId: string) => Promise<{ success: boolean; error?: string }>;
  onInspectPlayer: (playerId: string) => void;
  onDeleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

const BUILTIN_AVATAR_ICONS: Record<string, string> = {
  'avatar-1': '◈',
  'avatar-2': '❖',
  'avatar-3': '◆',
  'avatar-4': '◇',
  'avatar-5': '▲',
  'avatar-6': '◉',
  'avatar-7': '❂',
  'avatar-8': '✦'
};

const FRAME_CLASSES: Record<string, string> = {
  'frame-bronze': 'border-[#C5A059]/40 shadow-[#C5A059]/10',
  'frame-stone': 'border-white/20 shadow-white/5',
  'frame-obsidian-ring': 'border-[#1E2538] ring-2 ring-[#D4AF37]/50 shadow-[#D4AF37]/20',
  'frame-gilded-laurel': 'border-[#D4AF37] ring-2 ring-[#F3E5AB]/60 shadow-[#D4AF37]/35',
  'frame-celestial-sol': 'border-[#E5A83B] ring-2 ring-[#F5D061] shadow-[#E5A83B]/40 animate-pulse'
};

const TIER_COLORS: Record<string, { badge: string; text: string }> = {
  bronze: { badge: 'bg-[#C5A059]/20 border-[#C5A059]/40', text: 'text-[#C5A059]' },
  silver: { badge: 'bg-slate-500/20 border-slate-400/40', text: 'text-slate-300' },
  gold: { badge: 'bg-[#D4AF37]/25 border-[#D4AF37]/60', text: 'text-[#D4AF37]' },
  obsidian: { badge: 'bg-purple-950/40 border-purple-500/50', text: 'text-purple-300' }
};

export const ProfileHubModal: React.FC<Props> = ({
  isOpen,
  onClose,
  profile,
  friends,
  friendRequests,
  currentRoomCode,
  onUpdateProfile,
  onSearchPlayers,
  onSendFriendRequest,
  onRespondFriendRequest,
  onRemoveFriend,
  onInviteToRoom,
  onInspectPlayer,
  onDeleteAccount
}) => {
  const { playClick } = useSoundFX();
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'achievements' | 'history' | 'friends' | 'settings'>('profile');

  // Profile Form States
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatar, setAvatar] = useState(profile?.avatar || 'avatar-1');
  const [customAvatar, setCustomAvatar] = useState<string | null>(profile?.customAvatar || null);
  const [frame, setFrame] = useState(profile?.frame || 'frame-bronze');
  const [title, setTitle] = useState(profile?.title || 'Deduction Novice');

  // Settings State
  const [visibility, setVisibility] = useState<'public' | 'friends_only' | 'private'>(profile?.settings?.visibility || 'public');
  const [soundSfx, setSoundSfx] = useState<number>(profile?.settings?.soundSfx ?? 80);
  const [soundMusic, setSoundMusic] = useState<number>(profile?.settings?.soundMusic ?? 60);
  const [reducedMotion, setReducedMotion] = useState<boolean>(profile?.settings?.reducedMotion ?? false);

  // UI state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [requestSentMap, setRequestSentMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setBio(profile.bio);
      setAvatar(profile.avatar);
      setCustomAvatar(profile.customAvatar);
      setFrame(profile.frame);
      setTitle(profile.title);
      if (profile.settings) {
        setVisibility(profile.settings.visibility);
        setSoundSfx(profile.settings.soundSfx);
        setSoundMusic(profile.settings.soundMusic);
        setReducedMotion(profile.settings.reducedMotion);
      }
    }
  }, [profile]);

  if (!isOpen) return null;

  const handleCopyId = () => {
    if (profile?.playerId) {
      navigator.clipboard.writeText(profile.playerId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSaveStatus('saving');
    playClick();

    const res = await onUpdateProfile({
      username: username.trim(),
      bio: bio.trim(),
      avatar,
      customAvatar,
      frame,
      title,
      settings: {
        visibility,
        notifications: true,
        reducedMotion,
        soundSfx,
        soundMusic
      }
    });

    if (res.success) {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('error');
      setErrorMessage(res.error || 'Failed to update profile');
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length >= 2) {
      setIsSearching(true);
      const results = await onSearchPlayers(query);
      setSearchResults(results);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  const handleSendFriend = async (targetId: string) => {
    playClick();
    const res = await onSendFriendRequest(targetId);
    if (res.success) {
      setRequestSentMap(prev => ({ ...prev, [targetId]: true }));
    }
  };

  const unlockedCount = profile?.achievements?.filter(a => a.unlocked).length || 0;
  const totalAchievements = profile?.achievements?.length || 7;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#0D1017] border border-[#D4AF37]/35 rounded-3xl flex flex-col max-h-[92vh] shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#D4AF37]/20 flex items-center justify-between flex-shrink-0 bg-[#07080B]/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1A1F2C] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-[#FAF8F5]">ARENA PROFILE & PROGRESSION</h2>
              <p className="text-xs text-[#A7A29A]">Career identity, verified metrics, achievements & alliances</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#131722] hover:bg-[#1A1F2C] text-[#A7A29A] hover:text-[#FAF8F5] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-white/5 bg-[#090C12] overflow-x-auto gap-2 py-2 flex-shrink-0 scrollbar-none">
          <button
            onClick={() => { playClick(); setActiveTab('profile'); }}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'profile'
                ? 'bg-[#1A1F2C] text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm'
                : 'text-[#A7A29A] hover:text-[#FAF8F5] hover:bg-white/5'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
          <button
            onClick={() => { playClick(); setActiveTab('stats'); }}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'stats'
                ? 'bg-[#1A1F2C] text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm'
                : 'text-[#A7A29A] hover:text-[#FAF8F5] hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Statistics</span>
          </button>
          <button
            onClick={() => { playClick(); setActiveTab('achievements'); }}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'achievements'
                ? 'bg-[#1A1F2C] text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm'
                : 'text-[#A7A29A] hover:text-[#FAF8F5] hover:bg-white/5'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Achievements ({unlockedCount}/{totalAchievements})</span>
          </button>
          <button
            onClick={() => { playClick(); setActiveTab('history'); }}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'history'
                ? 'bg-[#1A1F2C] text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm'
                : 'text-[#A7A29A] hover:text-[#FAF8F5] hover:bg-white/5'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Match History</span>
          </button>
          <button
            onClick={() => { playClick(); setActiveTab('friends'); }}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'friends'
                ? 'bg-[#1A1F2C] text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm'
                : 'text-[#A7A29A] hover:text-[#FAF8F5] hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Friends ({friends.length})</span>
            {friendRequests.incoming.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            )}
          </button>
          <button
            onClick={() => { playClick(); setActiveTab('settings'); }}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'settings'
                ? 'bg-[#1A1F2C] text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm'
                : 'text-[#A7A29A] hover:text-[#FAF8F5] hover:bg-white/5'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: EDIT PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Level & XP Progression Card */}
              <div className="p-5 rounded-2xl bg-[#07080B] border border-[#D4AF37]/30 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#9A7B38] to-[#D4AF37] text-black font-extrabold text-xs font-mono">
                      LEVEL {profile?.level || 1}
                    </span>
                    <span className="text-sm font-display font-bold text-[#FAF8F5]">
                      {profile?.title || 'Deduction Novice'}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[#D4AF37]">
                    {profile?.currentLevelXp || 0} / {profile?.nextLevelXp || 100} XP
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2.5 rounded-full bg-[#131722] overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-[#9A7B38] via-[#D4AF37] to-[#F5D061] rounded-full transition-all duration-500 shadow-sm shadow-[#D4AF37]/30"
                    style={{ width: `${profile?.levelProgressPercent || 0}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono text-[#7A756D]">
                  <span>Total Career Experience: {profile?.xp || 0} XP</span>
                  <span>{profile?.levelProgressPercent || 0}% to Next Rank</span>
                </div>
              </div>

              {/* Avatar & Frame Showcase */}
              <div className="p-5 rounded-2xl bg-[#090C12] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden bg-[#131722] border-2 shadow-lg ${
                      FRAME_CLASSES[frame] || 'border-[#C5A059]/40'
                    }`}
                  >
                    {customAvatar ? (
                      <img src={customAvatar} alt={username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl text-[#D4AF37]">
                        {BUILTIN_AVATAR_ICONS[avatar] || '◈'}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold uppercase text-[#D4AF37] tracking-wider">
                      {title}
                    </span>
                    <h3 className="font-display font-black text-xl text-[#FAF8F5]">{username || 'Player'}</h3>
                    <p className="text-xs text-[#7A756D] font-mono">Frame: {frame.replace('frame-', '').replace('-', ' ')}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#1A1F2C] hover:bg-[#252D40] border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-mono font-bold flex items-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Customize Avatar & Frame</span>
                </button>
              </div>

              {/* Form Details */}
              <form onSubmit={handleSaveProfile} className="space-y-5">
                {/* Username */}
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase text-[#A7A29A] mb-2">
                    Arena Display Nickname
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={20}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#131722] border border-[#C5A059]/30 text-[#F5F2EB] text-sm font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                  <p className="mt-1.5 text-[11px] font-mono text-[#7A756D]">
                    3–20 characters. Alphanumeric, underscores, and hyphens. Preserved across all matches.
                  </p>
                </div>

                {/* Bio / Status */}
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase text-[#A7A29A] mb-2">
                    Status / Mind Creed (Max 160 chars)
                  </label>
                  <textarea
                    rows={3}
                    maxLength={160}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Describe your deduction philosophy or leave a message for opponents..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#131722] border border-[#C5A059]/30 text-[#F5F2EB] text-sm font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                  <div className="flex justify-end text-[10px] font-mono text-[#7A756D]">
                    {bio.length} / 160 characters
                  </div>
                </div>

                {/* Public Player ID */}
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase text-[#A7A29A] mb-2">
                    Permanent Player ID
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={profile?.playerId || ''}
                      className="w-full px-4 py-2 rounded-xl bg-[#07080B] border border-white/10 text-[#7A756D] text-xs font-mono cursor-default"
                    />
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="px-3 py-2 rounded-xl bg-[#131722] hover:bg-[#1A1F2C] border border-[#D4AF37]/30 text-xs font-mono text-[#FAF8F5] flex items-center gap-1.5 transition-all"
                    >
                      {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#D4AF37]" />}
                      <span>{copiedId ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Feedback & Error */}
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs font-mono text-rose-300">
                    {errorMessage}
                  </div>
                )}

                {/* Save Button */}
                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={saveStatus === 'saving'}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#9A7B38] via-[#D4AF37] to-[#8C6D34] text-black font-extrabold text-xs font-mono tracking-wider shadow-lg shadow-[#D4AF37]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                  >
                    {saveStatus === 'saving' ? (
                      <div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                    ) : saveStatus === 'saved' ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{saveStatus === 'saved' ? 'Saved Successfully!' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: VERIFIED SERVER STATISTICS */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#07080B] border border-[#D4AF37]/25 text-center">
                  <span className="text-[11px] font-mono text-[#A7A29A] uppercase">Win Rate</span>
                  <div className="text-2xl font-display font-black text-[#D4AF37] mt-1">
                    {profile?.stats?.winRate || 0}%
                  </div>
                  <span className="text-[10px] font-mono text-[#7A756D]">Authoritative Wins</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#07080B] border border-white/10 text-center">
                  <span className="text-[11px] font-mono text-[#A7A29A] uppercase">Matches Played</span>
                  <div className="text-2xl font-display font-black text-[#FAF8F5] mt-1">
                    {profile?.stats?.gamesPlayed || 0}
                  </div>
                  <span className="text-[10px] font-mono text-[#7A756D]">
                    {profile?.stats?.wins || 0}W &bull; {profile?.stats?.losses || 0}L
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-[#07080B] border border-white/10 text-center">
                  <span className="text-[11px] font-mono text-[#A7A29A] uppercase">Exact Deductions</span>
                  <div className="text-2xl font-display font-black text-emerald-400 mt-1">
                    {profile?.stats?.exactGuesses || 0}
                  </div>
                  <span className="text-[10px] font-mono text-[#7A756D]">0 Difference Matches</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#07080B] border border-white/10 text-center">
                  <span className="text-[11px] font-mono text-[#A7A29A] uppercase">Avg Accuracy</span>
                  <div className="text-2xl font-display font-black text-indigo-400 mt-1">
                    {profile?.stats?.averageAccuracy || 0}%
                  </div>
                  <span className="text-[10px] font-mono text-[#7A756D]">Career Average</span>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="p-5 rounded-2xl bg-[#090C12] border border-white/10 space-y-4">
                <h3 className="font-display font-bold text-sm text-[#FAF8F5]">Score & Streaks</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 rounded-xl bg-[#07080B] border border-white/5 flex items-center justify-between">
                    <span className="text-xs font-mono text-[#A7A29A]">Career Points:</span>
                    <span className="text-sm font-bold text-[#FAF8F5]">{profile?.stats?.totalPoints || 0} pts</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#07080B] border border-white/5 flex items-center justify-between">
                    <span className="text-xs font-mono text-[#A7A29A]">Best Match Score:</span>
                    <span className="text-sm font-bold text-[#D4AF37]">{profile?.stats?.bestScore || 0} pts</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#07080B] border border-white/5 flex items-center justify-between">
                    <span className="text-xs font-mono text-[#A7A29A]">Win Streak (Current / Best):</span>
                    <span className="text-sm font-bold text-amber-400">
                      {profile?.stats?.currentStreak || 0} / {profile?.stats?.bestStreak || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACHIEVEMENTS */}
          {activeTab === 'achievements' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#A7A29A]">
                  Unlocked <strong className="text-[#D4AF37]">{unlockedCount}</strong> of {totalAchievements} Arena Achievements
                </span>
                <span className="text-xs font-mono text-[#7A756D]">Rewards grant exclusive frames and titles</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {profile?.achievements?.map((ach) => {
                  const colors = TIER_COLORS[ach.tier] || TIER_COLORS.bronze;
                  return (
                    <div
                      key={ach.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        ach.unlocked
                          ? 'bg-[#090C12] border-[#D4AF37]/40 shadow-sm'
                          : 'bg-[#07080B] border-white/5 opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center border font-bold text-sm ${colors.badge} ${colors.text}`}
                          >
                            {ach.unlocked ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Award className="w-5 h-5 opacity-50" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-display font-bold text-sm text-[#FAF8F5]">{ach.name}</h4>
                              <span className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border ${colors.badge} ${colors.text}`}>
                                {ach.tier}
                              </span>
                            </div>
                            <p className="text-xs text-[#A7A29A] mt-0.5">{ach.description}</p>
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3.5 space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-[#7A756D]">
                            Reward: <span className="text-[#D4AF37]">{ach.rewardId} ({ach.rewardType})</span>
                          </span>
                          <span className={ach.unlocked ? 'text-emerald-400 font-bold' : 'text-[#A7A29A]'}>
                            {ach.unlocked ? 'COMPLETED' : `${ach.progress} / ${ach.maxProgress}`}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[#131722] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              ach.unlocked ? 'bg-gradient-to-r from-[#9A7B38] to-[#D4AF37]' : 'bg-white/20'
                            }`}
                            style={{ width: `${Math.min(100, (ach.progress / ach.maxProgress) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: MATCH HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {!profile?.matchHistory || profile.matchHistory.length === 0 ? (
                <div className="py-16 text-center text-xs font-mono text-[#7A756D]">
                  No recorded matches yet. Play in public matchmaking or a private room to record results!
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.matchHistory.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-2xl bg-[#07080B] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                            m.isWin
                              ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/50'
                              : 'bg-stone-800 text-stone-300 border border-stone-700'
                          }`}
                        >
                          {m.isWin ? 'VICTORY' : `RANK #${m.rank} / ${m.totalPlayers}`}
                        </span>
                        <div>
                          <div className="text-sm font-bold text-[#FAF8F5]">
                            {m.finalScore} Points &bull; Arena #{m.roomCode}
                          </div>
                          <div className="text-[11px] text-[#7A756D]">
                            Opponents: {m.opponents?.map(o => o.nickname).join(', ') || 'Solo'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <span className="text-emerald-400 font-bold">{m.accuracy}% accuracy</span>
                          {m.exactGuesses > 0 && <span className="ml-1 text-[#D4AF37] font-bold">({m.exactGuesses} exact)</span>}
                          <div className="text-[10px] text-[#7A756D]">
                            +{m.earnedXp} XP &bull; {new Date(m.playedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FRIENDS & SOCIAL */}
          {activeTab === 'friends' && (
            <div className="space-y-6">
              {/* Search Players */}
              <div>
                <label className="block text-xs font-mono font-semibold uppercase text-[#A7A29A] mb-2">
                  Search & Add Arena Players
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-[#A7A29A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search by username or permanent player ID..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#131722] border border-white/10 text-[#FAF8F5] text-xs font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="mt-2 p-2 rounded-2xl bg-[#07080B] border border-[#D4AF37]/30 space-y-2">
                    {searchResults.map((p) => {
                      const alreadyFriend = friends.some(f => f.playerId === p.playerId);
                      const isSent = requestSentMap[p.playerId];
                      return (
                        <div
                          key={p.playerId}
                          className="p-2.5 rounded-xl bg-[#131722] flex items-center justify-between text-xs font-mono"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base text-[#D4AF37]">{BUILTIN_AVATAR_ICONS[p.avatar] || '◈'}</span>
                            <span className="font-bold text-[#FAF8F5]">{p.username}</span>
                            <span className="text-[10px] text-[#7A756D]">Lv.{p.level}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onInspectPlayer(p.playerId)}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-[#A7A29A] hover:text-[#FAF8F5]"
                            >
                              Inspect
                            </button>
                            {alreadyFriend ? (
                              <span className="text-emerald-400 text-[11px] font-bold">Friends</span>
                            ) : isSent ? (
                              <span className="text-[#D4AF37] text-[11px]">Request Sent</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSendFriend(p.playerId)}
                                className="px-3 py-1 rounded-lg bg-[#D4AF37] text-black font-extrabold text-[11px] hover:bg-[#F3E5AB]"
                              >
                                Add Friend
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Incoming Requests */}
              {friendRequests.incoming.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase text-[#D4AF37] mb-2">
                    Incoming Friend Requests ({friendRequests.incoming.length})
                  </h4>
                  <div className="space-y-2">
                    {friendRequests.incoming.map((req) => (
                      <div
                        key={req.playerId}
                        className="p-3 rounded-xl bg-[#07080B] border border-[#D4AF37]/30 flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base text-[#D4AF37]">{BUILTIN_AVATAR_ICONS[req.avatar] || '◈'}</span>
                          <span className="font-bold text-[#FAF8F5]">{req.username}</span>
                          <span className="text-[10px] text-[#7A756D]">Lv.{req.level}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onRespondFriendRequest(req.playerId, true)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => onRespondFriendRequest(req.playerId, false)}
                            className="px-3 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends List */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase text-[#A7A29A] mb-3">
                  Allied Friends ({friends.length})
                </h4>
                {friends.length === 0 ? (
                  <p className="text-xs font-mono text-[#7A756D] py-6 text-center">
                    No friends added yet. Search players above or click any opponent in the arena to add them!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {friends.map((f) => (
                      <div
                        key={f.playerId}
                        className="p-3 rounded-xl bg-[#07080B] border border-white/5 flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <span className="text-lg text-[#D4AF37]">{BUILTIN_AVATAR_ICONS[f.avatar] || '◈'}</span>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black ${
                                f.isOnline ? 'bg-emerald-400' : 'bg-stone-600'
                              }`}
                            />
                          </div>
                          <div>
                            <div className="font-bold text-[#FAF8F5]">{f.username}</div>
                            <div className="text-[10px] text-[#7A756D]">
                              {f.isOnline ? (f.currentRoomCode ? `In Arena #${f.currentRoomCode}` : 'Online') : 'Offline'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {currentRoomCode && f.isOnline && (
                            <button
                              type="button"
                              onClick={() => onInviteToRoom(f.playerId)}
                              className="px-2.5 py-1 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] border border-[#D4AF37]/40 text-[11px]"
                            >
                              Invite
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onInspectPlayer(f.playerId)}
                            className="px-2.5 py-1 rounded-lg bg-[#131722] hover:bg-[#1A1F2C] text-[#A7A29A] hover:text-[#FAF8F5] text-[11px]"
                          >
                            Dossier
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveFriend(f.playerId)}
                            className="px-2 py-1 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border border-rose-500/20 text-[10px]"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-xl mx-auto">
              {/* Privacy Setting */}
              <div>
                <label className="block text-xs font-mono font-semibold uppercase text-[#A7A29A] mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#D4AF37]" />
                  <span>Dossier Privacy Setting</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['public', 'friends_only', 'private'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setVisibility(mode)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        visibility === mode
                          ? 'bg-[#1A1F2C] border-[#D4AF37] text-[#FAF8F5] ring-1 ring-[#D4AF37]/40'
                          : 'bg-[#131722] border-white/5 text-[#A7A29A] hover:border-[#D4AF37]/30'
                      }`}
                    >
                      <div className="text-xs font-mono font-bold capitalize">{mode.replace('_', ' ')}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Controls */}
              <div className="space-y-4">
                <label className="block text-xs font-mono font-semibold uppercase text-[#A7A29A] flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>Audio Levels</span>
                </label>
                <div>
                  <div className="flex justify-between text-xs font-mono text-[#A7A29A] mb-1">
                    <span>Sound SFX Volume:</span>
                    <span className="text-[#FAF8F5]">{soundSfx}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={soundSfx}
                    onChange={(e) => setSoundSfx(Number(e.target.value))}
                    className="w-full accent-[#D4AF37]"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-mono text-[#A7A29A] mb-1">
                    <span>Music Volume:</span>
                    <span className="text-[#FAF8F5]">{soundMusic}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={soundMusic}
                    onChange={(e) => setSoundMusic(Number(e.target.value))}
                    className="w-full accent-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#07080B] border border-white/10">
                <div>
                  <div className="text-xs font-mono font-bold text-[#FAF8F5]">Reduced Motion</div>
                  <div className="text-[11px] text-[#7A756D]">Simplify 3D animations and particle effects</div>
                </div>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="w-5 h-5 accent-[#D4AF37] rounded"
                />
              </div>

              {/* Save Settings Button */}
              <button
                type="button"
                onClick={() => handleSaveProfile()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#9A7B38] to-[#D4AF37] text-black font-extrabold text-xs font-mono shadow-md"
              >
                Save Settings
              </button>

              {/* Danger Zone */}
              <div className="pt-6 border-t border-rose-500/20">
                <span className="block text-xs font-mono font-bold uppercase text-rose-400 mb-2">
                  Danger Zone
                </span>
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Reset Career & Delete Profile</span>
                  </button>
                ) : (
                  <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500 text-xs font-mono space-y-3">
                    <p className="text-rose-200">
                      Are you completely sure? This will delete all career match stats, XP, unlocks and alliances permanently.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onDeleteAccount}
                        className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                      >
                        Yes, Delete Everything
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        currentAvatar={avatar}
        currentCustomAvatar={customAvatar}
        currentFrame={frame}
        currentTitle={title}
        unlockedFrames={profile?.unlockedCosmetics?.frames}
        unlockedTitles={profile?.unlockedCosmetics?.titles}
        onApply={(selected) => {
          setAvatar(selected.avatar);
          setCustomAvatar(selected.customAvatar);
          setFrame(selected.frame);
          setTitle(selected.title);
        }}
      />
    </div>
  );
};
