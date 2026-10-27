// server/tests/securityAntiCheat.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GameEngine, GamePhase } from '../game/GameEngine.js';
import { AntiCheat } from '../game/AntiCheat.js';

describe('Security & Anti-Cheat Validation', () => {
  it('assigns unique random numbers between 1 and 100 to all players', () => {
    const game = new GameEngine('SEC01', 'h1', { minPlayers: 5 });
    for (let i = 1; i <= 5; i++) {
      game.addPlayer(`p${i}`, `Player ${i}`);
    }

    const secretMap = game.generateSecretNumbers();
    assert.strictEqual(secretMap.size, 5);

    const values = Array.from(secretMap.values());
    const uniqueValues = new Set(values);

    // Assert all numbers are strictly unique
    assert.strictEqual(uniqueValues.size, 5);

    // Assert all numbers are within range [1, 100]
    for (const num of values) {
      assert.ok(Number.isInteger(num), 'Must be integer');
      assert.ok(num >= 1 && num <= 100, `Number ${num} must be between 1 and 100`);
    }
  });

  it('GOLDEN RULE: Never leaks a player\'s own number in getTailoredState during active play', () => {
    const game = new GameEngine('SEC02', 'h1', { minPlayers: 3 });
    game.addPlayer('alice', 'Alice');
    game.addPlayer('bob', 'Bob');
    game.addPlayer('charlie', 'Charlie');

    game.startRound(1);

    // 1. Question Phase check
    const aliceStateInQ = game.getTailoredState('alice');
    const alicePlayerInQ = aliceStateInQ.players.find(p => p.id === 'alice');
    const bobPlayerInQ = aliceStateInQ.players.find(p => p.id === 'bob');

    // Alice's own secret number MUST be null
    assert.strictEqual(alicePlayerInQ.secretNumber, null);
    assert.strictEqual(alicePlayerInQ.isSecret, true);

    // Bob's secret number MUST be visible to Alice
    assert.notStrictEqual(bobPlayerInQ.secretNumber, null);
    assert.ok(bobPlayerInQ.secretNumber >= 1 && bobPlayerInQ.secretNumber <= 100);

    // 2. Guessing Phase check
    game.transitionToGuessingPhase();

    const aliceStateInG = game.getTailoredState('alice');
    const alicePlayerInG = aliceStateInG.players.find(p => p.id === 'alice');
    assert.strictEqual(alicePlayerInG.secretNumber, null);
    assert.strictEqual(alicePlayerInG.isSecret, true);

    // 3. Results Phase check: ONLY here is the number revealed
    game.submitGuess('alice', 40);
    game.submitGuess('bob', 50);
    game.submitGuess('charlie', 60);

    const aliceStateInR = game.getTailoredState('alice');
    const alicePlayerInR = aliceStateInR.players.find(p => p.id === 'alice');

    // Now revealed
    assert.notStrictEqual(alicePlayerInR.secretNumber, null);
    assert.strictEqual(alicePlayerInR.isSecret, false);
  });

  it('rejects invalid, out-of-range, or malformed guesses', () => {
    assert.strictEqual(AntiCheat.validateGuess(0).valid, false);
    assert.strictEqual(AntiCheat.validateGuess(101).valid, false);
    assert.strictEqual(AntiCheat.validateGuess(-5).valid, false);
    assert.strictEqual(AntiCheat.validateGuess(50.5).valid, false);
    assert.strictEqual(AntiCheat.validateGuess('invalid').valid, false);
    assert.strictEqual(AntiCheat.validateGuess(null).valid, false);

    assert.strictEqual(AntiCheat.validateGuess(1).valid, true);
    assert.strictEqual(AntiCheat.validateGuess(100).valid, true);
    assert.strictEqual(AntiCheat.validateGuess('42').valid, true);
  });

  it('sanitizes input against HTML and XSS injection', () => {
    const dirty = '<script>alert("hack")</script>Hello & goodbye!';
    const clean = AntiCheat.sanitizeText(dirty);
    assert.ok(!clean.includes('<script>'));
    assert.ok(clean.includes('&lt;script&gt;'));
  });

  it('enforces question submission rate limiting', () => {
    const ac = new AntiCheat();
    const first = ac.canAskQuestion('player-x');
    assert.strictEqual(first.allowed, true);

    // Immediate second attempt should be blocked
    const second = ac.canAskQuestion('player-x');
    assert.strictEqual(second.allowed, false);
    assert.ok(second.error.includes('Cooldown active'));
  });
});

