-- Allow an authenticated player to create their own team and become its manager.
-- This fixes: new row violates row-level security policy for table "teams".

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users create own teams" ON public.teams;
CREATE POLICY "Authenticated users create own teams"
ON public.teams
FOR INSERT
TO authenticated
WITH CHECK (manager_id = auth.uid());

DROP POLICY IF EXISTS "Team managers update own teams" ON public.teams;
CREATE POLICY "Team managers update own teams"
ON public.teams
FOR UPDATE
TO authenticated
USING (manager_id = auth.uid())
WITH CHECK (manager_id = auth.uid());

DROP POLICY IF EXISTS "Users add themselves to owned team" ON public.team_members;
CREATE POLICY "Users add themselves to owned team"
ON public.team_members
FOR INSERT
TO authenticated
WITH CHECK (
  player_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.teams t
    WHERE t.id = team_id
      AND t.manager_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Team members read memberships" ON public.team_members;
CREATE POLICY "Team members read memberships"
ON public.team_members
FOR SELECT
TO authenticated
USING (player_id = auth.uid() OR EXISTS (
  SELECT 1
  FROM public.teams t
  WHERE t.id = team_id
    AND t.manager_id = auth.uid()
));

DROP POLICY IF EXISTS "Team managers update memberships" ON public.team_members;
CREATE POLICY "Team managers update memberships"
ON public.team_members
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.teams t
  WHERE t.id = team_id AND t.manager_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.teams t
  WHERE t.id = team_id AND t.manager_id = auth.uid()
));

DROP POLICY IF EXISTS "Team managers delete memberships" ON public.team_members;
CREATE POLICY "Team managers delete memberships"
ON public.team_members
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.teams t
  WHERE t.id = team_id AND t.manager_id = auth.uid()
));
