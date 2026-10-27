// server/tests/e2eSimulation.test.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';
import { GameEngine, GamePhase } from '../game/GameEngine.js';

describe('Multiplayer E2E Socket.IO Simulation (3 Concurrent Clients)', () => {
  let server, ioServer, port;
  let activeGame = null;
  const clientSockets = [];

  before((_, done) => {
    const app = express();
    server = http.createServer(app);
    ioServer = new Server(server, { cors: { origin: '*' } });

    ioServer.on('connection', (socket) => {
      let currentRoomCode = null;
      let currentPlayerId = null;

      socket.on('room:create', ({ nickname }, cb) => {
        const roomCode = 'E2E99';
        currentPlayerId = 'client-alice';
        activeGame = new GameEngine(roomCode, currentPlayerId, { minPlayers: 3, questionTime: 5, guessTime: 5 }, ioServer);
        activeGame.addPlayer(currentPlayerId, nickname, 'avatar-1', socket.id);
        currentRoomCode = roomCode;
        socket.join(roomCode);
        cb({ success: true, roomCode, room: activeGame.getTailoredState(currentPlayerId) });
        activeGame.broadcastTailoredState();
      });

      socket.on('room:join', ({ nickname }, cb) => {
        currentPlayerId = `client-${nickname.toLowerCase()}`;
        currentRoomCode = 'E2E99';
        socket.join('E2E99');
        activeGame.addPlayer(currentPlayerId, nickname, 'avatar-1', socket.id);
        cb({ success: true, roomCode: 'E2E99', room: activeGame.getTailoredState(currentPlayerId) });
        activeGame.broadcastTailoredState();
      });

      socket.on('room:ready', ({ isReady }, cb) => {
        activeGame.setPlayerReady(currentPlayerId, isReady);
        activeGame.broadcastTailoredState();
        if (cb) cb({ success: true });
      });

      socket.on('room:start', (cb) => {
        activeGame.startRound(1);
        activeGame.broadcastTailoredState();
        if (cb) cb({ success: true });
      });

      socket.on('game:ask-question', ({ content, targetPlayerId }, cb) => {
        const res = activeGame.askQuestion(currentPlayerId, content, targetPlayerId);
        if (cb) cb(res);
      });

      socket.on('game:submit-answer', ({ questionId, answer, targetPlayerId }, cb) => {
        const res = activeGame.submitAnswer(currentPlayerId, questionId, answer, targetPlayerId);
        if (cb) cb(res);
      });

      socket.on('game:submit-guess', ({ guess }, cb) => {
        const res = activeGame.submitGuess(currentPlayerId, guess);
        if (cb) cb(res);
      });
    });

    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  after(() => {
    if (activeGame && activeGame.timer) {
      clearTimeout(activeGame.timer);
    }
    clientSockets.forEach(s => s.disconnect());
    ioServer.close();
    server.close();
  });

  it('runs complete 3-player match from creation to guessing and results', async () => {
    const serverUrl = `http://localhost:${port}`;

    // 1. Connect Alice (Host)
    const socketAlice = Client(serverUrl);
    clientSockets.push(socketAlice);

    await new Promise(r => socketAlice.on('connect', r));

    const createRes = await new Promise((resolve) => {
      socketAlice.emit('room:create', { nickname: 'Alice' }, resolve);
    });
    assert.strictEqual(createRes.success, true);
    const roomCode = createRes.roomCode;

    // 2. Connect Bob and Charlie
    const socketBob = Client(serverUrl);
    const socketCharlie = Client(serverUrl);
    clientSockets.push(socketBob, socketCharlie);

    await Promise.all([
      new Promise(r => socketBob.on('connect', r)),
      new Promise(r => socketCharlie.on('connect', r))
    ]);

    const joinBobRes = await new Promise((resolve) => {
      socketBob.emit('room:join', { roomCode, nickname: 'Bob' }, resolve);
    });
    assert.strictEqual(joinBobRes.success, true);

    const joinCharlieRes = await new Promise((resolve) => {
      socketCharlie.emit('room:join', { roomCode, nickname: 'Charlie' }, resolve);
    });
    assert.strictEqual(joinCharlieRes.success, true);

    // 3. Ready up
    socketBob.emit('room:ready', { isReady: true });
    socketCharlie.emit('room:ready', { isReady: true });

    // 4. Set up state listeners for all 3 clients
    let aliceState = null;
    let bobState = null;
    let charlieState = null;

    socketAlice.on('game:state', (s) => { aliceState = s; });
    socketBob.on('game:state', (s) => { bobState = s; });
    socketCharlie.on('game:state', (s) => { charlieState = s; });

    // 5. Host starts game
    const startRes = await new Promise((resolve) => {
      socketAlice.emit('room:start', resolve);
    });
    assert.strictEqual(startRes.success, true);

    await new Promise(r => setTimeout(r, 100));

    assert.ok(aliceState);
    assert.ok(bobState);
    assert.ok(charlieState);
    assert.strictEqual(aliceState.phase, GamePhase.QUESTION_PHASE);

    // VERIFY THE GOLDEN RULE ON ALL 3 REAL SOCKET CLIENTS!
    const aliceInAlice = aliceState.players.find(p => p.id === 'client-alice');
    const bobInAlice = aliceState.players.find(p => p.id === 'client-bob');
    const charlieInAlice = aliceState.players.find(p => p.id === 'client-charlie');

    assert.strictEqual(aliceInAlice.secretNumber, null, 'Alice must not see her own number');
    assert.strictEqual(aliceInAlice.isSecret, true);
    assert.notStrictEqual(bobInAlice.secretNumber, null, 'Alice must see Bob\'s number');
    assert.notStrictEqual(charlieInAlice.secretNumber, null, 'Alice must see Charlie\'s number');

    // 6. Test Q&A interaction
    let receivedQuestion = null;
    socketBob.on('game:question', (q) => { receivedQuestion = q; });

    await new Promise((resolve) => {
      socketAlice.emit('game:ask-question', { content: 'Is my number even?', targetPlayerId: 'client-bob' }, resolve);
    });

    await new Promise(r => setTimeout(r, 100));
    assert.ok(receivedQuestion);
    assert.strictEqual(receivedQuestion.content, 'Is my number even?');
    assert.strictEqual(receivedQuestion.targetPlayerId, 'client-bob');

    // Bob answers
    let receivedAnswer = null;
    socketAlice.on('game:answer', (a) => { receivedAnswer = a; });

    await new Promise((resolve) => {
      socketBob.emit('game:submit-answer', { questionId: receivedQuestion.id, answer: 'YES', targetPlayerId: 'client-alice' }, resolve);
    });

    await new Promise(r => setTimeout(r, 100));
    assert.ok(receivedAnswer);
    assert.strictEqual(receivedAnswer.answer, 'YES');
    assert.strictEqual(receivedAnswer.targetPlayerId, 'client-alice');

    // 7. Transition to Guessing Phase
    activeGame.transitionToGuessingPhase();
    await new Promise(r => setTimeout(r, 100));

    assert.strictEqual(aliceState.phase, GamePhase.GUESSING_PHASE);

    // 8. Submit guesses from all 3 clients
    await Promise.all([
      new Promise(r => socketAlice.emit('game:submit-guess', { guess: 42 }, r)),
      new Promise(r => socketBob.emit('game:submit-guess', { guess: 84 }, r)),
      new Promise(r => socketCharlie.emit('game:submit-guess', { guess: 15 }, r))
    ]);

    await new Promise(r => setTimeout(r, 100));

    // Results phase should be finalized immediately since all 3 guessed!
    assert.strictEqual(aliceState.phase, GamePhase.RESULTS);
    assert.ok(aliceState.results);
    assert.strictEqual(aliceState.results.roundScores.length, 3);

    // In results phase, all numbers are revealed!
    const aliceInResults = aliceState.players.find(p => p.id === 'client-alice');
    assert.notStrictEqual(aliceInResults.secretNumber, null);
    assert.strictEqual(aliceInResults.isSecret, false);
  });
});

