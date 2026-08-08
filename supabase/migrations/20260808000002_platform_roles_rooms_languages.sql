-- CollegeCricket.live production role, room, language and governance layer
-- Run AFTER 20260808000000_init_cricket_schema.sql and auth profile migration.

DO $$ BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'organizer'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'captain'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'umpire'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'english' CHECK (language IN ('english','hindi','punjabi')),
  ADD COLUMN IF NOT EXISTS jersey_number INT,
  ADD COLUMN IF NOT EXISTS playing_role player_role,
  ADD COLUMN IF NOT EXISTS batting_style batting_style,
  ADD COLUMN IF NOT EXISTS bowling_style bowling_style,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id);

CREATE TABLE IF NOT EXISTS public.match_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code TEXT NOT NULL UNIQUE,
  room_name TEXT NOT NULL,
  match_id UUID UNIQUE REFERENCES public.matches(id) ON DELETE SET NULL,
  organizer_id UUID NOT NULL REFERENCES public.profiles(id),
  venue TEXT NOT NULL,
  city TEXT,
  state TEXT,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES public.match_rooms(id);
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS public_share_code TEXT UNIQUE;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id);

CREATE TABLE IF NOT EXISTS public.match_officials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  official_id UUID NOT NULL REFERENCES public.profiles(id),
  official_role TEXT NOT NULL CHECK (official_role IN ('organizer','umpire','scorer')),
  assigned_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, official_id, official_role)
);

CREATE TABLE IF NOT EXISTS public.correction_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.profiles(id),
  reason TEXT NOT NULL,
  original_data JSONB,
  proposed_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profile_deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES public.profiles(id),
  requested_by UUID NOT NULL REFERENCES public.profiles(id),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.player_match_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id),
  team_id UUID REFERENCES public.teams(id),
  runs INT NOT NULL DEFAULT 0,
  balls_faced INT NOT NULL DEFAULT 0,
  fours INT NOT NULL DEFAULT 0,
  sixes INT NOT NULL DEFAULT 0,
  wickets INT NOT NULL DEFAULT 0,
  balls_bowled INT NOT NULL DEFAULT 0,
  runs_conceded INT NOT NULL DEFAULT 0,
  maidens INT NOT NULL DEFAULT 0,
  catches INT NOT NULL DEFAULT 0,
  stumpings INT NOT NULL DEFAULT 0,
  run_outs INT NOT NULL DEFAULT 0,
  is_out BOOLEAN NOT NULL DEFAULT FALSE,
  player_of_match BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

CREATE TABLE IF NOT EXISTS public.player_tournament_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id),
  matches INT NOT NULL DEFAULT 0,
  runs INT NOT NULL DEFAULT 0,
  wickets INT NOT NULL DEFAULT 0,
  batting_average NUMERIC(8,2) NOT NULL DEFAULT 0,
  strike_rate NUMERIC(8,2) NOT NULL DEFAULT 0,
  economy NUMERIC(8,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tournament_id, player_id)
);

CREATE TABLE IF NOT EXISTS public.match_followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  guest_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (user_id IS NOT NULL OR guest_token IS NOT NULL),
  UNIQUE(match_id, user_id),
  UNIQUE(match_id, guest_token)
);

CREATE OR REPLACE FUNCTION public.generate_match_room_code()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE code TEXT;
BEGIN
  LOOP
    code := 'CCL-' || TO_CHAR(NOW(), 'YYYY') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.match_rooms WHERE room_code = code);
  END LOOP;
  RETURN code;
END;
$$;

-- Players cannot promote themselves. Organizers may promote a player to captain/umpire.
CREATE OR REPLACE FUNCTION public.protect_profile_role_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor_role TEXT;
BEGIN
  IF OLD.role = NEW.role THEN RETURN NEW; END IF;
  SELECT role::TEXT INTO actor_role FROM public.profiles WHERE id = auth.uid();
  IF actor_role = 'super_admin' THEN RETURN NEW; END IF;
  IF actor_role = 'organizer' AND OLD.role::TEXT = 'player' AND NEW.role::TEXT IN ('captain','umpire') THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'Role changes are restricted to authorized administrators';
