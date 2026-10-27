// server/index.js
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GameEngine, GamePhase } from './game/GameEngine.js';
import { Matchmaker } from './game/Matchmaker.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const PORT = process.env.PORT || 3001;
const app = express();
const server = http.createServer(app);

// Enable CORS for development and production
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));
app.use(express.json());

// In-Memory Storage & Managers
class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomCode -> GameEngine
    this.playerSessions = new Map(); // sessionId -> { playerId, roomCode, nickname, avatar }
    this.socketToSession = new Map(); // socketId -> sessionId
  }

  generateRoomCode() {
    let code;
    do {
      code = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars, e.g. 7A8B9C
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(hostId, nickname, avatar, settings = {}, socketId = null) {
    const roomCode = this.generateRoomCode();
    const game = new GameEngine(roomCode, hostId, settings, this.io);
    game.addPlayer(hostId, nickname, avatar, socketId);
    this.rooms.set(roomCode, game);
    return game;
  }

  getRoom(roomCode) {
    if (!roomCode) return null;
    return this.rooms.get(roomCode.toUpperCase().trim()) || null;
  }

  joinRoom(roomCode, playerId, nickname, avatar, password = null, socketId = null) {
    const game = this.getRoom(roomCode);
    if (!game) {
      return { success: false, error: 'Room does not exist' };
    }

    if (game.settings.password && game.settings.password !== password) {
      return { success: false, error: 'Incorrect room password' };
    }

    const res = game.addPlayer(playerId, nickname, avatar, socketId);
    return { ...res, game };
  }

  cleanupExpiredRooms() {
    const now = Date.now();
    const MAX_IDLE_TIME = 2 * 60 * 60 * 1000; // 2 hours
    for (const [code, game] of this.rooms) {
      if (now - game.lastActiveAt > MAX_IDLE_TIME) {
        if (game.timer) clearTimeout(game.timer);
        this.rooms.delete(code);
      }
    }
  }
}

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingInterval: 10000,
  pingTimeout: 5000
});

const roomManager = new RoomManager(io);
const matchmaker = new Matchmaker(roomManager, io);

// Periodic cleanup of stale rooms
setInterval(() => {
  roomManager.cleanupExpiredRooms();
}, 60000);

// ==========================================
// REST API Routes
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeRooms: roomManager.rooms.size,
    queuedPlayers: matchmaker.queue.length
  });
});

app.get('/api/rooms', (req, res) => {
  // Return public rooms in lobby
  const publicRooms = [];
  for (const [code, game] of roomManager.rooms) {
    if (game.settings.visibility === 'public' && game.phase === GamePhase.LOBBY) {
      publicRooms.push({
        roomCode: code,
        playerCount: game.players.size,
        maxPlayers: game.settings.maxPlayers,
        minPlayers: game.settings.minPlayers,
        hasPassword: !!game.settings.password
      });
    }
  }
  res.json({ rooms: publicRooms });
});

// ==========================================
// Real-Time Socket Event Routing
// ==========================================

