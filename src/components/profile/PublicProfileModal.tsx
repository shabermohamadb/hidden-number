// src/components/profile/PublicProfileModal.tsx
import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Send,
  Flag,
  Lock,
  Trophy,
  Target,
  Flame,
  Award,
  CheckCircle,
  Clock,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { PublicUserProfile } from '../../types/game';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetPlayerId: string | null;
  onGetPublicProfile: (targetPlayerId: string) => Promise<{ success: boolean; profile?: PublicUserProfile; error?: string }>;
  onSendFriendRequest: (targetPlayerId: string) => Promise<{ success: boolean; error?: string; status?: string }>;
  onInviteToRoom?: (friendPlayerId: string) => Promise<{ success: boolean; error?: string }>;
  onReportPlayer: (reportedId: string, reason: string, details?: string) => Promise<{ success: boolean; error?: string }>;
  currentRoomCode?: string | null;
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

export const PublicProfileModal: React.FC<Props> = ({
  isOpen,
  onClose,
  targetPlayerId,
  onGetPublicProfile,
  onSendFriendRequest,
  onInviteToRoom,
  onReportPlayer,
  currentRoomCode
}) => {
  const { playClick } = useSoundFX();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [friendStatus, setFriendStatus] = useState<string>('idle');
  const [inviteSent, setInviteSent] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Abusive behavior');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen && targetPlayerId) {
      setLoading(true);
      setFriendStatus('idle');
      setInviteSent(false);
      setReportOpen(false);
      setReportSubmitted(false);

      onGetPublicProfile(targetPlayerId).then((res) => {
        setLoading(false);
        if (res.success && res.profile) {
          setProfile(res.profile);
          if (res.profile.isFriend) {
            setFriendStatus('friends');
          }
        }
      });
    } else {
      setProfile(null);
    }
  }, [isOpen, targetPlayerId, onGetPublicProfile]);

  if (!isOpen || !targetPlayerId) return null;

  const handleAddFriend = async () => {
    playClick();
    setFriendStatus('sending');
    const res = await onSendFriendRequest(targetPlayerId);
    if (res.success) {
      setFriendStatus(res.status === 'accepted' ? 'friends' : 'pending');
    } else {
      setFriendStatus('idle');
    }
  };

  const handleInvite = async () => {
    if (!onInviteToRoom) return;
    playClick();
    const res = await onInviteToRoom(targetPlayerId);
    if (res.success) {
      setInviteSent(true);
      setTimeout(() => setInviteSent(false), 3000);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    await onReportPlayer(targetPlayerId, reportReason, reportDetails);
    setReportSubmitted(true);
    setTimeout(() => {
      setReportOpen(false);
      setReportSubmitted(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0D1017] border border-[#D4AF37]/35 rounded-3xl p-6 sm:p-8 flex flex-col max-h-[90vh] shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#D4AF37]/20 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#D4AF37]">
              ARENA DOSSIER
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#131722] hover:bg-[#1A1F2C] text-[#A7A29A] hover:text-[#FAF8F5] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
            <span className="text-xs font-mono text-[#A7A29A]">Retrieving mind record...</span>
          </div>
        ) : !profile ? (
          <div className="py-16 text-center text-xs font-mono text-rose-400">
            Failed to retrieve player dossier.
          </div>
        ) : (
          <div className="overflow-y-auto py-5 space-y-6 pr-1">
            {/* Identity Card */}
            <div className="p-5 rounded-2xl bg-[#07080B] border border-[#D4AF37]/25 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden bg-[#131722] border-2 shadow-lg ${
                    FRAME_CLASSES[profile.frame || 'frame-bronze'] || 'border-[#C5A059]/40'
                  }`}
                >
                  {profile.customAvatar ? (
                    <img src={profile.customAvatar} alt={profile.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-[#D4AF37]">
                      {BUILTIN_AVATAR_ICONS[profile.avatar] || '◈'}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-mono font-bold uppercase text-[#D4AF37] tracking-wider">
                    {profile.title || 'Deduction Novice'}
                  </div>
                  <h3 className="font-display font-black text-xl text-[#FAF8F5] leading-tight">
                    {profile.username}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#131722] text-[#A7A29A] border border-white/10">
                      Level {profile.level}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                        profile.isOnline
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                          : 'bg-stone-900 text-stone-500 border border-stone-800'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${profile.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-stone-600'}`} />
                      {profile.isOnline ? (profile.currentRoomCode ? `In Arena #${profile.currentRoomCode}` : 'Online') : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                {friendStatus === 'friends' ? (
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Friends</span>
                  </div>
                ) : friendStatus === 'pending' ? (
                  <div className="px-3 py-1.5 rounded-xl bg-[#1A1F2C] border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Request Sent</span>
                  </div>
                ) : (
                  <button
                    onClick={handleAddFriend}
                    disabled={friendStatus === 'sending'}
                    className="px-3.5 py-1.5 rounded-xl bg-[#1A1F2C] hover:bg-[#252D40] border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-mono font-bold flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Friend</span>
                  </button>
                )}

                {currentRoomCode && profile.isOnline && (
                  <button
                    onClick={handleInvite}
                    disabled={inviteSent}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#9A7B38] to-[#D4AF37] text-black text-xs font-mono font-extrabold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{inviteSent ? 'Invited!' : 'Invite Room'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-xs text-[#A7A29A] italic px-1 font-sans">
                &ldquo;{profile.bio}&rdquo;
              </p>
            )}

            {/* Privacy Check */}
            {profile.isPrivate || profile.isFriendsOnly ? (
              <div className="p-8 rounded-2xl bg-[#07080B] border border-white/5 flex flex-col items-center justify-center text-center gap-2">
                <Lock className="w-8 h-8 text-[#A7A29A]/50" />
                <h4 className="font-display font-bold text-sm text-[#FAF8F5]">Restricted Dossier</h4>
                <p className="text-xs font-mono text-[#A7A29A] max-w-xs">
                  {profile.isPrivate
                    ? 'This player has set their arena statistics and match history to private.'
                    : 'This player only shares arena statistics with confirmed friends.'}
                </p>
              </div>
            ) : (
              <>
                {/* Head-to-Head */}
                {profile.headToHead && profile.headToHead.gamesTogether > 0 && (
                  <div className="p-4 rounded-2xl bg-[#131722] border border-[#D4AF37]/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#D4AF37] font-bold">Head to Head Record</span>
                      <div className="text-sm font-display font-bold text-[#FAF8F5]">
                        {profile.headToHead.gamesTogether} Arena Matches Together
                      </div>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs font-bold">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                        {profile.headToHead.winsA} Won
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-500/30">
                        {profile.headToHead.winsB} Lost
                      </span>
                    </div>
                  </div>
                )}

                {/* Verified Stats Grid */}
                {profile.stats && (
                  <div>
                    <span className="block text-xs font-mono font-semibold uppercase text-[#A7A29A] mb-3">
                      Verified Career Metrics
                    </span>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-[#07080B] border border-white/10 text-center">
                        <Trophy className="w-4 h-4 text-[#D4AF37] mx-auto mb-1" />
                        <div className="text-base font-extrabold text-[#FAF8F5]">{profile.stats.winRate}%</div>
                        <div className="text-[10px] font-mono text-[#A7A29A]">Win Rate</div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#07080B] border border-white/10 text-center">
                        <Target className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                        <div className="text-base font-extrabold text-[#FAF8F5]">{profile.stats.exactGuesses}</div>
                        <div className="text-[10px] font-mono text-[#A7A29A]">Exact Guesses</div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#07080B] border border-white/10 text-center">
                        <Flame className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                        <div className="text-base font-extrabold text-[#FAF8F5]">{profile.stats.bestStreak}</div>
                        <div className="text-[10px] font-mono text-[#A7A29A]">Best Streak</div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#07080B] border border-white/10 text-center">
                        <Award className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                        <div className="text-base font-extrabold text-[#FAF8F5]">{profile.stats.totalPoints}</div>
                        <div className="text-[10px] font-mono text-[#A7A29A]">Career Points</div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#07080B] border border-white/10 text-center">
                        <Sparkles className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                        <div className="text-base font-extrabold text-[#FAF8F5]">{profile.stats.averageAccuracy}%</div>
                        <div className="text-[10px] font-mono text-[#A7A29A]">Avg Accuracy</div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#07080B] border border-white/10 text-center">
                        <div className="text-base font-extrabold text-[#FAF8F5] mt-1">{profile.stats.gamesPlayed}</div>
                        <div className="text-[10px] font-mono text-[#A7A29A] mt-2">Matches Played</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Matches */}
                {profile.recentMatches && profile.recentMatches.length > 0 && (
                  <div>
                    <span className="block text-xs font-mono font-semibold uppercase text-[#A7A29A] mb-3">
                      Recent Matches
                    </span>
                    <div className="space-y-2">
                      {profile.recentMatches.slice(0, 5).map((m) => (
                        <div
                          key={m.id}
                          className="p-3 rounded-xl bg-[#07080B] border border-white/5 flex items-center justify-between text-xs font-mono"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                m.isWin
                                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
                                  : 'bg-stone-800 text-stone-400 border border-stone-700'
                              }`}
                            >
                              {m.isWin ? 'VICTORY' : `RANK #${m.rank}`}
                            </span>
                            <span className="text-[#FAF8F5]">{m.finalScore} pts</span>
                          </div>
                          <div className="text-[#7A756D] text-[11px]">
                            {m.accuracy}% accuracy &bull; +{m.earnedXp} XP
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Report Player Section */}
            <div className="pt-2 border-t border-white/5">
              {!reportOpen ? (
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="text-xs font-mono text-stone-500 hover:text-rose-400 flex items-center gap-1.5 transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report Player for Abuse or Cheating</span>
                </button>
              ) : (
                <form onSubmit={handleSubmitReport} className="p-4 rounded-2xl bg-[#07080B] border border-rose-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-rose-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Submit Player Report</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setReportOpen(false)}
                      className="text-xs text-stone-500 hover:text-stone-300"
                    >
                      Cancel
                    </button>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-[#A7A29A] mb-1">Reason</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#131722] border border-white/10 text-xs font-mono text-[#FAF8F5]"
                    >
                      <option value="Abusive or inappropriate behavior">Abusive or inappropriate behavior</option>
                      <option value="Suspicion of cheating or collusion">Suspicion of cheating or collusion</option>
                      <option value="Inappropriate avatar or username">Inappropriate avatar or username</option>
                      <option value="Intentional AFK / griefing">Intentional AFK / griefing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-[#A7A29A] mb-1">Details (Optional)</label>
                    <textarea
                      rows={2}
                      maxLength={300}
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Provide additional context for arena moderators..."
                      className="w-full px-3 py-1.5 rounded-xl bg-[#131722] border border-white/10 text-xs font-mono text-[#FAF8F5] focus:outline-none focus:border-rose-500/50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={reportSubmitted}
                    className="w-full py-2 rounded-xl bg-rose-900/60 hover:bg-rose-800/60 border border-rose-500/40 text-xs font-mono font-bold text-rose-200 transition-all"
                  >
                    {reportSubmitted ? 'Report Submitted &bull; Thank you' : 'Submit Report'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

