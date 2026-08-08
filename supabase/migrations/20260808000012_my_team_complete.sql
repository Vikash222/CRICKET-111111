-- Complete My Team setup. Safe to run on an existing Supabase project.
-- Creates missing tables, RLS, and server-side RPCs used by MyTeamView.

create extension if not exists pgcrypto;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null,
  college_id uuid null,
  logo_url text null,
  jersey_color text null,
  captain_id uuid null,
  vice_captain_id uuid null,
  wicket_keeper_id uuid null,
  manager_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teams_name_not_blank check (length(trim(name)) > 0),
  constraint teams_short_name_not_blank check (length(trim(short_name)) > 0)
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null,
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  unique(team_id, player_id)
);

create table if not exists public.team_join_requests (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(team_id, player_id)
);

create index if not exists idx_teams_manager_id on public.teams(manager_id);
create index if not exists idx_teams_name on public.teams(name);
create index if not exists idx_teams_short_name on public.teams(short_name);
create index if not exists idx_team_members_player on public.team_members(player_id, is_active);
create index if not exists idx_team_join_requests_player on public.team_join_requests(player_id, status);
create index if not exists idx_team_join_requests_team on public.team_join_requests(team_id, status);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_join_requests enable row level security;

-- Public-to-authenticated search/read access is deliberately limited to team metadata.
drop policy if exists "teams_select_authenticated" on public.teams;
create policy "teams_select_authenticated" on public.teams
  for select to authenticated using (true);

drop policy if exists "teams_insert_self_manager" on public.teams;
create policy "teams_insert_self_manager" on public.teams
  for insert to authenticated with check (manager_id = auth.uid());

drop policy if exists "teams_update_manager" on public.teams;
create policy "teams_update_manager" on public.teams
  for update to authenticated using (manager_id = auth.uid()) with check (manager_id = auth.uid());

drop policy if exists "teams_delete_manager" on public.teams;
create policy "teams_delete_manager" on public.teams
  for delete to authenticated using (manager_id = auth.uid());

drop policy if exists "team_members_select_own_or_manager" on public.team_members;
create policy "team_members_select_own_or_manager" on public.team_members
  for select to authenticated using (
    player_id = auth.uid() or exists (
      select 1 from public.teams t where t.id = team_members.team_id and t.manager_id = auth.uid()
    )
  );

drop policy if exists "team_members_insert_self_or_manager" on public.team_members;
create policy "team_members_insert_self_or_manager" on public.team_members
  for insert to authenticated with check (
    player_id = auth.uid() or exists (
      select 1 from public.teams t where t.id = team_members.team_id and t.manager_id = auth.uid()
    )
  );

drop policy if exists "join_requests_select_own_or_manager" on public.team_join_requests;
create policy "join_requests_select_own_or_manager" on public.team_join_requests
  for select to authenticated using (
    player_id = auth.uid() or exists (
      select 1 from public.teams t where t.id = team_join_requests.team_id and t.manager_id = auth.uid()
    )
  );

drop policy if exists "join_requests_insert_self" on public.team_join_requests;
create policy "join_requests_insert_self" on public.team_join_requests
  for insert to authenticated with check (player_id = auth.uid());

drop policy if exists "join_requests_update_self_or_manager" on public.team_join_requests;
create policy "join_requests_update_self_or_manager" on public.team_join_requests
  for update to authenticated using (
    player_id = auth.uid() or exists (
      select 1 from public.teams t where t.id = team_join_requests.team_id and t.manager_id = auth.uid()
    )
  ) with check (
    player_id = auth.uid() or exists (
      select 1 from public.teams t where t.id = team_join_requests.team_id and t.manager_id = auth.uid()
    )
  );

-- Create a team without trusting manager_id from the client.
create or replace function public.create_team(p_name text, p_short_name text, p_college_id uuid default null)
returns public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_team public.teams;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if nullif(trim(p_name), '') is null then raise exception 'Team name is required'; end if;
  if nullif(trim(p_short_name), '') is null then raise exception 'Team short name is required'; end if;

  insert into public.teams(name, short_name, college_id, manager_id)
  values(trim(p_name), upper(trim(p_short_name)), p_college_id, v_uid)
  returning * into v_team;

  insert into public.team_members(team_id, player_id, is_active)
  values(v_team.id, v_uid, true)
  on conflict(team_id, player_id) do update set is_active = true;

  return v_team;
end;
$$;

-- Search RPC avoids fragile client-side OR/ilike queries and uses only team metadata.
create or replace function public.search_teams(p_query text)
returns table(id uuid, name text, short_name text, logo_url text, manager_id uuid, college_id uuid)
language sql
security definer
set search_path = public
as $$
  select t.id, t.name, t.short_name, t.logo_url, t.manager_id, t.college_id
  from public.teams t
  where nullif(trim(p_query), '') is not null
    and (t.name ilike '%' || trim(p_query) || '%' or t.short_name ilike '%' || trim(p_query) || '%')
  order by t.created_at desc
  limit 20;
$$;

-- Join request RPC uses auth.uid() instead of trusting player_id from the client.
create or replace function public.request_team_join(p_team_id uuid)
returns public.team_join_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_request public.team_join_requests;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if not exists(select 1 from public.teams where id = p_team_id) then raise exception 'Team not found'; end if;
  if exists(select 1 from public.team_members where team_id = p_team_id and player_id = v_uid and is_active) then
    raise exception 'You are already a member of this team';
  end if;

  insert into public.team_join_requests(team_id, player_id, status)
  values(p_team_id, v_uid, 'pending')
  on conflict(team_id, player_id) do update set status = 'pending', updated_at = now()
  returning * into v_request;

  return v_request;
end;
$$;

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
  select * into v_req from public.team_join_requests where id = p_request_id for update;
  if v_req.id is null then raise exception 'Join request not found'; end if;
  if not exists(select 1 from public.teams where id = v_req.team_id and manager_id = v_uid) then raise exception 'Only the team manager can approve requests'; end if;
  if v_req.status <> 'pending' then raise exception 'Request is not pending'; end if;

  insert into public.team_members(team_id, player_id, is_active)
  values(v_req.team_id, v_req.player_id, true)
  on conflict(team_id, player_id) do update set is_active = true;

  update public.team_join_requests set status = 'approved', updated_at = now()
  where id = v_req.id returning * into v_req;
  return v_req;
end;
$$;

revoke all on function public.create_team(text,text,uuid) from public;
grant execute on function public.create_team(text,text,uuid) to authenticated;
revoke all on function public.search_teams(text) from public;
grant execute on function public.search_teams(text) to authenticated;
revoke all on function public.request_team_join(uuid) from public;
grant execute on function public.request_team_join(uuid) to authenticated;
revoke all on function public.approve_team_join_request(uuid) from public;
grant execute on function public.approve_team_join_request(uuid) to authenticated;