io.on('connection', (socket) => {
  let currentSessionId = null;
  let currentPlayerId = null;
  let currentRoomCode = null;

  // 1. Session Setup / Resume
  socket.on('session:init', ({ sessionId, playerId, nickname, avatar }, callback) => {
    const sid = sessionId || crypto.randomUUID();
    const pid = playerId || crypto.randomUUID();
    currentSessionId = sid;
    currentPlayerId = pid;

    roomManager.socketToSession.set(socket.id, sid);

    let session = roomManager.playerSessions.get(sid);
    if (!session) {
      session = { playerId: pid, nickname, avatar, roomCode: null };
      roomManager.playerSessions.set(sid, session);
    } else {
      session.playerId = session.playerId || pid;
      session.nickname = nickname || session.nickname;
      session.avatar = avatar || session.avatar;
    }

    if (callback) {
      callback({
        success: true,
        sessionId: sid,
        playerId: session.playerId,
        roomCode: session.roomCode
      });
    }
  });

  // 2. Session Resume after page refresh or network drop
  socket.on('session:resume', ({ sessionId, playerId, nickname, avatar }, callback) => {
    let session = sessionId ? roomManager.playerSessions.get(sessionId) : null;
    
    // Fallback: If not in session map, recover by playerId across rooms
    if ((!session || !session.roomCode) && playerId) {
      for (const [code, g] of roomManager.rooms) {
        if (g.players.has(playerId)) {
          session = { playerId, nickname, avatar, roomCode: code };
          if (sessionId) roomManager.playerSessions.set(sessionId, session);
          break;
        }
      }
    }

    if (!session || !session.roomCode) {
      if (callback) callback({ success: false, error: 'No active session found' });
      return;
    }

    const game = roomManager.getRoom(session.roomCode);
    if (!game) {
      session.roomCode = null;
      if (callback) callback({ success: false, error: 'Room has expired' });
      return;
    }

    currentSessionId = sessionId || currentSessionId;
    currentPlayerId = session.playerId;
    currentRoomCode = session.roomCode;
    if (sessionId) roomManager.socketToSession.set(socket.id, sessionId);

    socket.join(game.roomCode);
    game.addPlayer(session.playerId, session.nickname, session.avatar, socket.id);

    // Send tailored state restoration
    const tailoredState = game.getTailoredState(session.playerId);
    socket.emit('game:state-restored', tailoredState);
    game.broadcastTailoredState();

    if (callback) {
      callback({
        success: true,
        roomCode: game.roomCode,
        state: tailoredState
      });
    }
  });

  // 3. Create Room
  socket.on('room:create', ({ nickname, avatar, settings, playerId, sessionId }, callback) => {
    const pid = playerId || currentPlayerId || crypto.randomUUID();
    currentPlayerId = pid;
    if (sessionId) currentSessionId = sessionId;

    const game = roomManager.createRoom(pid, nickname, avatar, settings, socket.id);

    currentRoomCode = game.roomCode;
    socket.join(game.roomCode);

    if (currentSessionId) {
      const session = roomManager.playerSessions.get(currentSessionId);
      if (session) {
        session.roomCode = game.roomCode;
        session.playerId = pid;
      }
    }

    const state = game.getTailoredState(pid);

    if (callback) {
      callback({
        success: true,
        roomCode: game.roomCode,
        room: state
      });
    }

    game.broadcastTailoredState();
  });

  // 4. Join Room
  socket.on('room:join', ({ roomCode, nickname, avatar, password, playerId, sessionId }, callback) => {
    const pid = playerId || currentPlayerId || crypto.randomUUID();
    currentPlayerId = pid;
    if (sessionId) currentSessionId = sessionId;

    const result = roomManager.joinRoom(roomCode, pid, nickname, avatar, password, socket.id);

    if (!result.success) {
      if (callback) callback({ success: false, error: result.error });
      return;
    }

    const game = result.game;
    currentRoomCode = game.roomCode;
    socket.join(game.roomCode);

    if (currentSessionId) {
      const session = roomManager.playerSessions.get(currentSessionId);
      if (session) {
        session.roomCode = game.roomCode;
        session.playerId = pid;
      }
    }

    const state = game.getTailoredState(pid);

    if (callback) {
      callback({
        success: true,
        roomCode: game.roomCode,
        room: state
      });
    }

    io.to(game.roomCode).emit('room:player-joined', {
      player: result.player
    });

    game.broadcastTailoredState();
  });

  // 5. Ready state toggle in lobby
  socket.on('room:ready', (data, callback) => {
    const cb = typeof data === 'function' ? data : callback;
    const isReady = typeof data === 'object' ? data.isReady : true;
    const rCode = (typeof data === 'object' && data.roomCode) || currentRoomCode;
    const pId = (typeof data === 'object' && data.playerId) || currentPlayerId;

    if (!rCode || !pId) {
      if (cb) cb({ success: false, error: 'Missing room or player identifier' });
      return;
    }

    const game = roomManager.getRoom(rCode);
    if (!game) {
      if (cb) cb({ success: false, error: 'Room not found' });
      return;
    }

    const ok = game.setPlayerReady(pId, isReady);
    if (cb) cb({ success: ok });

    game.broadcastTailoredState();
  });

  // 6. Host starts game
  socket.on('room:start', (data, callback) => {
    const cb = typeof data === 'function' ? data : callback;
    const rCode = (typeof data === 'object' && data?.roomCode) || currentRoomCode;
    const pId = (typeof data === 'object' && data?.playerId) || currentPlayerId;

    if (!rCode || !pId) {
      if (cb) cb({ success: false, error: 'Missing room or player identifier' });
      return;
    }

    const game = roomManager.getRoom(rCode);
    if (!game) {
      if (cb) cb({ success: false, error: 'Room not found' });
      return;
    }

    const canStart = game.canStartGame(pId);
    if (!canStart.canStart) {
      if (cb) cb({ success: false, error: canStart.error });
      return;
    }

    game.startRound(1);
    game.broadcastTailoredState();

    if (cb) cb({ success: true });
  });

  // 7. Public Matchmaking: Join
  socket.on('matchmaking:join', ({ nickname, avatar }, callback) => {
    if (!currentPlayerId) currentPlayerId = crypto.randomUUID();
    matchmaker.addToQueue({
      playerId: currentPlayerId,
      socketId: socket.id,
      nickname,
      avatar
    });
    if (callback) callback({ success: true, inQueue: true });
  });

  // 8. Public Matchmaking: Cancel
  socket.on('matchmaking:cancel', (callback) => {
    if (currentPlayerId) {
      matchmaker.removeFromQueue(currentPlayerId);
    }
    if (callback) callback({ success: true });
  });

  // 9. Ask Question
  socket.on('game:ask-question', ({ content, targetPlayerId }, callback) => {
    if (!currentRoomCode || !currentPlayerId) return;
    const game = roomManager.getRoom(currentRoomCode);
    if (!game) return;

    const result = game.askQuestion(currentPlayerId, content, targetPlayerId);
    if (callback) callback(result);
  });

  // 10. Submit Answer
  socket.on('game:submit-answer', ({ questionId, answer, targetPlayerId }, callback) => {
    if (!currentRoomCode || !currentPlayerId) return;
    const game = roomManager.getRoom(currentRoomCode);
    if (!game) return;

    const result = game.submitAnswer(currentPlayerId, questionId, answer, targetPlayerId);
    if (callback) callback(result);
  });

  // 11. Submit Guess
  socket.on('game:submit-guess', ({ guess }, callback) => {
    if (!currentRoomCode || !currentPlayerId) return;
    const game = roomManager.getRoom(currentRoomCode);
    if (!game) return;

    const result = game.submitGuess(currentPlayerId, guess);
    if (callback) callback(result);
  });

  // 12. Next Round / Rematch
  socket.on('game:next-round', (callback) => {
    if (!currentRoomCode || !currentPlayerId) return;
    const game = roomManager.getRoom(currentRoomCode);
    if (!game) return;

    const result = game.nextRound(currentPlayerId);
    if (callback) callback(result);
  });

  // 13. Return to Lobby
  socket.on('game:return-lobby', (callback) => {
    if (!currentRoomCode || !currentPlayerId) return;
    const game = roomManager.getRoom(currentRoomCode);
    if (!game) return;

    const result = game.returnToLobby(currentPlayerId);
    if (callback) callback(result);
  });

  // 14. Leave Room
  socket.on('room:leave', (callback) => {
    if (currentRoomCode && currentPlayerId) {
      const game = roomManager.getRoom(currentRoomCode);
      if (game) {
        socket.leave(game.roomCode);
        const res = game.removePlayer(currentPlayerId, true); // Permanent removal
        if (res) {
          io.to(game.roomCode).emit('room:player-left', {
            playerId: currentPlayerId,
            newHostId: res.newHostId
          });
          game.broadcastTailoredState();
        }
      }
      if (currentSessionId) {
        const session = roomManager.playerSessions.get(currentSessionId);
        if (session) session.roomCode = null;
      }
      currentRoomCode = null;
    }
    if (callback) callback({ success: true });
  });

  // 15. Disconnect (Graceful - keeps room membership for 25s during reload)
  socket.on('disconnect', () => {
    if (currentPlayerId) {
      matchmaker.removeFromQueue(currentPlayerId);
    }
    if (currentRoomCode && currentPlayerId) {
      const game = roomManager.getRoom(currentRoomCode);
      if (game) {
        game.removePlayer(currentPlayerId, false); // Graceful 25s disconnect
        game.broadcastTailoredState();
      }
    }
    roomManager.socketToSession.delete(socket.id);
  });
});