END;
$$;
DROP TRIGGER IF EXISTS protect_profile_role_change ON public.profiles;
CREATE TRIGGER protect_profile_role_change BEFORE UPDATE OF role ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role_change();

-- Soft deletion preserves historical cricket data and is allowed only after all matches involving the player are finished.
CREATE OR REPLACE FUNCTION public.soft_delete_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor_role TEXT;
BEGIN
  SELECT role::TEXT INTO actor_role FROM public.profiles WHERE id = auth.uid();
  IF actor_role IS DISTINCT FROM 'super_admin' THEN RAISE EXCEPTION 'Only Super Admin can delete profiles'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.match_players mp JOIN public.matches m ON m.id = mp.match_id
    WHERE mp.player_id = OLD.id AND m.status::TEXT NOT IN ('completed','abandoned','cancelled')
  ) THEN RAISE EXCEPTION 'Player cannot be deleted while an active or scheduled match exists'; END IF;
  UPDATE public.profiles SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = auth.uid(), full_name = 'Deleted Player', avatar_url = NULL WHERE id = OLD.id;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS prevent_profile_hard_delete ON public.profiles;
CREATE TRIGGER prevent_profile_hard_delete BEFORE DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.soft_delete_profile();

-- Player profile images. The application uploads to avatars/{user_id}/...
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Public read player avatars" ON storage.objects;
CREATE POLICY "Public read player avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text) WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

ALTER TABLE public.match_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_match_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_tournament_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read public match rooms" ON public.match_rooms;
CREATE POLICY "Public read public match rooms" ON public.match_rooms FOR SELECT USING (is_public = TRUE);
DROP POLICY IF EXISTS "Organizers create match rooms" ON public.match_rooms;
CREATE POLICY "Organizers create match rooms" ON public.match_rooms FOR INSERT TO authenticated WITH CHECK (organizer_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::TEXT IN ('organizer','super_admin')));
DROP POLICY IF EXISTS "Organizers update match rooms" ON public.match_rooms;
CREATE POLICY "Organizers update match rooms" ON public.match_rooms FOR UPDATE TO authenticated USING (organizer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::TEXT = 'super_admin'));

DROP POLICY IF EXISTS "Public read match officials" ON public.match_officials;
CREATE POLICY "Public read match officials" ON public.match_officials FOR SELECT USING (true);
DROP POLICY IF EXISTS "Organizers manage match officials" ON public.match_officials;
CREATE POLICY "Organizers manage match officials" ON public.match_officials FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::TEXT IN ('organizer','super_admin'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::TEXT IN ('organizer','super_admin')));

DROP POLICY IF EXISTS "Public read player match stats" ON public.player_match_stats;
CREATE POLICY "Public read player match stats" ON public.player_match_stats FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read player tournament stats" ON public.player_tournament_stats;
CREATE POLICY "Public read player tournament stats" ON public.player_tournament_stats FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage own followers" ON public.match_followers;
CREATE POLICY "Users manage own followers" ON public.match_followers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Public can follow with guest token" ON public.match_followers;
CREATE POLICY "Public can follow with guest token" ON public.match_followers FOR INSERT WITH CHECK (guest_token IS NOT NULL AND user_id IS NULL);

DROP POLICY IF EXISTS "Users request profile deletion" ON public.profile_deletion_requests;
CREATE POLICY "Users request profile deletion" ON public.profile_deletion_requests FOR INSERT TO authenticated WITH CHECK (requested_by = auth.uid() AND player_id = auth.uid());
DROP POLICY IF EXISTS "Admins review profile deletion" ON public.profile_deletion_requests;
CREATE POLICY "Admins review profile deletion" ON public.profile_deletion_requests FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::TEXT = 'super_admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::TEXT = 'super_admin'));

DROP POLICY IF EXISTS "Users request corrections" ON public.correction_requests;
CREATE POLICY "Users request corrections" ON public.correction_requests FOR INSERT TO authenticated WITH CHECK (requested_by = auth.uid());
DROP POLICY IF EXISTS "Admins review corrections" ON public.correction_requests;
CREATE POLICY "Admins review corrections" ON public.correction_requests FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::TEXT IN ('organizer','super_admin'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::TEXT IN ('organizer','super_admin')));

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.matches; EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries; EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.match_rooms; EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END $$;
