-- My Team foundation: safe to run on an existing Supabase project.
-- Does not depend on the old cricket schema migration.

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
  manager_id uuid not null default auth.uid(),
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
create index if not exists idx_teams_name on public.teams using gin (to_tsvector('simple', name));
create index if not exists idx_team_members_player on public.team_members(player_id, is_active);
create index if not exists idx_team_members_team on public.team_members(team_id, is_active);
create index if not exists idx_team_join_requests_team on public.team_join_requests(team_id, status);
create index if not exists idx_team_join_requests_player on public.team_join_requests(player_id, status);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_join_requests enable row level security;

drop policy if exists "teams_select_authenticated" on public.teams;
create policy "teams_select_authenticated" on public.teams
  for select to authenticated using (true);

drop policy if exists "teams_insert_self_manager" on public.teams;
create policy "teams_insert_self_manager" on public.teams
  for insert to authenticated
  with check (manager_id = auth.uid());

drop policy if exists "teams_update_manager" on public.teams;
create policy "teams_update_manager" on public.teams
  for update to authenticated
  using (manager_id = auth.uid())
  with check (manager_id = auth.uid());

drop policy if exists "teams_delete_manager" on public.teams;
create policy "teams_delete_manager" on public.teams
  for delete to authenticated
  using (manager_id = auth.uid());

drop policy if exists "team_members_select_own_or_manager" on public.team_members;
create policy "team_members_select_own_or_manager" on public.team_members
  for select to authenticated
  using (
    player_id = auth.uid()
    or exists (select 1 from public.teams t where t.id = team_id and t.manager_id = auth.uid())
  );

drop policy if exists "team_members_insert_self_or_manager" on public.team_members;
create policy "team_members_insert_self_or_manager" on public.team_members
  for insert to authenticated
  with check (
    player_id = auth.uid()
    or exists (select 1 from public.teams t where t.id = team_id and t.manager_id = auth.uid())
  );

drop policy if exists "team_members_update_manager" on public.team_members;
create policy "team_members_update_manager" on public.team_members
  for update to authenticated
  using (exists (select 1 from public.teams t where t.id = team_id and t.manager_id = auth.uid()))
  with check (exists (select 1 from public.teams t where t.id = team_id and t.manager_id = auth.uid()));

drop policy if exists "team_members_delete_self_or_manager" on public.team_members;
create policy "team_members_delete_self_or_manager" on public.team_members
  for delete to authenticated
  using (
    player_id = auth.uid()
    or exists (select 1 from public.teams t where t.id = team_id and t.manager_id = auth.uid())
  );

drop policy if exists "join_requests_select_own_or_manager" on public.team_join_requests;
create policy "join_requests_select_own_or_manager" on public.team_join_requests
  for select to authenticated
  using (
    player_id = auth.uid()
    or exists (select 1 from public.teams t where t.id = team_id and t.manager_id = auth.uid())
  );

drop policy if exists "join_requests_insert_self" on public.team_join_requests;
create policy "join_requests_insert_self" on public.team_join_requests
  for insert to authenticated
  with check (player_id = auth.uid());

drop policy if exists "join_requests_update_self_or_manager" on public.team_join_requests;
create policy "join_requests_update_self_or_manager" on public.team_join_requests
  for update to authenticated
  using (
    player_id = auth.uid()
    or exists (select 1 from public.teams t where t.id = team_id and t.manager_id = auth.uid())
  )
  with check (
    player_id = auth.uid()
    or exists (select 1 from public.teams t where t.id = team_id and t.manager_id = auth.uid())
  );

-- Automatically turn an approved request into an active team member.
create or replace function public.approve_team_join_request(p_request_id uuid)
returns public.team_join_requests
language plpgsql
security invoker
set search_path = public
as $$
declare
  req public.team_join_requests;
begin
  select * into req from public.team_join_requests where id = p_request_id for update;
  if req.id is null then raise exception 'Join request not found'; end if;
  if not exists (select 1 from public.teams where id = req.team_id and manager_id = auth.uid()) then
    raise exception 'Only the team manager can approve requests';
  end if;
  if req.status <> 'pending' then raise exception 'Request is not pending'; end if;
  insert into public.team_members(team_id, player_id, is_active)
  values (req.team_id, req.player_id, true)
  on conflict (team_id, player_id) do update set is_active = true;
  update public.team_join_requests set status = 'approved', updated_at = now() where id = req.id returning * into req;
  return req;
end;
$$;

grant execute on function public.approve_team_join_request(uuid) to authenticated;
