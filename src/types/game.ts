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

export interface UserProfile {
  id: string;
  nickname: string;
  avatar: string;
  gamesPlayed: number;
  wins: number;
  totalPoints: number;
  exactGuesses: number;
  accuracyRate: number;
}

