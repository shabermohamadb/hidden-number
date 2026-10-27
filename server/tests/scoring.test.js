// server/tests/scoring.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GameEngine, GamePhase } from '../game/GameEngine.js';

describe('Scoring System & Calculations', () => {
  it('correctly calculates points across all difference boundaries', () => {
    const game = new GameEngine('TEST01', 'host-1', { minPlayers: 3, totalRounds: 1 });
    game.addPlayer('p1', 'Player 1');
    game.addPlayer('p2', 'Player 2');
    game.addPlayer('p3', 'Player 3');

    game.startRound(1);

    // Manually set known secret numbers for deterministic assertions
    game.roundData.secretNumbers.set('p1', 50);
    game.roundData.secretNumbers.set('p2', 50);
    game.roundData.secretNumbers.set('p3', 50);

    // p1: Exact (diff 0)
    // p2: diff 2 (guess 48) -> 75 pts
    // p3: diff 4 (guess 54) -> 50 pts
    game.phase = GamePhase.GUESSING_PHASE;
    game.roundData.guessDeadline = Date.now() + 10000;

    game.submitGuess('p1', 50);
    game.submitGuess('p2', 48);
    game.submitGuess('p3', 54);

    const results = game.roundData.results;
    assert.ok(results, 'Results must be generated');

    const scoreP1 = results.roundScores.find(s => s.playerId === 'p1');
    const scoreP2 = results.roundScores.find(s => s.playerId === 'p2');
    const scoreP3 = results.roundScores.find(s => s.playerId === 'p3');

    // p1 is exact AND first exact -> 100 + 10 = 110 pts
    assert.strictEqual(scoreP1.difference, 0);
    assert.strictEqual(scoreP1.accuracy, 100);
    assert.strictEqual(scoreP1.roundPoints, 110);
    assert.strictEqual(scoreP1.isFirstExact, true);

    // p2: diff 2 -> 75 pts, accuracy 98%
    assert.strictEqual(scoreP2.difference, 2);
    assert.strictEqual(scoreP2.accuracy, 98);
    assert.strictEqual(scoreP2.roundPoints, 75);

    // p3: diff 4 -> 50 pts, accuracy 96%
    assert.strictEqual(scoreP3.difference, 4);
    assert.strictEqual(scoreP3.accuracy, 96);
    assert.strictEqual(scoreP3.roundPoints, 50);
  });

  it('awards 25 pts for diff 6-10 and 0 pts for diff > 10 or no guess', () => {
    const game = new GameEngine('TEST02', 'host-1', { minPlayers: 3, totalRounds: 1 });
    game.addPlayer('p1', 'Player 1');
    game.addPlayer('p2', 'Player 2');
    game.addPlayer('p3', 'Player 3');

    game.startRound(1);
    game.roundData.secretNumbers.set('p1', 50);
    game.roundData.secretNumbers.set('p2', 50);
    game.roundData.secretNumbers.set('p3', 50);

    game.phase = GamePhase.GUESSING_PHASE;
    game.roundData.guessDeadline = Date.now() + 10000;

    game.submitGuess('p1', 58); // diff 8 -> 25 pts
    game.submitGuess('p2', 75); // diff 25 -> 0 pts
    // p3 submits no guess -> 0 pts

    game.finalizeResults();
    const results = game.roundData.results;

    const scoreP1 = results.roundScores.find(s => s.playerId === 'p1');
    const scoreP2 = results.roundScores.find(s => s.playerId === 'p2');
    const scoreP3 = results.roundScores.find(s => s.playerId === 'p3');

    assert.strictEqual(scoreP1.difference, 8);
    assert.strictEqual(scoreP1.roundPoints, 25);

    assert.strictEqual(scoreP2.difference, 25);
    assert.strictEqual(scoreP2.roundPoints, 0);

    assert.strictEqual(scoreP3.submittedGuess, null);
    assert.strictEqual(scoreP3.difference, null);
    assert.strictEqual(scoreP3.roundPoints, 0);
  });
});

