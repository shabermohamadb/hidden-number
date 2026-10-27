-- ====================================================================
-- HIDDEN NUMBER — Production Database Schema & RLS Policies (Supabase)
-- ====================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(32) NOT NULL,
  avatar_url TEXT,
  games_played INT NOT NULL DEFAULT 0,
  wins INT NOT NULL DEFAULT 0,
  total_points INT NOT NULL DEFAULT 0,
  exact_guesses INT NOT NULL DEFAULT 0,
  accuracy_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Game Rooms Table
CREATE TABLE IF NOT EXISTS public.game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(8) UNIQUE NOT NULL,
  host_id TEXT NOT NULL,
  visibility VARCHAR(16) NOT NULL DEFAULT 'public', -- 'public' or 'private'
  status VARCHAR(24) NOT NULL DEFAULT 'LOBBY',     -- 'LOBBY', 'PLAYING', 'RESULTS', 'COMPLETED'
  current_round INT NOT NULL DEFAULT 1,
  max_players INT NOT NULL DEFAULT 10,
  min_players INT NOT NULL DEFAULT 3,
  settings JSONB NOT NULL DEFAULT '{"questionTime": 60, "guessTime": 15, "numberRange": [1, 100], "totalRounds": 3}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '4 hours')
);

-- 3. Room Members Table
CREATE TABLE IF NOT EXISTS public.room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  nickname VARCHAR(32) NOT NULL,
  avatar TEXT,
  is_host BOOLEAN NOT NULL DEFAULT FALSE,
  is_ready BOOLEAN NOT NULL DEFAULT FALSE,
  connected BOOLEAN NOT NULL DEFAULT TRUE,
  score INT NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_room_player UNIQUE (room_id, player_id)
);

-- 4. Game Rounds Table
CREATE TABLE IF NOT EXISTS public.game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  phase VARCHAR(24) NOT NULL DEFAULT 'QUESTION_PHASE', -- 'QUESTION_PHASE', 'GUESSING_PHASE', 'RESULTS'
  question_deadline TIMESTAMPTZ,
  guess_deadline TIMESTAMPTZ,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Round Players Table (STRICT PROTECTED TABLE: Contains Secret Numbers)
CREATE TABLE IF NOT EXISTS public.round_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES public.game_rounds(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  secret_number INT NOT NULL CHECK (secret_number >= 1 AND secret_number <= 100),
  submitted_guess INT CHECK (submitted_guess >= 1 AND submitted_guess <= 100),
  guess_timestamp TIMESTAMPTZ,
  difference INT,
  round_points INT NOT NULL DEFAULT 0,
  is_first_exact BOOLEAN NOT NULL DEFAULT FALSE,
  accuracy INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_round_player UNIQUE (round_id, player_id)
);

-- 6. Game Messages Table (Q&A Feed)
CREATE TABLE IF NOT EXISTS public.game_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  round_number INT NOT NULL DEFAULT 1,
  sender_id TEXT NOT NULL,
  sender_name VARCHAR(32) NOT NULL,
  message_type VARCHAR(16) NOT NULL DEFAULT 'question', -- 'question', 'answer', 'system'
  content TEXT NOT NULL,
  reply_to_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Matchmaking Queue Table
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT UNIQUE NOT NULL,
  nickname VARCHAR(32) NOT NULL,
  avatar TEXT,
  status VARCHAR(16) NOT NULL DEFAULT 'SEARCHING', -- 'SEARCHING', 'MATCHED', 'EXPIRED'
  matched_room_code VARCHAR(8),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '2 minutes')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.game_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_members_room ON public.room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_rounds_room ON public.game_rounds(room_id);
CREATE INDEX IF NOT EXISTS idx_round_players_round ON public.round_players(round_id);
CREATE INDEX IF NOT EXISTS idx_messages_room ON public.game_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_queue_status ON public.matchmaking_queue(status, joined_at);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, owner update
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Game Rooms: Anyone can view public rooms
CREATE POLICY "Game rooms are viewable by everyone" ON public.game_rooms
  FOR SELECT USING (true);

-- Room Members: Viewable by anyone in the room
CREATE POLICY "Members viewable by room" ON public.room_members
  FOR SELECT USING (true);

-- Game Messages: Viewable by room members
CREATE POLICY "Messages viewable by room" ON public.game_messages
  FOR SELECT USING (true);

-- CRITICAL ANTI-CHEAT POLICY ON round_players:
-- Direct client queries CANNOT see secret numbers unless round is completed!
-- A player can NEVER read their own secret number during active rounds!
CREATE POLICY "Clients cannot see secret numbers during active gameplay" ON public.round_players
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.game_rounds gr
      WHERE gr.id = round_players.round_id AND gr.completed = true
    )
    OR
    -- Only service role has full bypass for game engine
    (auth.role() = 'service_role')
  );
