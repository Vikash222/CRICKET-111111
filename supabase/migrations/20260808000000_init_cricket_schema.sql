-- =============================================================================
-- COLLEGE CRICKET MANAGEMENT & LIVE SCORING PLATFORM
-- PostgreSQL / Supabase Complete Production Database Schema
-- Migration File: 20260808000000_init_cricket_schema.sql
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM (
  'super_admin',
  'college_admin',
  'tournament_organizer',
  'team_manager',
  'scorer',
  'player',
  'spectator'
);

CREATE TYPE batting_style AS ENUM ('right_hand', 'left_hand');
CREATE TYPE bowling_style AS ENUM ('right_arm_fast', 'right_arm_medium', 'right_arm_spin', 'left_arm_fast', 'left_arm_medium', 'left_arm_spin', 'none');
CREATE TYPE player_role AS ENUM ('batsman', 'bowler', 'all_rounder', 'wicket_keeper');

CREATE TYPE match_format AS ENUM ('t10', 't20', '30_overs', '40_overs', '50_overs', 'custom');
CREATE TYPE ball_type AS ENUM ('leather', 'tennis_heavy', 'tennis_light');
CREATE TYPE match_status AS ENUM ('scheduled', 'toss', 'live', 'innings_break', 'completed', 'abandoned', 'cancelled');
CREATE TYPE toss_decision AS ENUM ('bat', 'bowl');

CREATE TYPE extra_type AS ENUM ('none', 'wide', 'no_ball', 'bye', 'leg_bye', 'penalty');
CREATE TYPE wicket_type AS ENUM ('bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket', 'retired_hurt', 'obstructing_field', 'timed_out', 'other');

CREATE TYPE tournament_type AS ENUM ('league', 'round_robin', 'knockout', 'league_knockout', 'custom');

-- -----------------------------------------------------------------------------
-- 1. PROFILES & ROLES
-- -----------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  gender TEXT,
  date_of_birth DATE,
  role user_role NOT NULL DEFAULT 'player',
  college_id UUID,
  city TEXT,
  state TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. COLLEGES
-- -----------------------------------------------------------------------------

CREATE TABLE public.colleges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  short_code TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  website TEXT,
  description TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles 
  ADD CONSTRAINT fk_profiles_college 
  FOREIGN KEY (college_id) REFERENCES public.colleges(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 3. TEAMS & MEMBERS
-- -----------------------------------------------------------------------------

CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  logo_url TEXT,
  jersey_color TEXT,
  captain_id UUID REFERENCES public.profiles(id),
  vice_captain_id UUID REFERENCES public.profiles(id),
  wicket_keeper_id UUID REFERENCES public.profiles(id),
  manager_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  jersey_number INT,
  playing_role player_role NOT NULL DEFAULT 'batsman',
  batting_style batting_style NOT NULL DEFAULT 'right_hand',
  bowling_style bowling_style NOT NULL DEFAULT 'right_arm_medium',
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, player_id)
);

-- -----------------------------------------------------------------------------
-- 4. TOURNAMENTS
-- -----------------------------------------------------------------------------

CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  organizer_id UUID REFERENCES public.profiles(id),
  college_id UUID REFERENCES public.colleges(id),
  logo_url TEXT,
  tournament_type tournament_type NOT NULL DEFAULT 'league_knockout',
  overs_per_match INT DEFAULT 20,
  ball_type ball_type DEFAULT 'leather',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  venue TEXT NOT NULL,
  rules TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.tournament_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  group_name TEXT DEFAULT 'A',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, team_id)
);

-- -----------------------------------------------------------------------------
-- 5. MATCHES, INNINGS & LINEUPS
-- -----------------------------------------------------------------------------

CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
  team_a_id UUID NOT NULL REFERENCES public.teams(id),
  team_b_id UUID NOT NULL REFERENCES public.teams(id),
  venue TEXT NOT NULL,
  match_date TIMESTAMPTZ NOT NULL,
  format match_format DEFAULT 't20',
  total_overs INT NOT NULL DEFAULT 20,
  ball_type ball_type DEFAULT 'leather',
  status match_status DEFAULT 'scheduled',
  
  toss_winner_id UUID REFERENCES public.teams(id),
  toss_decision toss_decision,
  
  first_innings_team_id UUID REFERENCES public.teams(id),
  second_innings_team_id UUID REFERENCES public.teams(id),
  
  scorer_id UUID REFERENCES public.profiles(id),
  winner_id UUID REFERENCES public.teams(id),
  result_summary TEXT,
  player_of_match_id UUID REFERENCES public.profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.match_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_playing_xi BOOLEAN DEFAULT TRUE,
  is_captain BOOLEAN DEFAULT FALSE,
  is_vice_captain BOOLEAN DEFAULT FALSE,
  is_wicket_keeper BOOLEAN DEFAULT FALSE,
  UNIQUE(match_id, player_id)
);

