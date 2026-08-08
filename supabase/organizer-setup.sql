-- Run this ONCE in Supabase SQL Editor to create an organizer account.
-- Change the email, name and password before executing.
-- Password is hashed with bcrypt; plaintext is never stored.

INSERT INTO public.organizer_accounts (email, full_name, password_hash)
VALUES (
  'organizer@collegecricket.live',
  'College Cricket Organizer',
  crypt('CHANGE_THIS_PASSWORD_NOW', gen_salt('bf'))
)
ON CONFLICT (email) DO NOTHING;

-- Verify account (password hash is not exposed):
SELECT id, email, full_name, status, created_at, last_login_at
FROM public.organizer_accounts
ORDER BY created_at DESC;