// Serve static client bundle if built, or provide a rich server status dashboard
if (fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'))) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Graceful fallback for root route so users never see "Cannot GET /"
  app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HIDDEN NUMBER — Server Online</title>
  <style>
    body {
      background: #07080B;
      color: #FAF8F5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background: #0D1017;
      border: 1px solid rgba(212, 175, 55, 0.4);
      border-radius: 28px;
      padding: 44px 36px;
      max-width: 520px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 60px rgba(0,0,0,0.85);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.15);
      color: #34D399;
      border: 1px solid rgba(16, 185, 129, 0.35);
      border-radius: 9999px;
      padding: 5px 14px;
      font-size: 11px;
      font-weight: 700;
      font-family: monospace;
      margin-bottom: 20px;
      letter-spacing: 0.05em;
    }
    .pulse { width: 8px; height: 8px; border-radius: 50%; background: #34D399; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    h1 {
      color: #FAF8F5;
      font-size: 26px;
      margin: 0 0 10px;
      font-weight: 900;
      letter-spacing: 0.02em;
    }
    h1 span { color: #D4AF37; }
    p {
      color: #A7A29A;
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 24px;
    }
    .actions { display: flex; flex-direction: column; gap: 12px; }
    .btn-gold {
      display: block;
      background: linear-gradient(135deg, #9A7B38, #D4AF37, #8C6D34);
      color: #000;
      text-decoration: none;
      font-weight: 800;
      padding: 14px 24px;
      border-radius: 14px;
      font-size: 14px;
      transition: transform 0.15s ease;
      box-shadow: 0 4px 15px rgba(212, 175, 55, 0.25);
    }
    .btn-gold:hover { transform: scale(1.02); }
    .btn-sub {
      display: inline-block;
      color: #D4AF37;
      text-decoration: none;
      font-size: 12px;
      font-family: monospace;
      margin-top: 10px;
    }
    .btn-sub:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><div class="pulse"></div> SERVER ONLINE & READY</div>
    <h1>HIDDEN <span>NUMBER</span></h1>
    <p>The multiplayer WebSocket backend is running live and accepting client connections.</p>
    <div class="actions">
      <a href="https://hidden-number.vercel.app" class="btn-gold">Launch Arena on Vercel &rarr;</a>
      <a href="/api/health" class="btn-sub">View API Health Status (/api/health)</a>
    </div>
  </div>
</body>
</html>`);
  });
}

// Start persistent server
server.listen(PORT, () => {
  console.log(`[HIDDEN NUMBER] Server running on port ${PORT}`);
  console.log(`[HIDDEN NUMBER] Health check available at http://localhost:${PORT}/api/health`);
});

export { app, server, io, roomManager, matchmaker };
