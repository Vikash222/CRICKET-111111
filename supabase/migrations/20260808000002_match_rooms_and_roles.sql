-- Match rooms + simplified platform roles
-- Run after the initial cricket schema.

-- Keep legacy roles for backward compatibility, while adding the new product roles.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'organizer';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'captain';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'umpire';

CREATE TABLE IF NOT EXISTS public.match_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code TEXT NOT NULL UNIQUE,
  room_name TEXT NOT NULL,
  match_name TEXT NOT NULL,
  venue TEXT NOT NULL,
  organizer_id UUID NOT NULL REFERENCES public.profiles(id),
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live','completed','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_match_rooms_status ON public.match_rooms(status);
CREATE INDEX IF NOT EXISTS idx_match_rooms_organizer ON public.match_rooms(organizer_id);

-- Maximum 8 simultaneously live rooms, enforced in the database.
CREATE OR REPLACE FUNCTION public.enforce_max_live_match_rooms()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'live' THEN
    IF (
      SELECT COUNT(*) FROM public.match_rooms
      WHERE status = 'live' AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) >= 8 THEN
      RAISE EXCEPTION 'Maximum 8 live match rooms are allowed at one time';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_max_live_match_rooms ON public.match_rooms;
CREATE TRIGGER trg_max_live_match_rooms
BEFORE INSERT OR UPDATE OF status ON public.match_rooms
FOR EACH ROW EXECUTE FUNCTION public.enforce_max_live_match_rooms();

ALTER TABLE public.match_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view live match rooms" ON public.match_rooms;
CREATE POLICY "Public can view live match rooms"
ON public.match_rooms FOR SELECT
USING (status IN ('live','completed'));

DROP POLICY IF EXISTS "Organizers can create match rooms" ON public.match_rooms;
CREATE POLICY "Organizers can create match rooms"
ON public.match_rooms FOR INSERT
WITH CHECK (
  auth.uid() = organizer_id
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','organizer','tournament_organizer')
  )
);

DROP POLICY IF EXISTS "Organizers can update own rooms" ON public.match_rooms;
CREATE POLICY "Organizers can update own rooms"
ON public.match_rooms FOR UPDATE
USING (
  auth.uid() = organizer_id
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
)
WITH CHECK (
  auth.uid() = organizer_id
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
);

-- Public realtime updates for room status/list changes.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.match_rooms;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
