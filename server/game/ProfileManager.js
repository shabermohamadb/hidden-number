// server/game/ProfileManager.js
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AntiCheat } from './AntiCheat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORAGE_FILE = path.resolve(__dirname, '../data/profiles_store.json');

// Master Achievement Definitions
export const ACHIEVEMENTS = [
  {
    id: 'FIRST_WIN',
    name: 'First Victory',
    description: 'Win your first multiplayer match in the mind arena.',
    category: 'victory',
    tier: 'bronze',
    xpReward: 100,
    rewardType: 'title',
    rewardId: 'Arena Victor',
    icon: 'Trophy',
    maxProgress: 1
  },
  {
    id: 'PERFECT_GUESS',
    name: 'Exact Deduction',
    description: 'Land an exact match deduction (0 difference) in any round.',
    category: 'deduction',
    tier: 'gold',
    xpReward: 150,
    rewardType: 'frame',
    rewardId: 'frame-gilded-laurel',
    icon: 'Target',
    maxProgress: 1
  },
  {
    id: 'WIN_STREAK_3',
    name: 'Untouchable',
    description: 'Win 3 arena matches consecutively without defeat.',
    category: 'streak',
    tier: 'gold',
    xpReward: 200,
    rewardType: 'title',
    rewardId: 'Untouchable',
    icon: 'Flame',
    maxProgress: 3
  },
  {
    id: 'POINTS_500',
    name: 'Point Centurion',
    description: 'Accumulate 500 cumulative points across matches.',
    category: 'mastery',
    tier: 'silver',
    xpReward: 175,
    rewardType: 'frame',
    rewardId: 'frame-obsidian-ring',
    icon: 'Award',
    maxProgress: 500
  },
  {
    id: 'VETERAN_10',
    name: 'Arena Veteran',
    description: 'Complete 10 full multiplayer matches in the arena.',
    category: 'mastery',
    tier: 'silver',
    xpReward: 150,
    rewardType: 'title',
    rewardId: 'Mind Arena Veteran',
    icon: 'Shield',
    maxProgress: 10
  },
  {
    id: 'ORACLE_5',
    name: 'Grand Oracle',
    description: 'Achieve 5 exact match deductions throughout your career.',
    category: 'deduction',
    tier: 'obsidian',
    xpReward: 300,
    rewardType: 'frame',
    rewardId: 'frame-celestial-sol',
    icon: 'Sparkles',
    maxProgress: 5
  },
  {
    id: 'SHARP_MIND',
    name: 'High Accuracy',
    description: 'Finish a match with an average accuracy rating of 95% or higher.',
    category: 'deduction',
    tier: 'gold',
    xpReward: 125,
    rewardType: 'title',
    rewardId: 'Cipher Master',
    icon: 'Zap',
    maxProgress: 1
  }
];

// Curated Cosmetics List
export const DEFAULT_FRAMES = [
  { id: 'frame-bronze', name: 'Muted Bronze', borderClass: 'border-[#C5A059]/40', glowClass: 'shadow-[#C5A059]/10' },
  { id: 'frame-stone', name: 'Charcoal Stone', borderClass: 'border-white/20', glowClass: 'shadow-white/5' },
  { id: 'frame-obsidian-ring', name: 'Obsidian Ring', borderClass: 'border-[#1E2538] ring-2 ring-[#D4AF37]/50', glowClass: 'shadow-[#D4AF37]/20' },
  { id: 'frame-gilded-laurel', name: 'Gilded Laurel', borderClass: 'border-[#D4AF37] ring-2 ring-[#F3E5AB]/60', glowClass: 'shadow-[#D4AF37]/35' },
  { id: 'frame-celestial-sol', name: 'Celestial Sol', borderClass: 'border-[#E5A83B] ring-2 ring-[#F5D061]', glowClass: 'shadow-[#E5A83B]/40 animate-pulse' }
];

export const DEFAULT_TITLES = [
  'Deduction Novice',
  'Number Seeker',
  'Arena Victor',
  'Cipher Master',
  'Mind Arena Veteran',
  'Untouchable',
  'Grand Oracle'
];

