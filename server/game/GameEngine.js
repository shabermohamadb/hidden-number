// server/game/GameEngine.js
import crypto from 'crypto';
import { AntiCheat } from './AntiCheat.js';

export const GamePhase = {
  LOBBY: 'LOBBY',
  QUESTION_PHASE: 'QUESTION_PHASE',
  GUESSING_PHASE: 'GUESSING_PHASE',
  RESULTS: 'RESULTS',
  COMPLETED: 'COMPLETED'
};

export class GameEngine {
  constructor(roomCode, hostId, settings = {}, io) {
    this.roomCode = roomCode;
    this.hostId = hostId;
    this.io = io;
    this.antiCheat = new AntiCheat();

    // Configurable Settings with defaults
    this.settings = {
      minPlayers: settings.minPlayers || 3,
      maxPlayers: settings.maxPlayers || 10,
      questionTime: settings.questionTime || 60, // 60s
      guessTime: settings.guessTime || 15,       // 15s
      numberRange: settings.numberRange || [1, 100],
      totalRounds: settings.totalRounds || 3,
      visibility: settings.visibility || 'public', // 'public' | 'private'
      password: settings.password || null
    };

    this.phase = GamePhase.LOBBY;
    this.currentRound = 0;
    this.players = new Map(); // playerId -> PlayerData
    this.cumulativeScores = new Map(); // playerId -> number
    this.exactGuessCounts = new Map(); // playerId -> number
    this.roundData = null;
    this.messages = []; // list of Q&A and system events
    this.timer = null;
    this.createdAt = Date.now();
    this.lastActiveAt = Date.now();
  }

  /**
   * Adds or reconnects a player to the room
   */
  addPlayer(playerId, nickname, avatar = 'avatar-1', socketId = null) {
    this.lastActiveAt = Date.now();
    const existing = this.players.get(playerId);
    if (existing) {
      existing.connected = true;
      existing.socketId = socketId;
      existing.nickname = nickname || existing.nickname;
      existing.avatar = avatar || existing.avatar;
      return { success: true, player: existing, reconnected: true };
    }

    if (this.players.size >= this.settings.maxPlayers) {
      return { success: false, error: 'Room is full' };
    }

    if (this.phase !== GamePhase.LOBBY) {
      return { success: false, error: 'Game is currently in progress' };
    }

    const isHost = this.players.size === 0 || playerId === this.hostId;
    if (isHost) this.hostId = playerId;

    const newPlayer = {
      id: playerId,
      socketId,
      nickname: AntiCheat.sanitizeText(nickname) || `Player_${playerId.slice(0, 4)}`,
      avatar,
      isHost,
      isReady: isHost, // Host defaults to ready
      connected: true,
      joinedAt: Date.now()
    };

    this.players.set(playerId, newPlayer);
    if (!this.cumulativeScores.has(playerId)) {
      this.cumulativeScores.set(playerId, 0);
      this.exactGuessCounts.set(playerId, 0);
    }

    return { success: true, player: newPlayer, reconnected: false };
  }

