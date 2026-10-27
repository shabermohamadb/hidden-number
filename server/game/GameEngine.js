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
  constructor(roomCode, hostId, settings = {}, io, profileManager = null) {
    this.roomCode = roomCode;
    this.hostId = hostId;
    this.io = io;
    this.profileManager = profileManager;
    this.matchId = crypto.randomUUID();
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
      password: settings.password || null,
      turnPolicy: settings.turnPolicy || 'round_robin', // 'round_robin' | 'free_for_all'
      questionAnswerTime: settings.questionAnswerTime || 15, // 15s for YES/NO responses
      askQuestionTime: settings.askQuestionTime || 20 // 20s for active asker to submit question
    };

    this.phase = GamePhase.LOBBY;
    this.currentRound = 0;
    this.players = new Map(); // playerId -> PlayerData
    this.cumulativeScores = new Map(); // playerId -> number
    this.exactGuessCounts = new Map(); // playerId -> number
    this.roundData = null;
    this.messages = []; // list of Q&A and system events
    this.timer = null;
    this.questionAnswerTimer = null;
    this.askerTimeoutTimer = null;
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
      if (existing.disconnectTimer) {
        clearTimeout(existing.disconnectTimer);
        existing.disconnectTimer = null;
      }
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
      disconnectTimer: null,
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
   * Removes or disconnects a player (with 25s grace period on disconnect for seamless reloads)
   */
  removePlayer(playerId, permanent = false) {
    this.lastActiveAt = Date.now();
    const player = this.players.get(playerId);
    if (!player) return null;

    if (player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
      player.disconnectTimer = null;
    }

    if (permanent) {
      this.antiCheat.removePlayer(playerId);
      this.players.delete(playerId);
      this.cumulativeScores.delete(playerId);
      this.exactGuessCounts.delete(playerId);

      let newHostId = null;
      if (this.hostId === playerId) {
        const activePlayers = Array.from(this.players.values()).filter(p => p.connected);
        if (activePlayers.length > 0) {
          newHostId = activePlayers[0].id;
          this.hostId = newHostId;
          activePlayers[0].isHost = true;
        }
      }
      return { player, newHostId, remainingCount: this.players.size };
    }

    // Graceful disconnect (e.g. reload or temporary mobile network sleep)
    player.connected = false;
    player.socketId = null;

    if (this.phase === GamePhase.LOBBY) {
      // Set grace timer before removing from lobby
      player.disconnectTimer = setTimeout(() => {
        if (!player.connected) {
          this.antiCheat.removePlayer(playerId);
          this.players.delete(playerId);
          this.cumulativeScores.delete(playerId);
          this.exactGuessCounts.delete(playerId);

          if (this.hostId === playerId) {
            const activePlayers = Array.from(this.players.values()).filter(p => p.connected);
            if (activePlayers.length > 0) {
              this.hostId = activePlayers[0].id;
              activePlayers[0].isHost = true;
            }
          }
          this.broadcastTailoredState();
        }
      }, 25000); // 25 seconds grace
    }

    let newHostId = null;
    if (this.hostId === playerId) {
      const activePlayers = Array.from(this.players.values()).filter(p => p.connected);
      if (activePlayers.length > 0) {
        newHostId = activePlayers[0].id;
        this.hostId = newHostId;
        activePlayers[0].isHost = true;
      }
    }

    // If player leaves while an active question is waiting, update required answerers
    if (this.roundData?.activeQuestion && this.roundData.activeQuestion.status === 'AWAITING_ANSWERS') {
      if (this.roundData.activeQuestion.askerId === playerId) {
        this.addSystemMessage(`${player.nickname} disconnected. Resolving question.`);
        this.resolveActiveQuestion('ASKER_LEFT');
      } else {
        const remaining = this.roundData.activeQuestion.requiredAnswererIds.filter(
          id => id !== playerId && this.players.get(id)?.connected
        );
        const allAnswered = remaining.every(id => this.roundData.activeQuestion.answers.some(a => a.playerId === id));
        if (allAnswered && remaining.length > 0) {
          this.resolveActiveQuestion('ALL_ANSWERED');
        }
      }
    } else if (this.phase === GamePhase.QUESTION_PHASE && this.getCurrentAskerId() === playerId) {
      this.handleAskerTimeout();
    }

    // If all players left in active game, terminate timer
    const remainingActive = Array.from(this.players.values()).filter(p => p.connected);
    if (remainingActive.length === 0) {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      if (this.askerTimeoutTimer) {
        clearTimeout(this.askerTimeoutTimer);
        this.askerTimeoutTimer = null;
      }
      if (this.questionAnswerTimer) {
        clearTimeout(this.questionAnswerTimer);
        this.questionAnswerTimer = null;
      }
    }

    return { player, newHostId, remainingCount: this.players.size };
  }

  getConnectedPlayerIds() {
    return Array.from(this.players.values()).filter(p => p.connected).map(p => p.id);
  }

  getCurrentAskerId() {
    if (!this.roundData || !this.roundData.turnOrder || this.roundData.turnOrder.length === 0) return null;
    return this.roundData.turnOrder[this.roundData.currentTurnIndex] || null;
  }

  startAskerTurn() {
    if (this.phase !== GamePhase.QUESTION_PHASE || !this.roundData) return;

    if (this.askerTimeoutTimer) {
      clearTimeout(this.askerTimeoutTimer);
      this.askerTimeoutTimer = null;
    }
    if (this.questionAnswerTimer) {
      clearTimeout(this.questionAnswerTimer);
      this.questionAnswerTimer = null;
    }

    this.roundData.activeQuestion = null;

    // Advance to next connected player if current is disconnected
    let attempts = 0;
    const maxAttempts = this.roundData.turnOrder.length;
    while (attempts < maxAttempts) {
      const candidateId = this.roundData.turnOrder[this.roundData.currentTurnIndex];
      const p = this.players.get(candidateId);
      if (p && p.connected) {
        break;
      }
      this.roundData.currentTurnIndex = (this.roundData.currentTurnIndex + 1) % this.roundData.turnOrder.length;
      attempts++;
    }

    const currentAskerId = this.getCurrentAskerId();
    if (!currentAskerId) return;

    const askTime = this.settings.askQuestionTime || 20;
    this.roundData.askDeadline = Date.now() + (askTime * 1000);

    this.askerTimeoutTimer = setTimeout(() => {
      this.handleAskerTimeout();
    }, askTime * 1000);

    this.broadcastTailoredState();
  }

  handleAskerTimeout() {
    if (this.phase !== GamePhase.QUESTION_PHASE || !this.roundData) return;
    if (this.roundData.activeQuestion && this.roundData.activeQuestion.status === 'AWAITING_ANSWERS') return;

    const currentAskerId = this.getCurrentAskerId();
    const asker = currentAskerId ? this.players.get(currentAskerId) : null;
    if (asker) {
      this.addSystemMessage(`${asker.nickname}'s turn to ask timed out. Passing to next player.`);
    }

    if (this.roundData.turnOrder.length > 0) {
      this.roundData.currentTurnIndex = (this.roundData.currentTurnIndex + 1) % this.roundData.turnOrder.length;
    }
    this.startAskerTurn();
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

    // Build turn order queue of connected players: host first, followed by others
    const connectedIds = Array.from(this.players.keys()).filter(pid => this.players.get(pid)?.connected);
    const turnOrder = [];
    if (this.hostId && connectedIds.includes(this.hostId)) {
      turnOrder.push(this.hostId);
    }
    for (const pid of connectedIds) {
      if (!turnOrder.includes(pid)) {
        turnOrder.push(pid);
      }
    }

    this.roundData = {
      roundNumber: this.currentRound,
      secretNumbers, // SERVER-AUTHORITATIVE ONLY. Never sent to its owner!
      guesses: new Map(), // playerId -> { guess, timestamp }
      startTime,
      questionDeadline,
      guessDeadline: null,
      firstExactPlayerId: null,
      results: null,
      turnOrder,
      currentTurnIndex: 0,
      activeQuestion: null,
      questionHistory: [],
      askDeadline: null
    };

    // Broadcast system message
    this.addSystemMessage(`Round ${this.currentRound} has begun! One question at a time across the arena. Answer with YES or NO.`);

    // Schedule question phase completion
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.transitionToGuessingPhase();
    }, this.settings.questionTime * 1000);

    this.startAskerTurn();

    return this.roundData;
  }

  /**
   * Transitions from Question Phase to Guessing Phase
   */
  transitionToGuessingPhase() {
    if (this.phase !== GamePhase.QUESTION_PHASE) return;
    this.phase = GamePhase.GUESSING_PHASE;

    if (this.askerTimeoutTimer) {
      clearTimeout(this.askerTimeoutTimer);
      this.askerTimeoutTimer = null;
    }
    if (this.questionAnswerTimer) {
      clearTimeout(this.questionAnswerTimer);
      this.questionAnswerTimer = null;
    }

    if (this.roundData?.activeQuestion) {
      this.resolveActiveQuestion('PHASE_ENDED');
    }
    if (this.roundData) {
      this.roundData.activeQuestion = null;
    }

    const startTime = Date.now();
    const guessDeadline = startTime + (this.settings.guessTime * 1000);
    this.roundData.guessDeadline = guessDeadline;
    this.lastActiveAt = Date.now();

    this.addSystemMessage(`Interrogation phase has ended! Submit your private guess (1-${this.settings.numberRange[1]}). You have ${this.settings.guessTime}s.`);

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

    // Server-authoritative match recording & XP progression
    if (isMatchOver && this.profileManager) {
      this.profileManager.recordMatchResult({
        matchId: this.matchId,
        roomCode: this.roomCode,
        results: this.roundData.results,
        timestamp: Date.now()
      });
    }

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
      // Rematch: Reset cumulative scores, generate fresh matchId and start round 1
      this.matchId = crypto.randomUUID();
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
    if (this.askerTimeoutTimer) clearTimeout(this.askerTimeoutTimer);
    if (this.questionAnswerTimer) clearTimeout(this.questionAnswerTimer);
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
   * Adds a free-form question from the active player.
   * STRICT RULE: Only ONE active question at a time across the entire room.
   */
  askQuestion(playerId, rawContent, targetPlayerId = null) {
    if (this.phase !== GamePhase.QUESTION_PHASE || !this.roundData) {
      return { success: false, error: 'Questions can only be asked during the question phase' };
    }

    // 1. Only ONE active question at a time across the entire room
    if (this.roundData.activeQuestion && this.roundData.activeQuestion.status === 'AWAITING_ANSWERS') {
      return { success: false, error: 'Another question is currently active and awaiting answers' };
    }

    // 2. Turn order check: only the active question asker can ask
    if (this.settings.turnPolicy === 'round_robin') {
      const currentAskerId = this.getCurrentAskerId();
      if (currentAskerId !== playerId) {
        const asker = currentAskerId ? this.players.get(currentAskerId) : null;
        return {
          success: false,
          error: `It is not your turn to ask. Current turn: ${asker ? asker.nickname : 'another player'}.`
        };
      }
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

    // Clear active asker timeout
    if (this.askerTimeoutTimer) {
      clearTimeout(this.askerTimeoutTimer);
      this.askerTimeoutTimer = null;
    }

    // Determine eligible answerers (all connected players except the asker)
    const requiredAnswererIds = this.getConnectedPlayerIds().filter(id => id !== playerId);

    const answerTime = this.settings.questionAnswerTime || 15;
    const answerDeadline = Math.min(
      this.roundData.questionDeadline,
      Date.now() + (answerTime * 1000)
    );

    const activeQuestion = {
      id: crypto.randomUUID(),
      type: 'question',
      askerId: playerId,
      askerName: player.nickname,
      askerAvatar: player.avatar,
      senderId: playerId,
      senderName: player.nickname,
      senderAvatar: player.avatar,
      targetPlayerId: targetPlayerId || null,
      content,
      status: 'AWAITING_ANSWERS',
      createdAt: Date.now(),
      answerDeadline,
      answers: [],
      requiredAnswererIds
    };

    this.roundData.activeQuestion = activeQuestion;
    this.lastActiveAt = Date.now();

    if (requiredAnswererIds.length === 0) {
      // Solo testing or no other connected players
      this.resolveActiveQuestion('NO_ANSWERERS');
    } else {
      if (this.questionAnswerTimer) clearTimeout(this.questionAnswerTimer);
      const remainingMs = Math.max(500, answerDeadline - Date.now());
      this.questionAnswerTimer = setTimeout(() => {
        this.resolveActiveQuestion('TIMEOUT');
      }, remainingMs);

      if (this.io) {
        this.io.to(this.roomCode).emit('game:question', activeQuestion);
      }
      this.broadcastTailoredState();
    }

    return { success: true, message: activeQuestion };
  }

  /**
   * Submits an answer to the active question.
   * RULES:
   * 1. Only eligible other players can answer.
   * 2. The question asker CANNOT answer their own question.
   * 3. Exactly two options allowed: YES or NO.
   * 4. Each eligible player may submit only ONE answer per question.
   */
  submitAnswer(playerId, questionId, rawAnswer, targetPlayerId = null) {
    if (this.phase !== GamePhase.QUESTION_PHASE || !this.roundData) {
      return { success: false, error: 'Answers can only be submitted during the question phase' };
    }

    const activeQ = this.roundData.activeQuestion;
    if (!activeQ || activeQ.status !== 'AWAITING_ANSWERS') {
      return { success: false, error: 'There is no active question awaiting answers' };
    }

    if (activeQ.id !== questionId) {
      return { success: false, error: 'This question is no longer active' };
    }

    // Question asker must NOT be able to answer their own question
    if (playerId === activeQ.askerId) {
      return { success: false, error: 'The question asker cannot answer their own question' };
    }

    const player = this.players.get(playerId);
    if (!player || !player.connected) {
      return { success: false, error: 'Player not connected' };
    }

    // Exactly two options allowed: YES or NO
    if (typeof rawAnswer !== 'string') {
      return { success: false, error: 'Answer must be YES or NO' };
    }
    const normalizedAnswer = rawAnswer.trim().toUpperCase();
    if (normalizedAnswer !== 'YES' && normalizedAnswer !== 'NO') {
      return { success: false, error: 'Answer must be strictly YES or NO' };
    }

    // Each eligible player may submit only one answer per question
    if (activeQ.answers.some(a => a.playerId === playerId)) {
      return { success: false, error: 'You have already submitted an answer to this question' };
    }

    const answerObj = {
      id: crypto.randomUUID(),
      questionId,
      playerId,
      senderId: playerId,
      nickname: player.nickname,
      senderName: player.nickname,
      avatar: player.avatar,
      senderAvatar: player.avatar,
      answer: normalizedAnswer,
      targetPlayerId: targetPlayerId || activeQ.askerId,
      timestamp: Date.now()
    };

    activeQ.answers.push(answerObj);
    this.lastActiveAt = Date.now();

    if (this.io) {
      this.io.to(this.roomCode).emit('game:answer', answerObj);
    }

    // Check if all connected required players have answered
    const connectedRequired = activeQ.requiredAnswererIds.filter(id => this.players.get(id)?.connected);
    const allAnswered = connectedRequired.every(id => activeQ.answers.some(a => a.playerId === id));

    if (allAnswered) {
      this.resolveActiveQuestion('ALL_ANSWERED');
    } else {
      this.broadcastTailoredState();
    }

    return { success: true, answer: answerObj };
  }

  /**
   * Closes active question, archives it to history, and advances to the next player
   */
  resolveActiveQuestion(reason = 'ALL_ANSWERED') {
    if (!this.roundData?.activeQuestion) return;
    if (this.roundData.activeQuestion.status === 'RESOLVED') return;

    if (this.questionAnswerTimer) {
      clearTimeout(this.questionAnswerTimer);
      this.questionAnswerTimer = null;
    }

    const q = this.roundData.activeQuestion;
    q.status = 'RESOLVED';

    // Store in round question history
    this.roundData.questionHistory.push(JSON.parse(JSON.stringify(q)));

    // Add to messages log for question history feed
    const yesCount = q.answers.filter(a => a.answer === 'YES').length;
    const noCount = q.answers.filter(a => a.answer === 'NO').length;
    this.messages.push({
      id: q.id,
      type: 'question',
      senderId: q.askerId,
      senderName: q.askerName,
      senderAvatar: q.askerAvatar,
      content: q.content,
      timestamp: q.createdAt,
      answers: q.answers,
      summary: `${yesCount} YES / ${noCount} NO`
    });

    // Advance turn order to next player
    if (this.roundData.turnOrder.length > 0) {
      this.roundData.currentTurnIndex = (this.roundData.currentTurnIndex + 1) % this.roundData.turnOrder.length;
    }

    this.roundData.activeQuestion = null;

    if (this.phase === GamePhase.QUESTION_PHASE) {
      this.startAskerTurn();
    } else {
      this.broadcastTailoredState();
    }
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

    // Turn State & Active Question Projections
    const currentAskerId = this.getCurrentAskerId();
    const currentAsker = currentAskerId ? this.players.get(currentAskerId) : null;
    const activeQ = this.roundData?.activeQuestion;

    const turnOrder = this.roundData?.turnOrder ? this.roundData.turnOrder.map(pid => {
      const p = this.players.get(pid);
      return {
        playerId: pid,
        nickname: p ? p.nickname : 'Player',
        avatar: p ? p.avatar : 'avatar-1',
        connected: p ? p.connected : false,
        isCurrent: pid === currentAskerId
      };
    }) : [];

    const isMyTurnToAsk = this.phase === GamePhase.QUESTION_PHASE &&
                          currentAskerId === requestingPlayerId &&
                          !activeQ;

    const canAnswerActiveQuestion = this.phase === GamePhase.QUESTION_PHASE &&
                                    Boolean(activeQ) &&
                                    activeQ.status === 'AWAITING_ANSWERS' &&
                                    requestingPlayerId !== activeQ.askerId &&
                                    !activeQ.answers.some(a => a.playerId === requestingPlayerId);

    const hasAnsweredActiveQuestion = Boolean(activeQ && activeQ.answers.some(a => a.playerId === requestingPlayerId));

    let activeQuestionProjection = null;
    if (activeQ) {
      const totalRequired = activeQ.requiredAnswererIds.filter(id => this.players.get(id)?.connected).length;
      const myAns = activeQ.answers.find(a => a.playerId === requestingPlayerId)?.answer || null;
      activeQuestionProjection = {
        id: activeQ.id,
        askerId: activeQ.askerId,
        askerName: activeQ.askerName,
        askerAvatar: activeQ.askerAvatar,
        content: activeQ.content,
        status: activeQ.status,
        createdAt: activeQ.createdAt,
        answerDeadline: activeQ.answerDeadline,
        remainingAnswerSeconds: Math.max(0, Math.ceil((activeQ.answerDeadline - now) / 1000)),
        answers: activeQ.answers,
        totalRequiredAnswers: totalRequired,
        answeredCount: activeQ.answers.length,
        isAsker: requestingPlayerId === activeQ.askerId,
        myAnswer: myAns
      };
    }

    const turnState = {
      currentAskerId,
      currentAskerName: currentAsker ? currentAsker.nickname : null,
      turnOrder,
      isMyTurnToAsk,
      canAnswerActiveQuestion,
      hasAnsweredActiveQuestion,
      askDeadline: this.roundData?.askDeadline || null,
      remainingAskSeconds: this.roundData?.askDeadline ? Math.max(0, Math.ceil((this.roundData.askDeadline - now) / 1000)) : 0
    };

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
      results: this.roundData?.results ?? null,
      activeQuestion: activeQuestionProjection,
      turnState,
      questionHistory: this.roundData?.questionHistory || []
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
