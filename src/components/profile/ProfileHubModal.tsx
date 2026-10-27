// src/components/profile/ProfileHubModal.tsx
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  X,
  Pencil,
  Check,
  Shield,
  Trophy,
  Award,
  History,
  Users,
  Settings,
  Search,
  ExternalLink,
  Save,
  Trash2,
  Lock,
  Eye,
  Sliders,
  Sparkles,
  BookOpen,
  Home
} from 'lucide-react';
import { UserProfile, FriendSummary, FriendRequest } from '../../types/game';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'achievements' | 'history' | 'friends' | 'settings'>('overview');

  // Form states
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatar, setAvatar] = useState(profile?.avatar || 'avatar-1');
  const [customAvatar, setCustomAvatar] = useState<string | null>(profile?.customAvatar || null);
  const [title, setTitle] = useState(profile?.title || 'The Silent Deducer');
  const [frame, setFrame] = useState(profile?.frame || 'frame-bronze');

  // UI modal states
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setBio(profile.bio);
      setAvatar(profile.avatar);
      setCustomAvatar(profile.customAvatar);
      setTitle(profile.title || 'The Silent Deducer');
      setFrame(profile.frame || 'frame-bronze');
    }
  }, [profile]);

  if (!isOpen) return null;

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
      title
    });

    if (res.success) {
      setSaveStatus('saved');
      setIsEditing(false);
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

  // Real Stats from profile
  const matches = profile?.stats?.matchesPlayed || 0;
  const wins = profile?.stats?.wins || 0;
  const winRate = profile?.stats?.winRate ? Math.round(profile.stats.winRate * 100) : 0;
  const bestStreak = profile?.stats?.bestWinningStreak || 0;
  const currentLevel = profile?.progression?.level || 1;
  const currentXp = profile?.progression?.currentXp || 0;
  const requiredXp = profile?.progression?.xpRequiredForNextLevel || 1000;
  const xpPercent = Math.min(100, Math.round((currentXp / requiredXp) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#101719] border border-[#293130] rounded-3xl flex flex-col max-h-[92vh] shadow-2xl overflow-hidden">
        {/* Top Header: Back button, Title, Close button */}
        <div className="px-6 py-4 border-b border-[#293130] flex items-center justify-between flex-shrink-0 bg-[#070B0D]">
          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="flex items-center gap-2 text-sm font-display font-semibold text-[#F1EBDD] hover:text-[#A8C66C] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>PROFILE</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#151D1D] hover:bg-[#1E2728] text-[#A8ADA7] hover:text-[#F1EBDD] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-[#293130] bg-[#070B0D] overflow-x-auto gap-4 py-2 flex-shrink-0 scrollbar-none text-xs font-mono">
          <button
            onClick={() => { playClick(); setActiveTab('overview'); }}
            className={`py-1.5 border-b-2 font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'overview'
                ? 'border-[#A8C66C] text-[#A8C66C]'
                : 'border-transparent text-[#A8ADA7] hover:text-[#F1EBDD]'
            }`}
          >
            OVERVIEW
          </button>
          <button
            onClick={() => { playClick(); setActiveTab('stats'); }}
            className={`py-1.5 border-b-2 font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'stats'
                ? 'border-[#A8C66C] text-[#A8C66C]'
                : 'border-transparent text-[#A8ADA7] hover:text-[#F1EBDD]'
            }`}
          >
            STATS
          </button>
          <button
            onClick={() => { playClick(); setActiveTab('achievements'); }}
            className={`py-1.5 border-b-2 font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'achievements'
                ? 'border-[#A8C66C] text-[#A8C66C]'
                : 'border-transparent text-[#A8ADA7] hover:text-[#F1EBDD]'
            }`}
          >
            ACHIEVEMENTS
          </button>
          <button
            onClick={() => { playClick(); setActiveTab('history'); }}
            className={`py-1.5 border-b-2 font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'history'
                ? 'border-[#A8C66C] text-[#A8C66C]'
                : 'border-transparent text-[#A8ADA7] hover:text-[#F1EBDD]'
            }`}
          >
            HISTORY
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Profile Main Card */}
              <div className="flex flex-col items-center text-center space-y-3">
                {/* Circular Avatar with Edit Pencil */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-[#151D1D] ring-2 ring-[#C6A45A]/70 flex items-center justify-center font-display font-bold text-3xl text-[#F1EBDD] overflow-hidden shadow-xl shadow-black/60">
                    {customAvatar ? (
                      <img src={customAvatar} alt={username} className="w-full h-full object-cover" />
                    ) : (
                      <span>{username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <button
                    onClick={() => setPickerOpen(true)}
                    title="Change Avatar"
                    className="absolute bottom-0 right-0 p-2 rounded-full bg-[#1E2728] hover:bg-[#283435] border border-[#293130] text-[#F1EBDD] shadow-md transition-transform hover:scale-105"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#A8C66C]" />
                  </button>
                </div>

                {/* Nickname & Player Title */}
                <div>
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-[#F1EBDD]">
                    {username}
                  </h2>
                  <p className="text-xs font-mono text-[#C6A45A] mt-0.5">
                    {title}
                  </p>
                </div>

                {/* Level Pill & XP Progress Bar */}
                <div className="w-full max-w-xs space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-[#151D1D] border border-[#293130] text-[#A8C66C] font-bold">
                      LEVEL {currentLevel}
                    </span>
                    <span className="text-[#A8ADA7]">
                      {currentXp} / {requiredXp} XP
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-[#151D1D] overflow-hidden border border-[#293130]">
                    <div
                      className="h-full bg-[#A8C66C] rounded-full transition-all duration-300"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                </div>

                {/* Edit Profile / Customize Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-5 py-2 rounded-xl bg-[#151D1D] hover:bg-[#1E2728] border border-[#293130] text-xs font-mono font-semibold text-[#F1EBDD] transition-all"
                  >
                    {isEditing ? 'CANCEL' : 'EDIT PROFILE'}
                  </button>
                  <button
                    onClick={() => setPickerOpen(true)}
                    className="px-5 py-2 rounded-xl bg-[#151D1D] hover:bg-[#1E2728] border border-[#293130] text-xs font-mono font-semibold text-[#F1EBDD] transition-all"
                  >
                    CUSTOMIZE
                  </button>
                </div>
              </div>

              {/* Inline Edit Form */}
              {isEditing && (
                <form onSubmit={handleSaveProfile} className="p-4 rounded-2xl bg-[#151D1D] border border-[#293130] space-y-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[#A8ADA7] mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#101719] border border-[#293130] text-xs text-[#F1EBDD] focus:outline-none focus:border-[#A8C66C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[#A8ADA7] mb-1">
                      Player Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#101719] border border-[#293130] text-xs text-[#F1EBDD] focus:outline-none focus:border-[#A8C66C]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={saveStatus === 'saving'}
                      className="px-4 py-2 rounded-xl bg-[#A8C66C] hover:bg-[#B8D47C] text-[#070B0D] text-xs font-mono font-bold transition-all shadow-sm"
                    >
                      {saveStatus === 'saving' ? 'SAVING...' : 'SAVE CHANGES'}
                    </button>
                  </div>

                  {errorMessage && (
                    <p className="text-xs font-mono text-[#E05D52]">{errorMessage}</p>
                  )}
                </form>
              )}

              {/* 4-Column Summary Statistics */}
              <div className="grid grid-cols-4 gap-2.5 p-4 rounded-2xl bg-[#151D1D] border border-[#293130] text-center">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#A8ADA7] block">Matches</span>
                  <span className="font-mono font-bold text-lg sm:text-xl text-[#F1EBDD]">{matches}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#A8ADA7] block">Wins</span>
                  <span className="font-mono font-bold text-lg sm:text-xl text-[#F1EBDD]">{wins}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#A8ADA7] block">Win Rate</span>
                  <span className="font-mono font-bold text-lg sm:text-xl text-[#F1EBDD]">{winRate}%</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#A8ADA7] block">Best Streak</span>
                  <span className="font-mono font-bold text-lg sm:text-xl text-[#F1EBDD]">{bestStreak}</span>
                </div>
              </div>

              {/* Recent Matches Feed */}
              <div className="space-y-3">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#A8ADA7] block">
                  RECENT MATCHES
                </span>

                {profile?.matchHistory && profile.matchHistory.length > 0 ? (
                  <div className="space-y-2">
                    {profile.matchHistory.slice(0, 5).map((match, idx) => (
                      <div
                        key={match.matchId || idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#151D1D] border border-[#293130] text-xs font-mono"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-[#101719] border border-[#293130] flex items-center justify-center font-bold text-[10px] text-[#A8ADA7]">
                            #{idx + 1}
                          </div>
                          <div>
                            <span className="text-[#F1EBDD] font-medium block">Round {idx + 1}</span>
                            <span className="text-[10px] text-[#A8ADA7]">Opponents: {match.opponents?.length || 2}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            match.won ? 'bg-[#A8C66C]/15 text-[#A8C66C]' : 'bg-[#101719] text-[#A8ADA7]'
                          }`}>
                            {match.won ? 'Won' : 'Completed'}
                          </span>
                          <span className="font-bold text-[#F1EBDD]">+{match.pointsAwarded || 50} PTS</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs font-mono text-[#A8ADA7]/60 p-4 rounded-xl bg-[#151D1D] border border-[#293130]">
                    No completed matches recorded yet. Play a match to build your career history!
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-4">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#A8ADA7] block">
                DETAILED DEDUCTION METRICS
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-[#151D1D] border border-[#293130]">
                  <span className="text-[#A8ADA7] block text-[10px] uppercase">Exact Guesses</span>
                  <span className="font-bold text-lg text-[#F1EBDD]">{profile?.stats?.correctGuesses || 0}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#151D1D] border border-[#293130]">
                  <span className="text-[#A8ADA7] block text-[10px] uppercase">Current Streak</span>
                  <span className="font-bold text-lg text-[#F1EBDD]">{profile?.stats?.currentWinningStreak || 0}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#151D1D] border border-[#293130]">
                  <span className="text-[#A8ADA7] block text-[10px] uppercase">Total Career Score</span>
                  <span className="font-bold text-lg text-[#F1EBDD]">{profile?.stats?.totalScore || 0}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#151D1D] border border-[#293130]">
                  <span className="text-[#A8ADA7] block text-[10px] uppercase">Best Single Match</span>
                  <span className="font-bold text-lg text-[#F1EBDD]">{profile?.stats?.bestScore || 0}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-4">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#A8ADA7] block">
                CAREER ACHIEVEMENTS
              </span>
              <div className="space-y-2">
                {profile?.achievements?.map((ach) => (
                  <div
                    key={ach.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
                      ach.unlocked
                        ? 'bg-[#151D1D] border-[#A8C66C]/40 text-[#F1EBDD]'
                        : 'bg-[#101719] border-[#293130] text-[#A8ADA7]/60 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Award className={`w-4 h-4 ${ach.unlocked ? 'text-[#C6A45A]' : 'text-[#A8ADA7]'}`} />
                        <span className="font-bold">{ach.title}</span>
                      </div>
                      <p className="text-[11px] text-[#A8ADA7] mt-0.5">{ach.description}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase">
                      {ach.unlocked ? '✓ Unlocked' : 'Locked'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#A8ADA7] block">
                VERIFIED MATCH HISTORY
              </span>
              {(!profile?.matchHistory || profile.matchHistory.length === 0) ? (
                <div className="py-8 text-center text-xs font-mono text-[#A8ADA7]/60">
                  No match history found.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {profile.matchHistory.map((m, i) => (
                    <div key={m.matchId || i} className="p-3 rounded-xl bg-[#151D1D] border border-[#293130] flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="font-bold text-[#F1EBDD]">Match #{m.matchId?.slice(-6) || i + 1}</span>
                        <div className="text-[10px] text-[#A8ADA7]">{new Date(m.playedAt).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[#A8C66C]">+{m.pointsAwarded} PTS</span>
                        <div className="text-[10px] text-[#A8ADA7]">{m.won ? 'Won' : 'Completed'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <div className="px-6 py-3 border-t border-[#293130] flex items-center justify-around text-xs font-mono text-[#A8ADA7] bg-[#070B0D]">
          <div onClick={() => onClose()} className="flex flex-col items-center gap-1 hover:text-[#F1EBDD] cursor-pointer transition-colors">
            <Home className="w-4 h-4" />
            <span className="text-[10px] uppercase tracking-wider">Lobby</span>
          </div>
          <div onClick={() => { playClick(); setActiveTab('stats'); }} className="flex flex-col items-center gap-1 hover:text-[#F1EBDD] cursor-pointer transition-colors">
            <Trophy className="w-4 h-4" />
            <span className="text-[10px] uppercase tracking-wider">Rankings</span>
          </div>
          <div onClick={() => { playClick(); setActiveTab('friends'); }} className="flex flex-col items-center gap-1 hover:text-[#F1EBDD] cursor-pointer transition-colors">
            <Users className="w-4 h-4" />
            <span className="text-[10px] uppercase tracking-wider">Friends</span>
          </div>
          <div onClick={() => { playClick(); setActiveTab('overview'); }} className="flex flex-col items-center gap-1 text-[#A8C66C] cursor-pointer">
            <Award className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Profile</span>
          </div>
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
        onApply={(selected) => {
          setAvatar(selected.avatar);
          setCustomAvatar(selected.customAvatar);
          setFrame(selected.frame);
          setTitle(selected.title);
          setPickerOpen(false);
        }}
      />
    </div>
  );
};