  /**
   * Removes or disconnects a player
   */
  removePlayer(playerId) {
    this.lastActiveAt = Date.now();
    const player = this.players.get(playerId);
    if (!player) return null;

    this.antiCheat.removePlayer(playerId);

    if (this.phase === GamePhase.LOBBY) {
      this.players.delete(playerId);
      this.cumulativeScores.delete(playerId);
      this.exactGuessCounts.delete(playerId);
    } else {
      player.connected = false;
      player.socketId = null;
    }

    // Host migration if host left
    let newHostId = null;
    if (this.hostId === playerId) {
      const activePlayers = Array.from(this.players.values()).filter(p => p.connected);
      if (activePlayers.length > 0) {
        newHostId = activePlayers[0].id;
        this.hostId = newHostId;
        activePlayers[0].isHost = true;
      }
    }

    // If all players left in active game, terminate timer
    const remainingActive = Array.from(this.players.values()).filter(p => p.connected);
    if (remainingActive.length === 0 && this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    return { player, newHostId, remainingCount: this.players.size };
  }

  /**
   * Toggle player ready state in lobby
   */
  setPlayerReady(playerId, isReady) {
    const player = this.players.get(playerId);
    if (!player || this.phase !== GamePhase.LOBBY) return false;
    player.isReady = !!isReady;
    this.lastActiveAt = Date.now();
    return true;
  }

  /**
   * Check if game can start
   */
  canStartGame(requestingPlayerId) {
    if (requestingPlayerId !== this.hostId) {
      return { canStart: false, error: 'Only the host can start the game' };
    }
    const connectedPlayers = Array.from(this.players.values()).filter(p => p.connected);
    if (connectedPlayers.length < this.settings.minPlayers) {
      return {
        canStart: false,
        error: `At least ${this.settings.minPlayers} connected players required to start (currently ${connectedPlayers.length})`
      };
    }
    // Check if non-host players are ready
    const unreadyPlayers = connectedPlayers.filter(p => !p.isReady);
    if (unreadyPlayers.length > 0) {
      return {
        canStart: false,
        error: `Waiting for all players to be ready (${unreadyPlayers.map(p => p.nickname).join(', ')})`
      };
    }
    return { canStart: true };
  }

  /**
   * Generates unique cryptographic random numbers for each player
   */
  generateSecretNumbers() {
    const [min, max] = this.settings.numberRange;
    const count = this.players.size;
    const poolSize = max - min + 1;
    if (count > poolSize) {
      throw new Error('Number range is too small for player count');
    }

    const assigned = new Map();
    const usedNumbers = new Set();

    for (const [playerId] of this.players) {
      let num;
      do {
        // Cryptographically secure integer generation [min, max]
        num = crypto.randomInt(min, max + 1);
      } while (usedNumbers.has(num));
      usedNumbers.add(num);
      assigned.set(playerId, num);
    }

    return assigned;
  }

  /**
   * Starts a new round
   */
  startRound(roundNumber = 1) {
    this.currentRound = roundNumber;
    this.phase = GamePhase.QUESTION_PHASE;
    this.messages = [];
    this.lastActiveAt = Date.now();

    const secretNumbers = this.generateSecretNumbers();
    const startTime = Date.now();
    const questionDeadline = startTime + (this.settings.questionTime * 1000);

    this.roundData = {
      roundNumber: this.currentRound,
      secretNumbers, // SERVER-AUTHORITATIVE ONLY. Never sent to its owner!
      guesses: new Map(), // playerId -> { guess, timestamp }
      startTime,
      questionDeadline,
      guessDeadline: null,
      firstExactPlayerId: null,
      results: null
    };

    // Broadcast system message
    this.addSystemMessage(`Round ${this.currentRound} has begun! You have ${this.settings.questionTime}s to ask questions.`);

    // Schedule question phase completion
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.transitionToGuessingPhase();
    }, this.settings.questionTime * 1000);

