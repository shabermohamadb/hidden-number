// src/types/game.ts

export type GamePhase = 'LOBBY' | 'QUESTION_PHASE' | 'GUESSING_PHASE' | 'RESULTS' | 'COMPLETED';

export interface Player {
  id: string;
  nickname: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  connected: boolean;
  cumulativeScore: number;
  secretNumber: number | null; // null for current player during active gameplay
  isSecret?: boolean;
  hasGuessed?: boolean;
}

export interface RoomSettings {
  minPlayers: number;
  maxPlayers: number;
  questionTime: number; // in seconds, default 60
  guessTime: number;    // in seconds, default 15
  numberRange: [number, number]; // default [1, 100]
  totalRounds: number;  // default 3
  visibility: 'public' | 'private';
  password?: string | null;
}

export interface Answer {
  id: string;
  questionId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  answer: string;
  targetPlayerId: string;
  timestamp: number;
}

export interface GameMessage {
  id: string;
  type: 'question' | 'system';
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  targetPlayerId?: string;
  content: string;
  timestamp: number;
  answers?: Answer[];
}

export interface RoundScore {
  playerId: string;
  nickname: string;
  avatar: string;
  secretNumber: number;
  submittedGuess: number | null;
  difference: number | null;
  accuracy: number;
  roundPoints: number;
  cumulativeScore: number;
  isExact: boolean;
  isFirstExact: boolean;
  hasGuessed: boolean;
}

export interface GameResults {
  roundNumber: number;
  totalRounds: number;
  isMatchOver: boolean;
  roundScores: RoundScore[];
  matchWinner: RoundScore | null;
}

export interface GameState {
  roomCode: string;
  hostId: string;
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  settings: RoomSettings;
  players: Player[];
  myPlayerId: string;
  remainingSeconds: number;
  deadlines: {
    questionDeadline: number | null;
    guessDeadline: number | null;
    serverTime: number;
  } | null;
  messages: GameMessage[];
  mySubmittedGuess: number | null;
  results: GameResults | null;
}

export interface UserStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  totalPoints: number;
  bestScore: number;
  exactGuesses: number;
  totalGuesses: number;
  correctGuesses: number;
  averageAccuracy: number;
  currentStreak: number;
  bestStreak: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'obsidian';
  xpReward: number;
  rewardType: 'title' | 'frame' | 'badge';
  rewardId: string;
  icon: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface MatchRecord {
  id: string;
  matchId: string;
  roomCode: string;
  rank: number;
  totalPlayers: number;
  finalScore: number;
  accuracy: number;
  exactGuesses: number;
  isWin: boolean;
  opponents: Array<{
    playerId: string;
    nickname: string;
    avatar: string;
    score: number;
  }>;
  earnedXp: number;
  playedAt: string;
}

export interface UserCosmetics {
  frames: string[];
  titles: string[];
  badges: string[];
}

export interface UserSettings {
  visibility: 'public' | 'friends_only' | 'private';
  notifications: boolean;
  reducedMotion: boolean;
  soundSfx: number;
  soundMusic: number;
}

export interface UserProfile {
  playerId: string;
  username: string;
  avatar: string;
  customAvatar: string | null;
  title: string;
  frame: string;
  badge: string;
  bio: string;
  xp: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  levelProgressPercent: number;
  stats: UserStats;
  unlockedCosmetics: UserCosmetics;
  achievements: Achievement[];
  matchHistory: MatchRecord[];
  settings: UserSettings;
  createdAt: string;
  updatedAt: string;
  friendCount?: number;
  isOnline?: boolean;
  currentRoomCode?: string | null;
}

export interface PublicUserProfile {
  playerId: string;
  username: string;
  avatar: string;
  customAvatar?: string | null;
  title?: string;
  frame?: string;
  badge?: string;
  bio?: string;
  level: number;
  xp?: number;
  currentLevelXp?: number;
  nextLevelXp?: number;
  levelProgressPercent?: number;
  stats?: UserStats;
  unlockedAchievementsCount?: number;
  recentMatches?: MatchRecord[];
  isOnline?: boolean;
  currentRoomCode?: string | null;
  isFriend?: boolean;
  isPrivate?: boolean;
  isFriendsOnly?: boolean;
  headToHead?: {
    gamesTogether: number;
    winsA: number;
    winsB: number;
  } | null;
}

export interface FriendSummary {
  playerId: string;
  username: string;
  avatar: string;
  customAvatar?: string | null;
  title?: string;
  frame?: string;
  level: number;
  isOnline: boolean;
  currentRoomCode?: string | null;
}

export interface FriendRequest {
  playerId: string;
  username: string;
  avatar: string;
  level: number;
  sentAt: string;
}