export class ProfileManager {
  constructor(storageFilePath = STORAGE_FILE) {
    this.storageFile = storageFilePath;
    this.profiles = new Map(); // playerId -> Profile
    this.usernameMap = new Map(); // lowercase username -> playerId
    this.friendships = new Map(); // friendshipId -> Friendship
    this.reports = [];
    this.onlineSockets = new Map(); // playerId -> Set<socketId>
    this.activePlayerRooms = new Map(); // playerId -> roomCode

    if (this.storageFile) {
      this.ensureStorageDir();
      this.loadFromDisk();
    }
  }

  ensureStorageDir() {
    if (!this.storageFile) return;
    try {
      const dir = path.dirname(this.storageFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch {
      // Ignore directory check failures in ephemeral environments
    }
  }

  loadFromDisk() {
    if (!this.storageFile) return;
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf-8');
        const data = JSON.parse(raw);
        if (data && Array.isArray(data.profiles)) {
          for (const p of data.profiles) {
            this.profiles.set(p.playerId, p);
            this.usernameMap.set(p.username.toLowerCase(), p.playerId);
          }
        }
        if (data && Array.isArray(data.friendships)) {
          for (const f of data.friendships) {
            this.friendships.set(f.id, f);
          }
        }
      }
    } catch (err) {
      console.warn('[ProfileManager] Could not load persisted profiles, using in-memory store:', err.message);
    }
  }