    return this.roundData;
  }

  /**
   * Transitions from Question Phase to Guessing Phase
   */
  transitionToGuessingPhase() {
    if (this.phase !== GamePhase.QUESTION_PHASE) return;
    this.phase = GamePhase.GUESSING_PHASE;
    const startTime = Date.now();
    const guessDeadline = startTime + (this.settings.guessTime * 1000);
    this.roundData.guessDeadline = guessDeadline;
    this.lastActiveAt = Date.now();

    this.addSystemMessage(`Time's up! Submit your final guess (1-${this.settings.numberRange[1]}). You have ${this.settings.guessTime}s.`);

    // Broadcast phase change to all players
    this.broadcastTailoredState();

    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.finalizeResults();
    }, this.settings.guessTime * 1000);
  }

  /**
   * Submits a player's private guess
   */
  submitGuess(playerId, rawGuess) {
    if (this.phase !== GamePhase.GUESSING_PHASE) {
      return { success: false, error: 'Not currently in guessing phase' };
    }

    // Check deadline with small 1.5s grace window for network lag
    if (Date.now() > this.roundData.guessDeadline + 1500) {
      return { success: false, error: 'Guessing deadline has expired' };
    }

    const player = this.players.get(playerId);
    if (!player) {
      return { success: false, error: 'Player not in room' };
    }

    if (this.roundData.guesses.has(playerId)) {
      return { success: false, error: 'You have already submitted your guess for this round' };
    }

    const validation = AntiCheat.validateGuess(rawGuess);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const timestamp = Date.now();
    const guess = validation.value;

    this.roundData.guesses.set(playerId, {
      guess,
      timestamp
    });

    // Check if this guess is exact and first
    const secret = this.roundData.secretNumbers.get(playerId);
    if (secret === guess && !this.roundData.firstExactPlayerId) {
      this.roundData.firstExactPlayerId = playerId;
    }

    this.lastActiveAt = Date.now();

    // Broadcast that player has guessed (WITHOUT revealing their guess number!)
    if (this.io) {
      this.io.to(this.roomCode).emit('game:player-guessed', {
        playerId,
        hasGuessed: true
      });
    }

    // If all connected players have submitted, immediately transition to results!
    const connectedPlayers = Array.from(this.players.values()).filter(p => p.connected);
    const allGuessed = connectedPlayers.every(p => this.roundData.guesses.has(p.id));
    if (allGuessed) {
      if (this.timer) clearTimeout(this.timer);
      this.finalizeResults();
    }

    return { success: true, guess };
  }

  /**
   * Finalizes the round results and calculates scores
   */
  finalizeResults() {
    if (this.phase === GamePhase.RESULTS || this.phase === GamePhase.COMPLETED) return;
    this.phase = GamePhase.RESULTS;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.lastActiveAt = Date.now();

    const roundScores = [];

    for (const [playerId, player] of this.players) {
      const secret = this.roundData.secretNumbers.get(playerId) ?? 0;
      const guessEntry = this.roundData.guesses.get(playerId);
      const submittedGuess = guessEntry ? guessEntry.guess : null;

      let difference = null;
      let points = 0;
      let isExact = false;
      let isFirstExact = false;
      let accuracy = 0;

      if (submittedGuess !== null) {
        difference = Math.abs(secret - submittedGuess);
        accuracy = Math.max(0, 100 - difference);

        // Scoring rules from Section 7
        if (difference === 0) {
          points = 100;
          isExact = true;
          this.exactGuessCounts.set(playerId, (this.exactGuessCounts.get(playerId) || 0) + 1);
          if (this.roundData.firstExactPlayerId === playerId) {
            isFirstExact = true;
            points += 10; // First exact guess bonus
          }
        } else if (difference <= 2) {
          points = 75;
        } else if (difference <= 5) {
          points = 50;
        } else if (difference <= 10) {
          points = 25;
        } else {
          points = 0;
        }
      }

      // Update cumulative score
      const currentCumulative = this.cumulativeScores.get(playerId) || 0;
      const newCumulative = currentCumulative + points;
      this.cumulativeScores.set(playerId, newCumulative);

      roundScores.push({
        playerId,
        nickname: player.nickname,
        avatar: player.avatar,
        secretNumber: secret, // NOW REVEALED
        submittedGuess,
        difference,
        accuracy,
        roundPoints: points,
        cumulativeScore: newCumulative,
        isExact,
        isFirstExact,
        hasGuessed: submittedGuess !== null
      });
    }

    // Sort round scores by cumulativeScore desc, then exact count desc
    roundScores.sort((a, b) => {
      if (b.cumulativeScore !== a.cumulativeScore) {
        return b.cumulativeScore - a.cumulativeScore;
      }
      const aExact = this.exactGuessCounts.get(a.playerId) || 0;
      const bExact = this.exactGuessCounts.get(b.playerId) || 0;
      return bExact - aExact;
    });

    const isMatchOver = this.currentRound >= this.settings.totalRounds;
    if (isMatchOver) {
      this.phase = GamePhase.COMPLETED;
    }

    const winner = roundScores[0] || null;

    this.roundData.results = {
      roundNumber: this.currentRound,
      totalRounds: this.settings.totalRounds,
      isMatchOver,
      roundScores,
      matchWinner: isMatchOver ? winner : null
    };

    this.addSystemMessage(
      isMatchOver
        ? `Match completed! Winner: ${winner ? winner.nickname : 'None'} with ${winner ? winner.cumulativeScore : 0} pts!`
        : `Round ${this.currentRound} complete. Next round ready.`
    );

    // Broadcast results to all players
    this.broadcastTailoredState();
  }

  /**
   * Start next round or rematch
   */
  nextRound(requestingPlayerId) {
    if (requestingPlayerId !== this.hostId) {
      return { success: false, error: 'Only the host can advance rounds' };
    }
    if (this.phase !== GamePhase.RESULTS && this.phase !== GamePhase.COMPLETED) {
      return { success: false, error: 'Cannot start next round before current round results' };
    }

    if (this.phase === GamePhase.COMPLETED) {
      // Rematch: Reset cumulative scores and start round 1
      for (const [playerId] of this.players) {
        this.cumulativeScores.set(playerId, 0);
        this.exactGuessCounts.set(playerId, 0);
      }
      this.startRound(1);
    } else {
      this.startRound(this.currentRound + 1);
    }

    this.broadcastTailoredState();
    return { success: true, roundNumber: this.currentRound };
  }

  /**
   * Reset game back to lobby
   */
  returnToLobby(requestingPlayerId) {
    if (requestingPlayerId !== this.hostId) {
      return { success: false, error: 'Only host can return room to lobby' };
    }
    if (this.timer) clearTimeout(this.timer);
    this.phase = GamePhase.LOBBY;
    this.currentRound = 0;
    this.roundData = null;
    this.messages = [];
    for (const [playerId, player] of this.players) {
      this.cumulativeScores.set(playerId, 0);
      this.exactGuessCounts.set(playerId, 0);
      player.isReady = player.id === this.hostId;
    }
    this.broadcastTailoredState();
    return { success: true };
  }

  /**
   * Adds a free-form question from a player
   */
  askQuestion(playerId, rawContent) {
    if (this.phase !== GamePhase.QUESTION_PHASE) {
      return { success: false, error: 'Questions can only be asked during the question phase' };
    }

    const player = this.players.get(playerId);
    if (!player) return { success: false, error: 'Player not in room' };

    const rateCheck = this.antiCheat.canAskQuestion(playerId);
    if (!rateCheck.allowed) {
      return { success: false, error: rateCheck.error };
    }

    const content = AntiCheat.sanitizeText(rawContent);
    if (!content || content.length < 2) {
      return { success: false, error: 'Question must be at least 2 characters' };
    }

    const questionMsg = {
      id: crypto.randomUUID(),
      type: 'question',
      senderId: playerId,
      senderName: player.nickname,
      senderAvatar: player.avatar,
      content,
      timestamp: Date.now(),
      answers: []
    };

    this.messages.push(questionMsg);
    this.lastActiveAt = Date.now();

    if (this.io) {
      this.io.to(this.roomCode).emit('game:question', questionMsg);
    }

    return { success: true, message: questionMsg };
  }

  /**
   * Submits an answer to a question
   */
  submitAnswer(playerId, questionId, rawAnswer, targetPlayerId = null) {
    if (this.phase !== GamePhase.QUESTION_PHASE) {
      return { success: false, error: 'Answers can only be submitted during the question phase' };
    }

    const player = this.players.get(playerId);
    if (!player) return { success: false, error: 'Player not in room' };

    const answer = AntiCheat.sanitizeText(rawAnswer);
    if (!answer) return { success: false, error: 'Answer cannot be empty' };

    const question = this.messages.find(m => m.id === questionId && m.type === 'question');
    if (!question) {
      return { success: false, error: 'Question not found' };
    }

    const answerObj = {
      id: crypto.randomUUID(),
      questionId,
      senderId: playerId,
      senderName: player.nickname,
      senderAvatar: player.avatar,
      answer,
      targetPlayerId: targetPlayerId || question.senderId,
      timestamp: Date.now()
    };

    question.answers.push(answerObj);
    this.lastActiveAt = Date.now();

    if (this.io) {
      this.io.to(this.roomCode).emit('game:answer', answerObj);
    }

    return { success: true, answer: answerObj };
  }

  /**
   * Adds an internal system message to the feed
   */
  addSystemMessage(text) {
    const sysMsg = {
      id: crypto.randomUUID(),
      type: 'system',
      content: text,
      timestamp: Date.now()
    };
    this.messages.push(sysMsg);
    if (this.io) {
      this.io.to(this.roomCode).emit('game:message', sysMsg);
    }
    return sysMsg;
  }

  /**
   * CRITICAL SECURITY METHOD:
   * Generates a tailored state projection for a specific requesting player.
   *
   * GOLDEN RULE GUARANTEE:
   * A player NEVER receives their own secret number in the payload
   * before the RESULTS phase.
   */
  getTailoredState(requestingPlayerId) {
    const isResultsPhase = this.phase === GamePhase.RESULTS || this.phase === GamePhase.COMPLETED;

    const playersProjection = Array.from(this.players.values()).map(p => {
      const isSelf = p.id === requestingPlayerId;
      let displaySecretNumber = null;
      let hasGuessed = false;

      if (this.roundData) {
        if (this.roundData.guesses.has(p.id)) {
          hasGuessed = true;
        }

        if (isResultsPhase) {
          // In results phase, all numbers are revealed
          displaySecretNumber = this.roundData.secretNumbers.get(p.id) ?? null;
        } else if (!isSelf) {
          // Other players' numbers are visible!
          displaySecretNumber = this.roundData.secretNumbers.get(p.id) ?? null;
        } else {
          // Self number is strictly kept secret on the server!
          displaySecretNumber = null;
        }
      }

      return {
        id: p.id,
        nickname: p.nickname,
        avatar: p.avatar,
        isHost: p.id === this.hostId,
        isReady: p.isReady,
        connected: p.connected,
        cumulativeScore: this.cumulativeScores.get(p.id) || 0,
        secretNumber: displaySecretNumber,
        isSecret: isSelf && !isResultsPhase,
        hasGuessed
      };
    });

    // Time calculations
    let remainingSeconds = 0;
    const now = Date.now();
    if (this.phase === GamePhase.QUESTION_PHASE && this.roundData) {
      remainingSeconds = Math.max(0, Math.ceil((this.roundData.questionDeadline - now) / 1000));
    } else if (this.phase === GamePhase.GUESSING_PHASE && this.roundData) {
      remainingSeconds = Math.max(0, Math.ceil((this.roundData.guessDeadline - now) / 1000));
    }

    return {
      roomCode: this.roomCode,
      hostId: this.hostId,
      phase: this.phase,
      currentRound: this.currentRound,
      totalRounds: this.settings.totalRounds,
      settings: this.settings,
      players: playersProjection,
      myPlayerId: requestingPlayerId,
      remainingSeconds,
      deadlines: this.roundData ? {
        questionDeadline: this.roundData.questionDeadline,
        guessDeadline: this.roundData.guessDeadline,
        serverTime: now
      } : null,
      messages: this.messages,
      mySubmittedGuess: this.roundData?.guesses?.get(requestingPlayerId)?.guess ?? null,
      results: this.roundData?.results ?? null
    };
  }

  /**
   * Broadcasts a tailored state to every connected player socket
   */
  broadcastTailoredState() {
    if (!this.io) return;
    for (const [playerId, player] of this.players) {
      if (player.connected && player.socketId) {
        const state = this.getTailoredState(playerId);
        this.io.to(player.socketId).emit('game:state', state);
      }
    }
  }
}