CREATE TABLE public.innings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  batting_team_id UUID NOT NULL REFERENCES public.teams(id),
  bowling_team_id UUID NOT NULL REFERENCES public.teams(id),
  innings_number INT NOT NULL CHECK (innings_number IN (1, 2)),
  total_runs INT DEFAULT 0,
  total_wickets INT DEFAULT 0,
  total_overs NUMERIC(4,1) DEFAULT 0.0,
  target_runs INT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, innings_number)
);

-- -----------------------------------------------------------------------------
-- 6. BALL-BY-BALL DELIVERIES & WICKETS
-- -----------------------------------------------------------------------------

CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  innings_id UUID NOT NULL REFERENCES public.innings(id) ON DELETE CASCADE,
  over_number INT NOT NULL,
  ball_number INT NOT NULL,
  legal_ball_number INT NOT NULL,
  
  striker_id UUID NOT NULL REFERENCES public.profiles(id),
  non_striker_id UUID NOT NULL REFERENCES public.profiles(id),
  bowler_id UUID NOT NULL REFERENCES public.profiles(id),
  
  runs_bat INT DEFAULT 0,
  runs_extra INT DEFAULT 0,
  total_runs INT DEFAULT 0,
  extra_type extra_type DEFAULT 'none',
  
  is_wicket BOOLEAN DEFAULT FALSE,
  wicket_type wicket_type,
  dismissed_player_id UUID REFERENCES public.profiles(id),
  fielder_id UUID REFERENCES public.profiles(id),
  
  commentary TEXT,
  scorer_id UUID REFERENCES public.profiles(id),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. POINTS TABLE & STATISTICS (DERIVED & CACHED)
-- -----------------------------------------------------------------------------

CREATE TABLE public.points_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  matches_played INT DEFAULT 0,
  won INT DEFAULT 0,
  lost INT DEFAULT 0,
  tied INT DEFAULT 0,
  no_result INT DEFAULT 0,
  points INT DEFAULT 0,
  net_run_rate NUMERIC(6,3) DEFAULT 0.000,
  runs_scored INT DEFAULT 0,
  overs_faced NUMERIC(6,1) DEFAULT 0.0,
  runs_conceded INT DEFAULT 0,
  overs_bowled NUMERIC(6,1) DEFAULT 0.0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, team_id)
);

CREATE TABLE public.player_career_stats (
  player_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  matches INT DEFAULT 0,
  innings INT DEFAULT 0,
  not_outs INT DEFAULT 0,
  runs INT DEFAULT 0,
  highest_score INT DEFAULT 0,
  highest_score_not_out BOOLEAN DEFAULT FALSE,
  balls_faced INT DEFAULT 0,
  fours INT DEFAULT 0,
  sixes INT DEFAULT 0,
  fifties INT DEFAULT 0,
  hundreds DEFAULT 0 INT,
  ducks INT DEFAULT 0,
  
  bowling_innings INT DEFAULT 0,
  balls_bowled INT DEFAULT 0,
  runs_conceded INT DEFAULT 0,
  wickets INT DEFAULT 0,
  maidens INT DEFAULT 0,
  best_bowling_wickets INT DEFAULT 0,
  best_bowling_runs INT DEFAULT 0,
  three_wickets INT DEFAULT 0,
  five_wickets INT DEFAULT 0,
  
  catches INT DEFAULT 0,
  stumpings INT DEFAULT 0,
  run_outs INT DEFAULT 0,
  man_of_matches INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 8. ACHIEVEMENTS & AUDIT LOGS
-- -----------------------------------------------------------------------------

CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  badge_icon TEXT NOT NULL
);

CREATE TABLE public.player_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.matches(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, achievement_id)
);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  original_data JSONB,
  updated_data JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_career_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ ACCESS FOR SPECTATORS/ALL USERS
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public read colleges" ON public.colleges FOR SELECT USING (true);
CREATE POLICY "Public read teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Public read tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Public read deliveries" ON public.deliveries FOR SELECT USING (true);
CREATE POLICY "Public read points_table" ON public.points_table FOR SELECT USING (true);
CREATE POLICY "Public read stats" ON public.player_career_stats FOR SELECT USING (true);

-- USER PROFILE EDIT POLICY
CREATE POLICY "Users edit own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- SCORER MATCH SCORING POLICY
CREATE POLICY "Scorers insert deliveries" ON public.deliveries 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE matches.id = match_id 
      AND (matches.scorer_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'tournament_organizer')
      ))
    )
  );

-- ADMIN AUDIT LOGS
CREATE POLICY "Admins read audit logs" ON public.audit_logs 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );
