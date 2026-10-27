// server/tests/activeQuestionTurn.test.js
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { GameEngine, GamePhase } from '../game/GameEngine.js';

describe('One Active Question At A Time Turn System', () => {
  let game;

  beforeEach(() => {
    game = new GameEngine('TURN01', 'p1', { minPlayers: 3, questionAnswerTime: 15, askQuestionTime: 20 });
    game.addPlayer('p1', 'Player 1');
    game.addPlayer('p2', 'Player 2');
    game.addPlayer('p3', 'Player 3');
    game.startRound(1);
  });

  it('builds a turn order queue with all connected players starting with host', () => {
    const tailored = game.getTailoredState('p1');
    assert.strictEqual(tailored.phase, GamePhase.QUESTION_PHASE);
    assert.ok(tailored.turnState);
    assert.strictEqual(tailored.turnState.currentAskerId, 'p1');
    assert.strictEqual(tailored.turnState.turnOrder.length, 3);
    assert.strictEqual(tailored.activeQuestion, null);
  });

  it('allows designated current asker to ask a question', () => {
    const askRes = game.askQuestion('p1', 'Is my number greater than 50?');
    assert.strictEqual(askRes.success, true);
    assert.ok(game.roundData.activeQuestion);
    assert.strictEqual(game.roundData.activeQuestion.askerId, 'p1');
    assert.strictEqual(game.roundData.activeQuestion.content, 'Is my number greater than 50?');
    assert.deepStrictEqual(game.roundData.activeQuestion.requiredAnswererIds, ['p2', 'p3']);

    const stateP1 = game.getTailoredState('p1');
    assert.ok(stateP1.activeQuestion);
    assert.strictEqual(stateP1.activeQuestion.totalRequiredAnswers, 2);
    assert.strictEqual(stateP1.activeQuestion.answeredCount, 0);
  });

  it('rejects question submission from a player whose turn it is NOT', () => {
    const askRes = game.askQuestion('p2', 'Is my number even?');
    assert.strictEqual(askRes.success, false);
    assert.ok(askRes.error.includes('not your turn'));
    assert.strictEqual(game.roundData.activeQuestion, null);
  });

  it('rejects a second question while one is actively awaiting answers', () => {
    game.askQuestion('p1', 'Is my number odd?');
    const secondRes = game.askQuestion('p1', 'Another question?');
    assert.strictEqual(secondRes.success, false);
    assert.ok(secondRes.error.includes('Another question is currently active'));
  });

  it('prohibits the question asker from answering their own question', () => {
    const askRes = game.askQuestion('p1', 'Is my number odd?');
    const qId = askRes.message.id;
    const ansRes = game.submitAnswer('p1', qId, 'YES');
    assert.strictEqual(ansRes.success, false);
    assert.ok(ansRes.error.includes('cannot answer their own question'));
  });

  it('strictly validates answers to be YES or NO', () => {
    const askRes = game.askQuestion('p1', 'Is my number odd?');
    const qId = askRes.message.id;
    const invalidRes = game.submitAnswer('p2', qId, 'MAYBE');
    assert.strictEqual(invalidRes.success, false);
    assert.strictEqual(invalidRes.error, 'Answer must be strictly YES or NO');

    const numRes = game.submitAnswer('p2', qId, '42');
    assert.strictEqual(numRes.success, false);
    assert.strictEqual(numRes.error, 'Answer must be strictly YES or NO');
  });

  it('rejects duplicate answers from the same player', () => {
    const askRes = game.askQuestion('p1', 'Is my number odd?');
    const qId = askRes.message.id;
    const ans1 = game.submitAnswer('p2', qId, 'YES');
    assert.strictEqual(ans1.success, true);

    const ans2 = game.submitAnswer('p2', qId, 'NO');
    assert.strictEqual(ans2.success, false);
    assert.ok(ans2.error.includes('already submitted an answer'));
  });

  it('automatically resolves question once all required answerers respond and rotates turn', () => {
    const askRes = game.askQuestion('p1', 'Is my number odd?');
    const qId = askRes.message.id;
    const ansP2 = game.submitAnswer('p2', qId, 'YES');
    assert.strictEqual(ansP2.success, true);

    const ansP3 = game.submitAnswer('p3', qId, 'NO');
    assert.strictEqual(ansP3.success, true);

    // Active question should now be archived in questionHistory
    assert.strictEqual(game.roundData.activeQuestion, null);
    assert.strictEqual(game.roundData.questionHistory.length, 1);
    assert.strictEqual(game.roundData.questionHistory[0].content, 'Is my number odd?');
    assert.strictEqual(game.roundData.questionHistory[0].answers.length, 2);

    // Next turn should be player p2!
    const stateAfter = game.getTailoredState('p2');
    assert.strictEqual(stateAfter.turnState.currentAskerId, 'p2');
  });

  it('recovering/reconnecting players receive active question and answer progress', () => {
    const askRes = game.askQuestion('p1', 'Is my number > 30?');
    const qId = askRes.message.id;
    const ansP2 = game.submitAnswer('p2', qId, 'YES');
    assert.strictEqual(ansP2.success, true);

    // Tailored state for reconnecting player p3
    const stateP3 = game.getTailoredState('p3');
    assert.ok(stateP3.activeQuestion);
    assert.strictEqual(stateP3.activeQuestion.answeredCount, 1);
    assert.strictEqual(stateP3.activeQuestion.totalRequiredAnswers, 2);
    assert.strictEqual(stateP3.activeQuestion.isAsker, false);

    // Tailored state for p2 who already answered
    const stateP2 = game.getTailoredState('p2');
    assert.strictEqual(stateP2.activeQuestion.myAnswer, 'YES');
  });
});

