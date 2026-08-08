-- My Team visibility / RLS repair
-- Run this in Supabase SQL Editor after the existing My Team migrations.

-- The teams table is public to authenticated users for discovery.
alter table public.teams enable row level security;

drop policy if exists "teams_select_authenticated" on public.teams;
create policy "teams_select_authenticated"
on public.teams
for select
to authenticated
using (true);

-- Authenticated users can discover teams without being members first.
drop policy if exists "teams_search_authenticated" on public.teams;
create policy "teams_search_authenticated"
on public.teams
for select
to authenticated
using (true);

-- Make sure the discovery RPC exists and does not depend on the caller's
-- membership. This is used by Join Team/search_teams.
create or replace function public.list_teams()
returns setof public.teams
language sql
security definer
set search_path = public
stable
as $$
  select t.*
  from public.teams t
  order by t.created_at desc
  limit 100;
$$;

create or replace function public.search_teams(p_query text)
returns setof public.teams
language sql
security definer
set search_path = public
stable
as $$
  select t.*
  from public.teams t
  where nullif(trim(p_query), '') is not null
    and (
      lower(t.name) like '%' || lower(trim(p_query)) || '%'
      or lower(t.short_name) like '%' || lower(trim(p_query)) || '%'
    )
  order by t.created_at desc
  limit 50;
$$;

revoke all on function public.list_teams() from public;
grant execute on function public.list_teams() to authenticated;

revoke all on function public.search_teams(text) from public;
grant execute on function public.search_teams(text) to authenticated;

-- Join requests: a logged-in player can create/view their own request.
alter table public.team_join_requests enable row level security;

drop policy if exists "join_requests_insert_self" on public.team_join_requests;
create policy "join_requests_insert_self"
on public.team_join_requests
for insert
to authenticated
with check (player_id = (select auth.uid()));

drop policy if exists "join_requests_select_own_or_manager" on public.team_join_requests;
create policy "join_requests_select_own_or_manager"
on public.team_join_requests
for select
to authenticated
using (
  player_id = (select auth.uid())
  or exists (
    select 1 from public.teams t
    where t.id = team_join_requests.team_id
      and t.manager_id = (select auth.uid())
  )
);

-- Team members: users can see their own membership; managers can see squad.
alter table public.team_members enable row level security;

drop policy if exists "team_members_select_own_or_manager" on public.team_members;
create policy "team_members_select_own_or_manager"
on public.team_members
for select
to authenticated
using (
  player_id = (select auth.uid())
  or exists (
    select 1 from public.teams t
    where t.id = team_members.team_id
      and t.manager_id = (select auth.uid())
  )
);
