-- Production authentication/profile setup.
-- New users are created as players. Elevated roles must be assigned by an admin.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), split_part(COALESCE(NEW.email, 'player'), '@', 1)),
    'player'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP POLICY IF EXISTS "Users edit own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id AND role = 'player');

CREATE POLICY "Users edit own profile without role escalation" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()));

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
