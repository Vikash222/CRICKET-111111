-- Custom organizer rooms do not have a profiles/auth.users identity.
ALTER TABLE public.match_rooms ALTER COLUMN organizer_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_match_rooms_organizer_account ON public.match_rooms(organizer_account_id);
