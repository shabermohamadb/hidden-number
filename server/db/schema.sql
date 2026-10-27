-- ====================================================================
-- HIDDEN NUMBER — Production Database Schema & RLS Policies (Supabase)
-- Complete Player Profile, Stats, Progression & Social Architecture
-- ====================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id TEXT UNIQUE NOT NULL, -- Stable public player identifier
  username VARCHAR(32) UNIQUE NOT NULL,
  avatar_url TEXT DEFAULT 'avatar-1',
  custom_avatar_data TEXT, -- Base64 validated image data if uploaded
  title VARCHAR(64) NOT NULL DEFAULT 'Deduction Novice',
  frame VARCHAR(64) NOT NULL DEFAULT 'frame-bronze',
  badge VARCHAR(64) NOT NULL DEFAULT 'badge-first-blood',
  bio VARCHAR(160) NOT NULL DEFAULT 'Decoding minds in the digital arena.',
  
  -- Progression
  xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  
  -- Verified Match Statistics
  games_played INT NOT NULL DEFAULT 0,
  wins INT NOT NULL DEFAULT 0,
  losses INT NOT NULL DEFAULT 0,
  draws INT NOT NULL DEFAULT 0,
  total_points INT NOT NULL DEFAULT 0,
  best_score INT NOT NULL DEFAULT 0,
  exact_guesses INT NOT NULL DEFAULT 0,
  total_guesses INT NOT NULL DEFAULT 0,
  correct_guesses INT NOT NULL DEFAULT 0,
  accuracy_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
  current_streak INT NOT NULL DEFAULT 0,
  best_streak INT NOT NULL DEFAULT 0,
  
  -- Privacy & Settings
  visibility VARCHAR(16) NOT NULL DEFAULT 'public', -- 'public', 'friends_only', 'private'
  sound_sfx INT NOT NULL DEFAULT 80,
  sound_music INT NOT NULL DEFAULT 60,
  reduced_motion BOOLEAN NOT NULL DEFAULT FALSE,
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  
  username_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Achievements Master Definition Table
CREATE TABLE IF NOT EXISTS public.achievements (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(32) NOT NULL DEFAULT 'deduction', -- 'deduction', 'victory', 'streak', 'mastery'
  tier VARCHAR(16) NOT NULL DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'obsidian'
  xp_reward INT NOT NULL DEFAULT 50,
  reward_type VARCHAR(32), -- 'title', 'frame', 'badge'
  reward_id VARCHAR(64),
  icon VARCHAR(32) NOT NULL DEFAULT 'Trophy',
  max_progress INT NOT NULL DEFAULT 1
);

-- 3. User Achievements Table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL REFERENCES public.profiles(player_id) ON DELETE CASCADE,
  achievement_id VARCHAR(64) NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  progress INT NOT NULL DEFAULT 0,
  unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ,
  CONSTRAINT unique_player_achievement UNIQUE (player_id, achievement_id)
);

-- 4. Match History Table (Server-Authoritative Match Records)
CREATE TABLE IF NOT EXISTS public.match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id TEXT NOT NULL, -- Unique idempotent match identifier
  player_id TEXT NOT NULL REFERENCES public.profiles(player_id) ON DELETE CASCADE,
  room_code VARCHAR(8) NOT NULL,
  rank INT NOT NULL,
  total_players INT NOT NULL,
  final_score INT NOT NULL,
  accuracy INT NOT NULL DEFAULT 0,
  exact_guesses INT NOT NULL DEFAULT 0,
  is_win BOOLEAN NOT NULL DEFAULT FALSE,
  opponents JSONB NOT NULL DEFAULT '[]', -- Array of { playerId, nickname, score, rank }
  played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_player_match UNIQUE (player_id, match_id)
);

-- 5. Friendships & Social Interactions Table
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 TEXT NOT NULL REFERENCES public.profiles(player_id) ON DELETE CASCADE,
  user_id_2 TEXT NOT NULL REFERENCES public.profiles(player_id) ON DELETE CASCADE,
  status VARCHAR(16) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
  action_user_id TEXT NOT NULL REFERENCES public.profiles(player_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_friend_pair UNIQUE (user_id_1, user_id_2)
);

-- 6. Player Reports Table
CREATE TABLE IF NOT EXISTS public.player_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id TEXT NOT NULL REFERENCES public.profiles(player_id) ON DELETE CASCADE,
  reported_id TEXT NOT NULL REFERENCES public.profiles(player_id) ON DELETE CASCADE,
  reason VARCHAR(64) NOT NULL,
  details VARCHAR(500),
  status VARCHAR(16) NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'dismissed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Game Rooms Table
CREATE TABLE IF NOT EXISTS public.game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(8) UNIQUE NOT NULL,
  host_id TEXT NOT NULL,
  visibility VARCHAR(16) NOT NULL DEFAULT 'public',
  status VARCHAR(24) NOT NULL DEFAULT 'LOBBY',
  current_round INT NOT NULL DEFAULT 1,
  max_players INT NOT NULL DEFAULT 10,
  min_players INT NOT NULL DEFAULT 3,
  settings JSONB NOT NULL DEFAULT '{"questionTime": 60, "guessTime": 15, "numberRange": [1, 100], "totalRounds": 3}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '4 hours')
);

-- 8. Room Members Table
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

-- 9. Game Rounds Table
CREATE TABLE IF NOT EXISTS public.game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  phase VARCHAR(24) NOT NULL DEFAULT 'QUESTION_PHASE',
  question_deadline TIMESTAMPTZ,
  guess_deadline TIMESTAMPTZ,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Round Players Table (STRICT PROTECTED TABLE: Contains Secret Numbers)
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

-- 11. Game Messages Table (Q&A Feed)
CREATE TABLE IF NOT EXISTS public.game_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  round_number INT NOT NULL DEFAULT 1,
  sender_id TEXT NOT NULL,
  sender_name VARCHAR(32) NOT NULL,
  target_player_id TEXT,
  message_type VARCHAR(16) NOT NULL DEFAULT 'question',
  content TEXT NOT NULL,
  reply_to_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_player_id ON public.profiles(player_id);
CREATE INDEX IF NOT EXISTS idx_match_history_player ON public.match_history(player_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_friendships_users ON public.friendships(user_id_1, user_id_2, status);
CREATE INDEX IF NOT EXISTS idx_user_achievements_player ON public.user_achievements(player_id);
CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.game_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_members_room ON public.room_members(room_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_players ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read subject to privacy, owner update
CREATE POLICY "Public profiles viewable by everyone" ON public.profiles
  FOR SELECT USING (visibility = 'public' OR auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Achievements: Master read by all
CREATE POLICY "Achievements readable by all" ON public.achievements
  FOR SELECT USING (true);
CREATE POLICY "User achievements viewable by player" ON public.user_achievements
  FOR SELECT USING (true);

-- Match History: Viewable if profile is public or user is owner
CREATE POLICY "Match history viewable" ON public.match_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.player_id = match_history.player_id
      AND (p.visibility = 'public' OR p.user_id = auth.uid())
    )
  );

-- Friendships: Only involved users can see and modify
CREATE POLICY "Users can view their friendships" ON public.friendships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND (p.player_id = friendships.user_id_1 OR p.player_id = friendships.user_id_2)
    )
  );
