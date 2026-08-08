-- Compatibility fix for existing Supabase projects whose teams table predates My Team.
-- Run this after 20260808000012_my_team_complete.sql.

alter table public.teams add column if not exists short_name text;
alter table public.teams add column if not exists logo_url text;
alter table public.teams add column if not exists college_id uuid;
alter table public.teams add column if not exists manager_id uuid;
alter table public.teams add column if not exists created_at timestamptz default now();
alter table public.teams add column if not exists updated_at timestamptz default now();

create index if not exists idx_teams_name on public.teams(name);
create index if not exists idx_teams_short_name on public.teams(short_name);
create index if not exists idx_teams_manager_id on public.teams(manager_id);

create or replace function public.list_teams()
returns table(id uuid, name text, short_name text, logo_url text, manager_id uuid, college_id uuid)
language sql
security definer
set search_path = public
as $$
  select t.id, t.name, t.short_name, t.logo_url, t.manager_id, t.college_id
  from public.teams t
  where t.name is not null
  order by t.created_at desc nulls last
  limit 100;
$$;

revoke all on function public.list_teams() from public;
grant execute on function public.list_teams() to authenticated;

alter table public.teams enable row level security;
drop policy if exists "teams_select_authenticated" on public.teams;
create policy "teams_select_authenticated" on public.teams
  for select to authenticated using (true);
