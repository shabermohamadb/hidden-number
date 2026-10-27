# HIDDEN NUMBER — ULTIMATE MULTIPLAYER GAME
### Three.js + React 19 + Real-Time Multi-Client Deduction Arena

> **"Everyone in the arena knows your number. Except you."**

---

## 1. Overview & Golden Rule

**HIDDEN NUMBER** is an AAA-inspired multiplayer social deduction party game. Each player is randomly assigned a cryptographically unique secret number from 1 to 100 per round. 
Every other player in the room can see that number, but its owner cannot. Players have 60 seconds to cross-examine opponents, ask strategic mathematical and comparative questions, analyze answers, and deduce their own number before submitting a single final guess.

### The Golden Rule (Zero-Trust Security Guarantee)
- Player numbers are generated on the server using `crypto.randomInt`.
- A player's own secret number is **never transmitted to their browser client** during the Question or Guessing phases.
- Tailored state projections are generated server-side for each connected socket. Even if an attacker inspects WebSocket payloads, React state, or the DOM, their secret number is strictly absent from the client machine until the official Results phase.

---

## 2. Visual Identity & Three.js 3D World

- **Theme**: *Digital Mind Arena* — Obsidian/midnight-blue depths, graphite surfaces, electric blue/cyan and violet accents, restrained amber alerts.
- **Three.js 3D Central Mind Core**:
  - Rotating concentric Torus rings with wireframe icosahedron core.
  - Floating 3D dimensional number cubes generated with canvas textures.
  - 700+ ambient neural particle dust nodes with subtle drifting.
  - Pointer-responsive camera parallax with smooth lerp interpolation.
  - State-reactive lighting: Serene cyan in Lobby, atmospheric violet in Question phase, urgent amber pulse in last 10 seconds, and victory celebration in Results.
  - Complete WebGL detection and automatic CSS/Canvas particle fallback (`CanvasFallback.tsx`) for low-power or WebGL-disabled devices.
- **Synthesized Audio Engine**:
  - Procedural Web Audio API sound generator (no external MP3 dependencies that could fail).
  - Chimes, button clicks, round start gong, timer ticks, urgent heartbeats, lock-in sounds, chord reveals, and victory fanfares.
  - Independent SFX & Music volume sliders and mute controls.

---

## 3. Server-Authoritative Scoring System

| Guess Difference | Points | Accuracy Metric |
| :--- | :---: | :---: |
| **Exact Match** (diff = 0) | **100 pts** | 100% |
| **1 to 2** away | **75 pts** | 98% – 99% |
| **3 to 5** away | **50 pts** | 95% – 97% |
| **6 to 10** away | **25 pts** | 90% – 94% |
| **More than 10** away | **0 pts** | < 90% |
| **No guess submitted** | **0 pts** | 0% |

- **First Exact Guess Bonus**: An additional **+10 bonus points** is awarded to the earliest player who locks in an exact match in the round based on authoritative server receipt timestamps.
- **Tie-Breaking**: Cumulative match score descending, broken by exact match count descending.

---

## 4. Architecture & Real-Time Event Contracts

```
Client (React 19 + Three.js + Tailwind)
   ▲                                ▲
   │  WebSocket (Socket.IO)         │  REST Endpoints (/api/health, /api/rooms)
   ▼                                ▼
Node.js + Express Persistent Server
   ├── GameEngine (Room State Machine, Authoritative Timers, Scorer, Security Projection)
   ├── Matchmaker (Public Queue & Auto-Dispatch)
   ├── AntiCheat (Input Sanitization, Guess Range Validation, Rate Limiter)
   └── Database Schema (Supabase PostgreSQL with Row Level Security)
```

### Key Socket Events
- `room:create` / `room:join` / `room:leave` / `room:ready` / `room:start`
- `matchmaking:join` / `matchmaking:cancel` / `matchmaking:status`
- `game:ask-question` / `game:submit-answer`
- `game:submit-guess` / `game:player-guessed`
- `game:state` (Tailored per-player projection)
- `game:next-round` / `game:rematch` / `game:return-lobby`

---

## 5. Automated Tests

The codebase includes comprehensive unit, security, and multi-client simulation tests:
1. `server/tests/scoring.test.js`: All scoring table boundaries, accuracy calculations, first exact bonus, tie breaking.
2. `server/tests/securityAntiCheat.test.js`: Unique number generation, Golden Rule projection verification, guess validation, HTML sanitization, rate limiting.
3. `server/tests/e2eSimulation.test.js`: Full 3 concurrent Socket.IO clients running an entire match from creation to questions, answers, guessing, and results.

Run all tests:
```bash
npm test
```

---

## 6. Local Development & Production Run

### Prerequisites
- Node.js (v18+) & npm

### Development
1. Start backend server:
```bash
npm run server
```
2. In another terminal, start Vite dev server:
```bash
npm run dev
```

### Production Build & Run
```bash
npm run build
npm start
```
The server will host the full application and WebSockets at `http://localhost:3001`.

---

## 7. Database Migrations (Supabase)

The complete SQL migration is located at:
`server/db/schema.sql`

Includes:
- `profiles` table (persistent stats)
- `game_rooms` table (lifecycle, settings, expiry)
- `room_members` table (roster, connection status)
- `game_rounds` table (phase, authoritative deadlines)
- `round_players` table (protected secret numbers with RLS)
- `game_messages` table (Q&A history)
- `matchmaking_queue` table
- Row Level Security (RLS) policies preventing clients from querying active secret numbers.

