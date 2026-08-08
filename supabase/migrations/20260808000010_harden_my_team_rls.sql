-- My Team final RLS hardening.
-- Run this AFTER 20260808000008_my_team_foundation.sql and 20260808000009_create_team_rpc.sql.
-- The app should create teams through create_team(), not by inserting manager_id from the client.

alter table public.teams no force row level security;
alter table public.team_members no force row level security;
alter table public.team_join_requests no force row level security;

-- Direct team INSERT is intentionally kept available for authenticated clients,
-- but only when manager_id is exactly the current authenticated user.
drop policy if exists "teams_insert_self_manager" on public.teams;
create policy "teams_insert_self_manager" on public.teams
  for insert to authenticated
  with check (manager_id = (select auth.uid()));

-- Recreate the RPC so it always derives the owner from Supabase Auth.
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
  v_uid uuid := auth.uid();
  v_team public.teams;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(p_name), '') is null then
    raise exception 'Team name is required';
  end if;

  if nullif(trim(p_short_name), '') is null then
    raise exception 'Team short name is required';
  end if;

  insert into public.teams (name, short_name, college_id, manager_id)
  values (trim(p_name), upper(trim(p_short_name)), p_college_id, v_uid)
  returning * into v_team;

  insert into public.team_members (team_id, player_id, is_active)
  values (v_team.id, v_uid, true)
  on conflict (team_id, player_id)
  do update set is_active = true;

  return v_team;
end;
$$;

revoke all on function public.create_team(text, text, uuid) from public;
grant execute on function public.create_team(text, text, uuid) to authenticated;

-- Make sure team search is available to logged-in users.
drop policy if exists "teams_select_authenticated" on public.teams;
create policy "teams_select_authenticated" on public.teams
  for select to authenticated
  using (true);

-- A player can see their own memberships; a manager can see their squad.
drop policy if exists "team_members_select_own_or_manager" on public.team_members;
create policy "team_members_select_own_or_manager" on public.team_members
  for select to authenticated
  using (
    player_id = (select auth.uid())
    or exists (
      select 1 from public.teams t
      where t.id = team_members.team_id
        and t.manager_id = (select auth.uid())
    )
  );

-- A player can request to join a team; a manager can add/approve a player.
drop policy if exists "team_members_insert_self_or_manager" on public.team_members;
create policy "team_members_insert_self_or_manager" on public.team_members
  for insert to authenticated
  with check (
    player_id = (select auth.uid())
    or exists (
      select 1 from public.teams t
      where t.id = team_members.team_id
        and t.manager_id = (select auth.uid())
    )
  );

-- Join requests: player creates own request; manager can view/update requests for their team.
drop policy if exists "join_requests_select_own_or_manager" on public.team_join_requests;
create policy "join_requests_select_own_or_manager" on public.team_join_requests
  for select to authenticated
  using (
    player_id = (select auth.uid())
    or exists (
      select 1 from public.teams t
      where t.id = team_join_requests.team_id
        and t.manager_id = (select auth.uid())
    )
  );

drop policy if exists "join_requests_insert_self" on public.team_join_requests;
create policy "join_requests_insert_self" on public.team_join_requests
  for insert to authenticated
  with check (player_id = (select auth.uid()));

drop policy if exists "join_requests_update_self_or_manager" on public.team_join_requests;
create policy "join_requests_update_self_or_manager" on public.team_join_requests
  for update to authenticated
  using (
    player_id = (select auth.uid())
    or exists (
      select 1 from public.teams t
      where t.id = team_join_requests.team_id
        and t.manager_id = (select auth.uid())
    )
  )
  with check (
    player_id = (select auth.uid())
    or exists (
      select 1 from public.teams t
      where t.id = team_join_requests.team_id
        and t.manager_id = (select auth.uid())
    )
  );

-- Recreate approval as SECURITY DEFINER so inserting the approved member is not blocked by RLS.
create or replace function public.approve_team_join_request(p_request_id uuid)
returns public.team_join_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_req public.team_join_requests;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;

  select * into v_req
  from public.team_join_requests
  where id = p_request_id
  for update;

  if v_req.id is null then raise exception 'Join request not found'; end if;
  if not exists (
    select 1 from public.teams
    where id = v_req.team_id and manager_id = v_uid
  ) then
    raise exception 'Only the team manager can approve requests';
  end if;
  if v_req.status <> 'pending' then raise exception 'Request is not pending'; end if;

  insert into public.team_members(team_id, player_id, is_active)
  values (v_req.team_id, v_req.player_id, true)
  on conflict (team_id, player_id) do update set is_active = true;

  update public.team_join_requests
  set status = 'approved', updated_at = now()
  where id = v_req.id
  returning * into v_req;

  return v_req;
end;
$$;

revoke all on function public.approve_team_join_request(uuid) from public;
grant execute on function public.approve_team_join_request(uuid) to authenticated;
