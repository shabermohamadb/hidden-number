// server/game/AntiCheat.js

export class AntiCheat {
  constructor() {
    this.questionTimestamps = new Map(); // playerId -> timestamp
    this.messageRateLimitMs = 1500; // 1.5 seconds between questions
    this.maxMessageLength = 140;
  }

  /**
   * Sanitizes user input string against HTML injection and whitespace
   */
  static sanitizeText(input) {
    if (typeof input !== 'string') return '';
    return input
      .trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .slice(0, 140);
  }

  /**
   * Validates a player guess: Must be an integer between 1 and 100
   */
  static validateGuess(guess) {
    if (guess === null || guess === undefined) {
      return { valid: false, error: 'Guess cannot be empty' };
    }
    const num = Number(guess);
    if (!Number.isInteger(num)) {
      return { valid: false, error: 'Guess must be a whole integer' };
    }
    if (num < 1 || num > 100) {
      return { valid: false, error: 'Guess must be between 1 and 100 inclusive' };
    }
    return { valid: true, value: num };
  }

  /**
   * Checks rate limiting for question submission
   */
  canAskQuestion(playerId) {
    const now = Date.now();
    const lastTime = this.questionTimestamps.get(playerId) || 0;
    if (now - lastTime < this.messageRateLimitMs) {
      const waitSec = Math.ceil((this.messageRateLimitMs - (now - lastTime)) / 1000);
      return { allowed: false, error: `Cooldown active. Please wait ${waitSec}s.` };
    }
    this.questionTimestamps.set(playerId, now);
    return { allowed: true };
  }

  /**
   * Cleans up tracking for a player
   */
  removePlayer(playerId) {
    this.questionTimestamps.delete(playerId);
  }
}
