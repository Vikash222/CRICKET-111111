-- Custom Organizer authentication: deliberately independent from Supabase Auth.
-- Player accounts continue to use auth.users. Organizer credentials live in this
-- dedicated table and are only accessed through SECURITY DEFINER RPCs.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.organizer_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.organizer_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES public.organizer_accounts(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '12 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizer_sessions_token ON public.organizer_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_organizer_sessions_organizer ON public.organizer_sessions(organizer_id);

ALTER TABLE public.organizer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_sessions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.organizer_accounts FROM anon, authenticated;
REVOKE ALL ON public.organizer_sessions FROM anon, authenticated;

-- No direct table access from the browser. Only the narrowly scoped RPCs below.

CREATE OR REPLACE FUNCTION public.organizer_login(p_email TEXT, p_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_org public.organizer_accounts;
  v_token TEXT;
BEGIN
  SELECT * INTO v_org
  FROM public.organizer_accounts
  WHERE lower(email) = lower(trim(p_email))
    AND status = 'active'
  LIMIT 1;

  IF v_org.id IS NULL OR NOT (v_org.password_hash = crypt(p_password, v_org.password_hash)) THEN
    RAISE EXCEPTION 'Invalid organizer credentials' USING ERRCODE = '28000';
  END IF;

  DELETE FROM public.organizer_sessions WHERE expires_at <= NOW();
  v_token := encode(gen_random_bytes(32), 'hex');

  INSERT INTO public.organizer_sessions (organizer_id, session_token)
  VALUES (v_org.id, v_token);

  UPDATE public.organizer_accounts
  SET last_login_at = NOW()
  WHERE id = v_org.id;

  RETURN jsonb_build_object(
    'session_token', v_token,
    'organizer', jsonb_build_object(
      'id', v_org.id,
      'email', v_org.email,
      'full_name', v_org.full_name,
      'role', 'organizer'
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.organizer_restore(p_session_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org public.organizer_accounts;
  v_session public.organizer_sessions;
BEGIN
  SELECT * INTO v_session
  FROM public.organizer_sessions
  WHERE session_token = p_session_token
    AND expires_at > NOW()
  LIMIT 1;

  IF v_session.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_org
  FROM public.organizer_accounts
  WHERE id = v_session.organizer_id AND status = 'active';

  IF v_org.id IS NULL THEN
    DELETE FROM public.organizer_sessions WHERE id = v_session.id;
    RETURN NULL;
  END IF;

  UPDATE public.organizer_sessions SET last_seen_at = NOW() WHERE id = v_session.id;

  RETURN jsonb_build_object(
    'id', v_org.id,
    'email', v_org.email,
    'full_name', v_org.full_name,
    'role', 'organizer'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.organizer_logout(p_session_token TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.organizer_sessions WHERE session_token = p_session_token;
  SELECT TRUE;
$$;

CREATE OR REPLACE FUNCTION public.organizer_list_teams(p_session_token TEXT)
RETURNS TABLE(id UUID, name TEXT, short_name TEXT, logo_url TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.organizer_sessions s
    JOIN public.organizer_accounts o ON o.id = s.organizer_id
    WHERE s.session_token = p_session_token AND s.expires_at > NOW() AND o.status = 'active'
  ) THEN RAISE EXCEPTION 'Organizer session expired' USING ERRCODE = '28000'; END IF;
  RETURN QUERY SELECT t.id, t.name, t.short_name, t.logo_url FROM public.teams t ORDER BY t.name;
END;
$$;

CREATE OR REPLACE FUNCTION public.organizer_list_rooms(p_session_token TEXT)
RETURNS TABLE(id UUID, room_code TEXT, room_name TEXT, match_name TEXT, venue TEXT, status TEXT, match_id UUID, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_org UUID;
BEGIN
  SELECT s.organizer_id INTO v_org FROM public.organizer_sessions s
  JOIN public.organizer_accounts o ON o.id = s.organizer_id
  WHERE s.session_token = p_session_token AND s.expires_at > NOW() AND o.status = 'active';
  IF v_org IS NULL THEN RAISE EXCEPTION 'Organizer session expired' USING ERRCODE = '28000'; END IF;
  RETURN QUERY SELECT r.id, r.room_code, r.room_name, r.match_name, r.venue, r.status, r.match_id, r.created_at
  FROM public.match_rooms r
  WHERE r.organizer_account_id = v_org ORDER BY r.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.organizer_create_room(
  p_session_token TEXT, p_room_name TEXT, p_match_name TEXT, p_venue TEXT,
  p_team_a_id UUID, p_team_b_id UUID, p_overs INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_org UUID; v_room public.match_rooms; v_match public.matches; v_code TEXT;
BEGIN
  SELECT s.organizer_id INTO v_org FROM public.organizer_sessions s
  JOIN public.organizer_accounts o ON o.id = s.organizer_id
  WHERE s.session_token = p_session_token AND s.expires_at > NOW() AND o.status = 'active';
  IF v_org IS NULL THEN RAISE EXCEPTION 'Organizer session expired' USING ERRCODE = '28000'; END IF;
  IF p_team_a_id IS NULL OR p_team_b_id IS NULL OR p_team_a_id = p_team_b_id THEN RAISE EXCEPTION 'Select two different teams'; END IF;
  IF p_overs < 1 OR p_overs > 50 THEN RAISE EXCEPTION 'Overs must be between 1 and 50'; END IF;
  IF (SELECT COUNT(*) FROM public.match_rooms WHERE status = 'live') >= 8 THEN RAISE EXCEPTION 'Maximum 8 live match rooms are allowed at one time'; END IF;

  v_code := 'CCL-' || EXTRACT(YEAR FROM NOW())::INT || '-' || upper(substr(encode(gen_random_bytes(5),'hex'),1,8));

  INSERT INTO public.match_rooms(room_code, room_name, match_name, venue, organizer_id, organizer_account_id, status, is_public)
  VALUES (v_code, trim(p_room_name), trim(p_match_name), trim(p_venue), NULL, v_org, 'live', TRUE)
  RETURNING * INTO v_room;

  INSERT INTO public.matches(team_a_id, team_b_id, venue, match_date, format, total_overs, status, current_innings_number, room_id, public_share_code)
  VALUES (p_team_a_id, p_team_b_id, trim(p_venue), NOW(), 't20', p_overs, 'live', 1, v_room.id, v_code)
  RETURNING * INTO v_match;

  UPDATE public.match_rooms SET match_id = v_match.id WHERE id = v_room.id;

  RETURN jsonb_build_object('room_id', v_room.id, 'match_id', v_match.id, 'room_code', v_code);
END;
$$;

REVOKE ALL ON FUNCTION public.organizer_login(TEXT,TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.organizer_restore(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.organizer_logout(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.organizer_list_teams(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.organizer_list_rooms(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.organizer_create_room(TEXT,TEXT,TEXT,TEXT,UUID,UUID,INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.organizer_login(TEXT,TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.organizer_restore(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.organizer_logout(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.organizer_list_teams(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.organizer_list_rooms(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.organizer_create_room(TEXT,TEXT,TEXT,TEXT,UUID,UUID,INT) TO anon, authenticated;

-- Custom organizer ownership does not use auth.users. Existing auth-based organizer policies remain for player-auth users.
ALTER TABLE public.match_rooms ADD COLUMN IF NOT EXISTS organizer_account_id UUID REFERENCES public.organizer_accounts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_match_rooms_organizer_account ON public.match_rooms(organizer_account_id);

-- Keep public viewing, but remove direct client writes for custom organizer rooms.
DROP POLICY IF EXISTS "Organizers can create match rooms" ON public.match_rooms;
DROP POLICY IF EXISTS "Organizers can update own rooms" ON public.match_rooms;

-- Seed is intentionally NOT included. Create the first organizer securely in Supabase SQL Editor:
-- INSERT INTO public.organizer_accounts(email, full_name, password_hash)
-- VALUES ('organizer@example.com', 'Tournament Organizer', crypt('CHANGE_ME_NOW', gen_salt('bf')));