  saveToDisk() {
    if (!this.storageFile) return;
    try {
      const data = {
        profiles: Array.from(this.profiles.values()),
        friendships: Array.from(this.friendships.values()),
        savedAt: new Date().toISOString()
      };
      fs.writeFileSync(this.storageFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch {
      // Ephemeral disk writes may fail gracefully
    }
  }

  // ==========================================
  // XP & Level Progression Curves
  // ==========================================

  static calculateLevelInfo(totalXp = 0) {
    let level = 1;
    let xpRemaining = Math.max(0, totalXp);

    while (true) {
      const neededForNext = ProfileManager.xpNeededForLevel(level);
      if (xpRemaining >= neededForNext) {
        xpRemaining -= neededForNext;
        level += 1;
      } else {
        break;
      }
    }

    const nextLevelXp = ProfileManager.xpNeededForLevel(level);
    const progressPercent = Math.min(100, Math.round((xpRemaining / nextLevelXp) * 100));

    return {
      level,
      currentLevelXp: xpRemaining,
      nextLevelXp,
      progressPercent
    };
  }

  static xpNeededForLevel(level) {
    // Level 1: 100, Level 2: 150, Level 3: 225, Level 4: 320, etc.
    return Math.floor(100 + 40 * (level - 1) + 15 * Math.pow(level - 1, 1.4));
  }

  // ==========================================
  // Profile Retrieval & Initialization
  // ==========================================

  getOrCreateProfile(playerId, nickname = 'Player', avatar = 'avatar-1') {
    if (!playerId) {
      playerId = crypto.randomUUID();
    }

    let profile = this.profiles.get(playerId);
    if (!profile) {
      // Validate or generate username
      let cleanUsername = AntiCheat.sanitizeText(nickname) || `Player_${Math.floor(1000 + Math.random() * 9000)}`;
      cleanUsername = cleanUsername.slice(0, 20);

      // Ensure username uniqueness
      let uniqueUsername = cleanUsername;
      let counter = 1;
      while (this.usernameMap.has(uniqueUsername.toLowerCase())) {
        uniqueUsername = `${cleanUsername.slice(0, 16)}_${counter++}`;
      }

      const initialLevel = ProfileManager.calculateLevelInfo(0);

      profile = {
        playerId,
        username: uniqueUsername,
        avatar: avatar || 'avatar-1',
        customAvatar: null,
        title: 'Deduction Novice',
        frame: 'frame-bronze',
        badge: 'badge-first-blood',
        bio: 'Decoding minds in the digital arena.',
        xp: 0,
        level: initialLevel.level,
        stats: {
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          winRate: 0,
          totalPoints: 0,
          bestScore: 0,
          exactGuesses: 0,
          totalGuesses: 0,
          correctGuesses: 0,
          averageAccuracy: 0,
          currentStreak: 0,
          bestStreak: 0
        },
        unlockedCosmetics: {
          frames: ['frame-bronze', 'frame-stone'],
          titles: ['Deduction Novice', 'Number Seeker'],
          badges: ['badge-first-blood']
        },
        achievements: ACHIEVEMENTS.map(a => ({
          id: a.id,
          progress: 0,
          unlocked: false,
          unlockedAt: null
        })),
        matchHistory: [],
        blockedPlayerIds: [],
        settings: {
          visibility: 'public', // 'public', 'friends_only', 'private'
          notifications: true,
          reducedMotion: false,
          soundSfx: 80,
          soundMusic: 60
        },
        usernameUpdatedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.profiles.set(playerId, profile);
      this.usernameMap.set(uniqueUsername.toLowerCase(), playerId);
      this.saveToDisk();
    }

    return this.enrichProfileView(profile);
  }

  getProfile(playerId) {
    const profile = this.profiles.get(playerId);
    return profile ? this.enrichProfileView(profile) : null;
  }

  getProfileByUsername(username) {
    if (!username) return null;
    const pid = this.usernameMap.get(username.trim().toLowerCase());
    return pid ? this.getProfile(pid) : null;
  }

  enrichProfileView(rawProfile) {
    const levelInfo = ProfileManager.calculateLevelInfo(rawProfile.xp || 0);
    const friends = this.getFriendsList(rawProfile.playerId);

    return {
      ...rawProfile,
      level: levelInfo.level,
      currentLevelXp: levelInfo.currentLevelXp,
      nextLevelXp: levelInfo.nextLevelXp,
      levelProgressPercent: levelInfo.progressPercent,
      friendCount: friends.length,
      isOnline: this.isPlayerOnline(rawProfile.playerId),
      currentRoomCode: this.activePlayerRooms.get(rawProfile.playerId) || null
    };
  }

  // ==========================================
  // Profile Updates & Validation
  // ==========================================

  updateProfile(playerId, updates = {}) {
    const profile = this.profiles.get(playerId);
    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }

    const {
      username,
      avatar,
      customAvatar,
      title,
      frame,
      bio,
      settings
    } = updates;

    // 1. Username validation & uniqueness
    if (username && username.trim() !== profile.username) {
      const cleanUsername = username.trim();
      
      // Length check
      if (cleanUsername.length < 3 || cleanUsername.length > 20) {
        return { success: false, error: 'Username must be between 3 and 20 characters' };
      }

      // Allowed characters check (alphanumeric, underscore, hyphen)
      if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
        return { success: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
      }

      // Cooldown check (max once per 60 seconds)
      if (profile.usernameUpdatedAt) {
        const timeSince = Date.now() - new Date(profile.usernameUpdatedAt).getTime();
        const COOLDOWN_MS = 60 * 1000;
        if (timeSince < COOLDOWN_MS) {
          const remainingSec = Math.ceil((COOLDOWN_MS - timeSince) / 1000);
          return { success: false, error: `Username can be changed again in ${remainingSec}s` };
        }
      }

      // Uniqueness check
      const lower = cleanUsername.toLowerCase();
      const existingOwner = this.usernameMap.get(lower);
      if (existingOwner && existingOwner !== playerId) {
        return { success: false, error: 'This username is already taken by another player' };
      }

      // Update username map
      this.usernameMap.delete(profile.username.toLowerCase());
      this.usernameMap.set(lower, playerId);
      profile.username = cleanUsername;
      profile.usernameUpdatedAt = new Date().toISOString();
    }

    // 2. Avatar validation
    if (avatar && typeof avatar === 'string') {
      profile.avatar = avatar;
    }

    // 3. Custom Avatar upload validation
    if (customAvatar !== undefined) {
      if (customAvatar === null) {
        profile.customAvatar = null;
      } else if (typeof customAvatar === 'string') {
        // Validate Base64 / Data URI
        const isDataUri = customAvatar.startsWith('data:image/');
        if (!isDataUri) {
          return { success: false, error: 'Invalid avatar image format' };
        }

        // Validate allowed mime types
        const match = customAvatar.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,/);
        if (!match) {
          return { success: false, error: 'Only PNG, JPEG, WebP, and GIF images are permitted' };
        }

        // Validate maximum size (2MB limit = ~2.8MB base64)
        if (customAvatar.length > 2.8 * 1024 * 1024) {
          return { success: false, error: 'Avatar image must be under 2MB in size' };
        }

        profile.customAvatar = customAvatar;
      }
    }

    // 4. Bio validation
    if (typeof bio === 'string') {
      profile.bio = AntiCheat.sanitizeText(bio).slice(0, 160);
    }

    // 5. Title & Frame selection validation
    if (title && profile.unlockedCosmetics.titles.includes(title)) {
      profile.title = title;
    }
    if (frame && profile.unlockedCosmetics.frames.includes(frame)) {
      profile.frame = frame;
    }

    // 6. Settings updates
    if (settings && typeof settings === 'object') {
      if (['public', 'friends_only', 'private'].includes(settings.visibility)) {
        profile.settings.visibility = settings.visibility;
      }
      if (typeof settings.notifications === 'boolean') {
        profile.settings.notifications = settings.notifications;
      }
      if (typeof settings.reducedMotion === 'boolean') {
        profile.settings.reducedMotion = settings.reducedMotion;
      }
      if (typeof settings.soundSfx === 'number') {
        profile.settings.soundSfx = Math.max(0, Math.min(100, settings.soundSfx));
      }
      if (typeof settings.soundMusic === 'number') {
        profile.settings.soundMusic = Math.max(0, Math.min(100, settings.soundMusic));
      }
    }

    profile.updatedAt = new Date().toISOString();
    this.saveToDisk();

    return {
      success: true,
      profile: this.enrichProfileView(profile)
    };
  }

  // ==========================================
  // Server-Authoritative Match Results Processing
  // ==========================================

  recordMatchResult(matchData) {
    const {
      matchId,
      roomCode,
      results, // { roundScores: [...], matchWinner, roundNumber, totalRounds }
      timestamp = Date.now()
    } = matchData;

    if (!matchId || !results || !Array.isArray(results.roundScores)) {
      return { success: false, error: 'Invalid match result structure' };
    }

    const processedPlayers = [];

    // Sort scores to determine authoritative final ranks
    const sorted = [...results.roundScores].sort((a, b) => b.cumulativeScore - a.cumulativeScore);

    for (let i = 0; i < sorted.length; i++) {
      const scoreEntry = sorted[i];
      const playerId = scoreEntry.playerId;
      const rank = i + 1;
      const isWinner = rank === 1;

      const profile = this.profiles.get(playerId);
      if (!profile) continue;

      // Idempotency check: don't count duplicate matchId
      const alreadyRecorded = profile.matchHistory.some(m => m.matchId === matchId);
      if (alreadyRecorded) continue;

      // Calculate match stats
      const stats = profile.stats;
      stats.gamesPlayed += 1;
      if (isWinner) {
        stats.wins += 1;
        stats.currentStreak += 1;
        stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
      } else {
        stats.losses += 1;
        stats.currentStreak = 0;
      }

      stats.totalPoints += scoreEntry.cumulativeScore;
      stats.bestScore = Math.max(stats.bestScore, scoreEntry.cumulativeScore);

      if (scoreEntry.isExact) {
        stats.exactGuesses += 1;
      }

      // Accuracy averaging
      const matchAccuracy = scoreEntry.accuracy ?? Math.max(0, 100 - (scoreEntry.difference || 0));
      stats.averageAccuracy = Math.round(
        ((stats.averageAccuracy * (stats.gamesPlayed - 1)) + matchAccuracy) / stats.gamesPlayed
      );
      stats.winRate = Math.round((stats.wins / stats.gamesPlayed) * 100);

      // Award authoritative XP
      let earnedXp = 60; // Base match completion XP
      if (isWinner) earnedXp += 120;
      if (rank <= 3 && sorted.length > 3) earnedXp += 30;
      if (scoreEntry.isExact) earnedXp += 40;

      profile.xp += earnedXp;

      // Record match history entry
      const opponents = sorted
        .filter(s => s.playerId !== playerId)
        .map(s => ({
          playerId: s.playerId,
          nickname: s.nickname,
          avatar: s.avatar,
          score: s.cumulativeScore
        }));

      const matchRecord = {
        id: crypto.randomUUID(),
        matchId,
        roomCode,
        rank,
        totalPlayers: sorted.length,
        finalScore: scoreEntry.cumulativeScore,
        accuracy: matchAccuracy,
        exactGuesses: scoreEntry.isExact ? 1 : 0,
        isWin: isWinner,
        opponents,
        earnedXp,
        playedAt: new Date(timestamp).toISOString()
      };

      profile.matchHistory.unshift(matchRecord);
      // Keep last 30 matches
      if (profile.matchHistory.length > 30) {
        profile.matchHistory.pop();
      }

      // Check Achievements
      const newlyUnlocked = this.evaluateAchievements(profile, {
        isWinner,
        scoreEntry,
        matchAccuracy,
        rank
      });

      profile.updatedAt = new Date().toISOString();
      processedPlayers.push({
        playerId,
        earnedXp,
        newLevel: ProfileManager.calculateLevelInfo(profile.xp).level,
        newlyUnlocked
      });
    }

    this.saveToDisk();
    return { success: true, processedPlayers };
  }

  evaluateAchievements(profile, context) {
    const newlyUnlocked = [];
    const stats = profile.stats;

    for (const achDef of ACHIEVEMENTS) {
      let userAch = profile.achievements.find(a => a.id === achDef.id);
      if (!userAch) {
        userAch = { id: achDef.id, progress: 0, unlocked: false, unlockedAt: null };
        profile.achievements.push(userAch);
      }

      if (userAch.unlocked) continue;

      let progress = userAch.progress;
      let shouldUnlock = false;

      switch (achDef.id) {
        case 'FIRST_WIN':
          progress = stats.wins;
          shouldUnlock = stats.wins >= 1;
          break;
        case 'PERFECT_GUESS':
          progress = stats.exactGuesses;
          shouldUnlock = stats.exactGuesses >= 1;
          break;
        case 'WIN_STREAK_3':
          progress = stats.currentStreak;
          shouldUnlock = stats.currentStreak >= 3;
          break;
        case 'POINTS_500':
          progress = stats.totalPoints;
          shouldUnlock = stats.totalPoints >= 500;
          break;
        case 'VETERAN_10':
          progress = stats.gamesPlayed;
          shouldUnlock = stats.gamesPlayed >= 10;
          break;
        case 'ORACLE_5':
          progress = stats.exactGuesses;
          shouldUnlock = stats.exactGuesses >= 5;
          break;
        case 'SHARP_MIND':
          progress = context.matchAccuracy >= 95 ? 1 : 0;
          shouldUnlock = context.matchAccuracy >= 95;
          break;
      }

      userAch.progress = Math.min(achDef.maxProgress, progress);

      if (shouldUnlock) {
        userAch.unlocked = true;
        userAch.unlockedAt = new Date().toISOString();
        profile.xp += achDef.xpReward;

        // Unlock reward cosmetic
        if (achDef.rewardType === 'title' && !profile.unlockedCosmetics.titles.includes(achDef.rewardId)) {
          profile.unlockedCosmetics.titles.push(achDef.rewardId);
        } else if (achDef.rewardType === 'frame' && !profile.unlockedCosmetics.frames.includes(achDef.rewardId)) {
          profile.unlockedCosmetics.frames.push(achDef.rewardId);
        }

        newlyUnlocked.push({
          id: achDef.id,
          name: achDef.name,
          rewardType: achDef.rewardType,
          rewardId: achDef.rewardId
        });
      }
    }

    return newlyUnlocked;
  }

  // ==========================================
  // Public Profile Queries
  // ==========================================

  getPublicProfile(requesterPlayerId, targetPlayerId) {
    const target = this.profiles.get(targetPlayerId);
    if (!target) return null;

    const visibility = target.settings?.visibility || 'public';
    const isOwner = requesterPlayerId === targetPlayerId;
    const isFriend = this.areFriends(requesterPlayerId, targetPlayerId);

    // Enforce privacy settings
    if (!isOwner) {
      if (visibility === 'private') {
        return {
          playerId: target.playerId,
          username: target.username,
          avatar: target.avatar,
          customAvatar: target.customAvatar,
          title: target.title,
          frame: target.frame,
          level: ProfileManager.calculateLevelInfo(target.xp).level,
          isPrivate: true
        };
      }
      if (visibility === 'friends_only' && !isFriend) {
        return {
          playerId: target.playerId,
          username: target.username,
          avatar: target.avatar,
          customAvatar: target.customAvatar,
          title: target.title,
          frame: target.frame,
          level: ProfileManager.calculateLevelInfo(target.xp).level,
          isFriendsOnly: true
        };
      }
    }

    const enriched = this.enrichProfileView(target);

    // Compute Head-to-Head record if requested by another player
    let headToHead = null;
    if (requesterPlayerId && !isOwner) {
      headToHead = this.computeHeadToHead(requesterPlayerId, targetPlayerId);
    }

    return {
      playerId: enriched.playerId,
      username: enriched.username,
      avatar: enriched.avatar,
      customAvatar: enriched.customAvatar,
      title: enriched.title,
      frame: enriched.frame,
      badge: enriched.badge,
      bio: enriched.bio,
      level: enriched.level,
      xp: enriched.xp,
      currentLevelXp: enriched.currentLevelXp,
      nextLevelXp: enriched.nextLevelXp,
      levelProgressPercent: enriched.levelProgressPercent,
      stats: enriched.stats,
      unlockedAchievementsCount: enriched.achievements.filter(a => a.unlocked).length,
      recentMatches: enriched.matchHistory.slice(0, 10),
      isOnline: enriched.isOnline,
      currentRoomCode: enriched.currentRoomCode,
      createdAt: enriched.createdAt,
      isFriend,
      headToHead
    };
  }

  searchPlayers(query, requesterPlayerId, limit = 8) {
    if (!query || query.trim().length < 2) return [];
    const q = query.trim().toLowerCase();
    const results = [];

    for (const [pid, p] of this.profiles) {
      if (pid === requesterPlayerId) continue;
      if (p.blockedPlayerIds?.includes(requesterPlayerId)) continue;

      if (p.username.toLowerCase().includes(q) || p.playerId.toLowerCase().includes(q)) {
        results.push({
          playerId: p.playerId,
          username: p.username,
          avatar: p.avatar,
          customAvatar: p.customAvatar,
          title: p.title,
          frame: p.frame,
          level: ProfileManager.calculateLevelInfo(p.xp).level,
          isOnline: this.isPlayerOnline(p.playerId),
          isFriend: this.areFriends(requesterPlayerId, p.playerId)
        });
      }

      if (results.length >= limit) break;
    }

    return results;
  }

  computeHeadToHead(playerAId, playerBId) {
    const profileA = this.profiles.get(playerAId);
    if (!profileA) return { gamesTogether: 0, winsA: 0, winsB: 0 };

    let gamesTogether = 0;
    let winsA = 0;
    let winsB = 0;

    for (const match of profileA.matchHistory) {
      const bInMatch = match.opponents?.find(o => o.playerId === playerBId);
      if (bInMatch) {
        gamesTogether += 1;
        if (match.rank === 1) winsA += 1;
        else if (bInMatch.score > match.finalScore) winsB += 1;
      }
    }

    return { gamesTogether, winsA, winsB };
  }

  // ==========================================
  // Social: Friends & Blocking
  // ==========================================

  sendFriendRequest(requesterPlayerId, targetPlayerId) {
    if (requesterPlayerId === targetPlayerId) {
      return { success: false, error: 'Cannot send a friend request to yourself' };
    }

    const target = this.profiles.get(targetPlayerId);
    if (!target) return { success: false, error: 'Target player not found' };

    if (target.blockedPlayerIds?.includes(requesterPlayerId)) {
      return { success: false, error: 'Unable to send friend request' };
    }

    // Check existing friendship / request
    const pairId = [requesterPlayerId, targetPlayerId].sort().join(':');
    let friendship = this.friendships.get(pairId);

    if (friendship) {
      if (friendship.status === 'accepted') {
        return { success: false, error: 'Already friends with this player' };
      }
      if (friendship.status === 'pending') {
        if (friendship.senderId === requesterPlayerId) {
          return { success: false, error: 'Friend request already sent' };
        } else {
          // Both sent request: automatically accept!
          friendship.status = 'accepted';
          friendship.updatedAt = new Date().toISOString();
          this.saveToDisk();
          return { success: true, status: 'accepted' };
        }
      }
    }

    friendship = {
      id: pairId,
      user1: requesterPlayerId,
      user2: targetPlayerId,
      senderId: requesterPlayerId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.friendships.set(pairId, friendship);
    this.saveToDisk();

    return { success: true, status: 'pending' };
  }

  respondFriendRequest(playerId, senderPlayerId, accept = true) {
    const pairId = [playerId, senderPlayerId].sort().join(':');
    const friendship = this.friendships.get(pairId);

    if (!friendship || friendship.status !== 'pending' || friendship.senderId !== senderPlayerId) {
      return { success: false, error: 'No active friend request found' };
    }

    if (accept) {
      friendship.status = 'accepted';
      friendship.updatedAt = new Date().toISOString();
    } else {
      this.friendships.delete(pairId);
    }

    this.saveToDisk();
    return { success: true, status: accept ? 'accepted' : 'rejected' };
  }

  removeFriend(playerId, friendPlayerId) {
    const pairId = [playerId, friendPlayerId].sort().join(':');
    if (this.friendships.has(pairId)) {
      this.friendships.delete(pairId);
      this.saveToDisk();
      return { success: true };
    }
    return { success: false, error: 'Friendship record not found' };
  }

  blockPlayer(playerId, targetPlayerId) {
    if (playerId === targetPlayerId) return { success: false, error: 'Cannot block yourself' };
    const profile = this.profiles.get(playerId);
    if (!profile) return { success: false, error: 'Profile not found' };

    // Remove any friendship
    const pairId = [playerId, targetPlayerId].sort().join(':');
    this.friendships.delete(pairId);

    if (!profile.blockedPlayerIds) profile.blockedPlayerIds = [];
    if (!profile.blockedPlayerIds.includes(targetPlayerId)) {
      profile.blockedPlayerIds.push(targetPlayerId);
    }

    this.saveToDisk();
    return { success: true };
  }

  unblockPlayer(playerId, targetPlayerId) {
    const profile = this.profiles.get(playerId);
    if (!profile) return { success: false, error: 'Profile not found' };

    profile.blockedPlayerIds = (profile.blockedPlayerIds || []).filter(id => id !== targetPlayerId);
    this.saveToDisk();
    return { success: true };
  }

  areFriends(playerA, playerB) {
    if (!playerA || !playerB) return false;
    const pairId = [playerA, playerB].sort().join(':');
    const f = this.friendships.get(pairId);
    return f?.status === 'accepted';
  }

  getFriendsList(playerId) {
    const friends = [];

    for (const f of this.friendships.values()) {
      if (f.status === 'accepted' && (f.user1 === playerId || f.user2 === playerId)) {
        const friendId = f.user1 === playerId ? f.user2 : f.user1;
        const friendProfile = this.profiles.get(friendId);
        if (friendProfile) {
          friends.push({
            playerId: friendProfile.playerId,
            username: friendProfile.username,
            avatar: friendProfile.avatar,
            customAvatar: friendProfile.customAvatar,
            title: friendProfile.title,
            frame: friendProfile.frame,
            level: ProfileManager.calculateLevelInfo(friendProfile.xp).level,
            isOnline: this.isPlayerOnline(friendId),
            currentRoomCode: this.activePlayerRooms.get(friendId) || null
          });
        }
      }
    }

    return friends;
  }

  getFriendRequests(playerId) {
    const incoming = [];
    const outgoing = [];

    for (const f of this.friendships.values()) {
      if (f.status === 'pending') {
        if (f.senderId === playerId) {
          const targetId = f.user1 === playerId ? f.user2 : f.user1;
          const target = this.profiles.get(targetId);
          if (target) {
            outgoing.push({
              playerId: target.playerId,
              username: target.username,
              avatar: target.avatar,
              level: ProfileManager.calculateLevelInfo(target.xp).level,
              sentAt: f.createdAt
            });
          }
        } else if (f.user1 === playerId || f.user2 === playerId) {
          const sender = this.profiles.get(f.senderId);
          if (sender) {
            incoming.push({
              playerId: sender.playerId,
              username: sender.username,
              avatar: sender.avatar,
              level: ProfileManager.calculateLevelInfo(sender.xp).level,
              sentAt: f.createdAt
            });
          }
        }
      }
    }

    return { incoming, outgoing };
  }

  // ==========================================
  // Presence & Socket Connection Tracking
  // ==========================================

  registerPlayerSocket(playerId, socketId) {
    if (!this.onlineSockets.has(playerId)) {
      this.onlineSockets.set(playerId, new Set());
    }
    this.onlineSockets.get(playerId).add(socketId);
  }

  unregisterPlayerSocket(playerId, socketId) {
    if (this.onlineSockets.has(playerId)) {
      const set = this.onlineSockets.get(playerId);
      set.delete(socketId);
      if (set.size === 0) {
        this.onlineSockets.delete(playerId);
        this.activePlayerRooms.delete(playerId);
      }
    }
  }

  setPlayerRoom(playerId, roomCode) {
    if (roomCode) {
      this.activePlayerRooms.set(playerId, roomCode);
    } else {
      this.activePlayerRooms.delete(playerId);
    }
  }

  isPlayerOnline(playerId) {
    const sockets = this.onlineSockets.get(playerId);
    return Boolean(sockets && sockets.size > 0);
  }

  // ==========================================
  // Reporting & Abuse Prevention
  // ==========================================

  reportPlayer(reporterPlayerId, reportedPlayerId, reason, details = '') {
    if (reporterPlayerId === reportedPlayerId) {
      return { success: false, error: 'Cannot report yourself' };
    }

    const report = {
      id: crypto.randomUUID(),
      reporterId: reporterPlayerId,
      reportedId: reportedPlayerId,
      reason: AntiCheat.sanitizeText(reason).slice(0, 64),
      details: AntiCheat.sanitizeText(details).slice(0, 500),
      createdAt: new Date().toISOString()
    };

    this.reports.push(report);
    return { success: true };
  }

  // ==========================================
  // Account Deletion & Reset
  // ==========================================

  deleteAccount(playerId) {
    const profile = this.profiles.get(playerId);
    if (!profile) return { success: false, error: 'Account not found' };

    // Clean username map
    this.usernameMap.delete(profile.username.toLowerCase());
    
    // Clean friendships
    for (const [k, f] of this.friendships) {
      if (f.user1 === playerId || f.user2 === playerId) {
        this.friendships.delete(k);
      }
    }

    this.profiles.delete(playerId);
    this.onlineSockets.delete(playerId);
    this.activePlayerRooms.delete(playerId);
    this.saveToDisk();

    return { success: true };
  }
}
