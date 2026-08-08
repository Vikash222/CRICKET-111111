-- Reliable team creation: use the authenticated Supabase identity on the server.
-- This avoids client-side manager_id mismatches while keeping RLS enabled.

create or replace function public.create_team(
  p_name text,
  p_short_name text,
  p_college_id uuid default null
)
returns public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  new_team public.teams;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Authentication required';
  end if;

  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Team name is required';
  end if;

  if p_short_name is null or length(trim(p_short_name)) = 0 then
    raise exception 'Team short name is required';
  end if;

  insert into public.teams (name, short_name, college_id, manager_id)
  values (trim(p_name), upper(trim(p_short_name)), p_college_id, uid)
  returning * into new_team;

  insert into public.team_members (team_id, player_id, is_active)
  values (new_team.id, uid, true)
  on conflict (team_id, player_id) do update set is_active = true;

  return new_team;
end;
$$;

revoke all on function public.create_team(text, text, uuid) from public;
grant execute on function public.create_team(text, text, uuid) to authenticated;
