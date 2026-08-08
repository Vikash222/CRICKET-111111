-- Production data persistence fix
-- Ensures profile fields exist and authorized application writes reach Supabase.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'english';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS jersey_number INT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS playing_role player_role;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS batting_style batting_style;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bowling_style bowling_style;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- Public read access for entities shown in the app.
DROP POLICY IF EXISTS "Public read colleges" ON public.colleges;
CREATE POLICY "Public read colleges" ON public.colleges FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read teams" ON public.teams;
CREATE POLICY "Public read teams" ON public.teams FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read tournaments" ON public.tournaments;
CREATE POLICY "Public read tournaments" ON public.tournaments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read matches" ON public.matches;
CREATE POLICY "Public read matches" ON public.matches FOR SELECT USING (true);

-- Authorized creation. Keep authorization server-side through RLS.
DROP POLICY IF EXISTS "Authorized create colleges" ON public.colleges;
CREATE POLICY "Authorized create colleges" ON public.colleges FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role::TEXT IN ('college_admin','organizer','super_admin')
  )
);

DROP POLICY IF EXISTS "Authorized update colleges" ON public.colleges;
CREATE POLICY "Authorized update colleges" ON public.colleges FOR UPDATE TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::TEXT IN ('college_admin','super_admin'))
)
WITH CHECK (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::TEXT IN ('college_admin','super_admin'))
);

DROP POLICY IF EXISTS "Authorized create tournaments" ON public.tournaments;
CREATE POLICY "Authorized create tournaments" ON public.tournaments FOR INSERT TO authenticated
WITH CHECK (
  organizer_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::TEXT IN ('tournament_organizer','organizer','super_admin'))
);

DROP POLICY IF EXISTS "Authorized update tournaments" ON public.tournaments;
CREATE POLICY "Authorized update tournaments" ON public.tournaments FOR UPDATE TO authenticated
USING (
  organizer_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::TEXT = 'super_admin')
)
WITH CHECK (
  organizer_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::TEXT = 'super_admin')
);

-- Profile updates: users can update their own profile but never elevate their role.
DROP POLICY IF EXISTS "Users edit own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users edit own profile without role escalation" ON public.profiles;
CREATE POLICY "Users edit own profile without role escalation" ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
);

GRANT SELECT ON public.colleges, public.teams, public.tournaments, public.matches TO anon, authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT, UPDATE ON public.colleges, public.tournaments TO authenticated;
