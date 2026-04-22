-- Azure integrations + Team Leaders + Vacation requests
-- Run this script in Supabase SQL editor

-- 1) Extend profiles for Team Leader flag
alter table if exists public.profiles
  add column if not exists is_team_leader boolean not null default false;

-- 2) User integrations (Azure / Microsoft 365)
create table if not exists public.user_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('azure-devops', 'microsoft-365')),
  external_user_id text,
  tenant_id text,
  connection_status text not null default 'connected' check (connection_status in ('connected', 'error', 'expired', 'revoked')),
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

-- 3) Team assignments
create table if not exists public.team_leader_assignments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references auth.users(id) on delete cascade,
  team_leader_id uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid not null references auth.users(id),
  status text not null default 'active' check (status in ('active', 'pending_change', 'inactive')),
  requested_team_leader_id uuid references auth.users(id),
  request_note text,
  manager_decision_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id)
);

-- 4) Vacation requests
do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'vacation_request_status'
  ) then
    create type public.vacation_request_status as enum ('pending', 'approved', 'rejected', 'cancelled');
  end if;
end $$;

create table if not exists public.vacation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  manager_id uuid references auth.users(id),
  vacation_type text not null check (vacation_type in ('current-year', 'previous-year', 'legal')),
  start_date date not null,
  end_date date not null,
  days_count int not null check (days_count > 0),
  notes text,
  status public.vacation_request_status not null default 'pending',
  manager_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vacation_requests_dates_chk check (start_date <= end_date)
);

-- 5) Helper updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_integrations_updated_at on public.user_integrations;
create trigger trg_user_integrations_updated_at
before update on public.user_integrations
for each row
execute function public.set_updated_at();

drop trigger if exists trg_team_leader_assignments_updated_at on public.team_leader_assignments;
create trigger trg_team_leader_assignments_updated_at
before update on public.team_leader_assignments
for each row
execute function public.set_updated_at();

drop trigger if exists trg_vacation_requests_updated_at on public.vacation_requests;
create trigger trg_vacation_requests_updated_at
before update on public.vacation_requests
for each row
execute function public.set_updated_at();

-- 6) RLS enable
alter table public.user_integrations enable row level security;
alter table public.team_leader_assignments enable row level security;
alter table public.vacation_requests enable row level security;

-- 7) RLS policies: user_integrations
create policy if not exists user_integrations_select_own
on public.user_integrations
for select
to authenticated
using (auth.uid() = user_id);

create policy if not exists user_integrations_upsert_own
on public.user_integrations
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 8) RLS policies: team_leader_assignments
-- Employees can read own assignment
create policy if not exists team_assignments_select_own
on public.team_leader_assignments
for select
to authenticated
using (auth.uid() = employee_id or auth.uid() = team_leader_id);

-- Managers/Admins (by profile role) can manage all assignments
create policy if not exists team_assignments_manage_manager_admin
on public.team_leader_assignments
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
);

-- 9) RLS policies: vacation_requests
-- Users can read and create own requests
create policy if not exists vacation_requests_select_own
on public.vacation_requests
for select
to authenticated
using (auth.uid() = user_id);

create policy if not exists vacation_requests_insert_own
on public.vacation_requests
for insert
to authenticated
with check (auth.uid() = user_id);

-- Users can cancel own pending requests
create policy if not exists vacation_requests_update_own_pending
on public.vacation_requests
for update
to authenticated
using (auth.uid() = user_id and status = 'pending')
with check (auth.uid() = user_id);

-- Managers/Admins can read and review their direct reports' requests
create policy if not exists vacation_requests_manager_review
on public.vacation_requests
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
);
