-- ============================================================
-- TiquiApp - Supabase Schema
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- ── PROFILES (extiende auth.users) ───────────────────────────
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text not null unique,
  first_name       text not null default '',
  last_name        text not null default '',
  role             text not null default 'employee' check (role in ('admin','manager','employee')),
  active           boolean not null default true,
  address          text,
  area             text,
  community        text check (community in ('madrid','galicia')),
  weekly_hours_target integer default 40,
  manager_id       uuid references public.profiles(id) on delete set null,
  vacation_dates   text[] default '{}',
  avatar           text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── DAILY REPORTS ─────────────────────────────────────────────
create table if not exists public.daily_reports (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  date_iso      date not null,
  day_status    text not null default 'not-clocked'
                  check (day_status in ('not-clocked','clocked-in','on-pause','clocked-out','holiday','weekend','vacation')),
  worked_hours  text not null default '0h 0m',
  total_minutes integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, date_iso)
);

-- ── TIMELINE EVENTS ────────────────────────────────────────────
create table if not exists public.timeline_events (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references public.daily_reports(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  timestamp   timestamptz not null,
  event_type  text not null check (event_type in ('in','out','pause')),
  description text not null default '',
  created_at  timestamptz not null default now()
);

-- ── FICHAJES ──────────────────────────────────────────────────
create table if not exists public.fichajes (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  date_iso         date not null,
  hours            text not null,
  description      text not null default '',
  status           text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  submitted_by     uuid not null references public.profiles(id),
  submitted_at     timestamptz not null default now(),
  manager_id       uuid references public.profiles(id),
  approved_at      timestamptz,
  rejection_reason text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── INCIDENCIAS ───────────────────────────────────────────────
create table if not exists public.incidencias (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  manager_id  uuid references public.profiles(id),
  type        text not null,
  description text not null default '',
  status      text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  date_iso    date not null,
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── UPDATED_AT TRIGGER ────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace trigger trg_daily_reports_updated_at
  before update on public.daily_reports
  for each row execute function public.set_updated_at();

create or replace trigger trg_fichajes_updated_at
  before update on public.fichajes
  for each row execute function public.set_updated_at();

create or replace trigger trg_incidencias_updated_at
  before update on public.incidencias
  for each row execute function public.set_updated_at();

-- ── AUTO-CREAR PROFILE AL REGISTRAR USUARIO ──────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'employee')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.daily_reports enable row level security;
alter table public.timeline_events enable row level security;
alter table public.fichajes enable row level security;
alter table public.incidencias enable row level security;

-- Profiles: cada usuario ve su propio perfil; admin/manager ven todos
create policy "profiles: own read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: admin/manager read all"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','manager')
    )
  );

create policy "profiles: admin/manager write"
  on public.profiles for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','manager')
    )
  );

-- Daily reports: usuario ve los suyos; manager/admin ven todos
create policy "daily_reports: own"
  on public.daily_reports for all
  using (auth.uid() = user_id);

create policy "daily_reports: manager/admin"
  on public.daily_reports for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','manager')
    )
  );

-- Timeline events: igual que daily_reports
create policy "timeline_events: own"
  on public.timeline_events for all
  using (auth.uid() = user_id);

create policy "timeline_events: manager/admin"
  on public.timeline_events for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','manager')
    )
  );

-- Fichajes: usuario ve los suyos; manager ve los de su equipo
create policy "fichajes: own"
  on public.fichajes for all
  using (auth.uid() = user_id);

create policy "fichajes: manager"
  on public.fichajes for all
  using (auth.uid() = manager_id);

create policy "fichajes: admin"
  on public.fichajes for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Incidencias: usuario ve las suyas; manager/admin gestionan
create policy "incidencias: own"
  on public.incidencias for all
  using (auth.uid() = user_id);

create policy "incidencias: manager"
  on public.incidencias for all
  using (auth.uid() = manager_id);

create policy "incidencias: admin"
  on public.incidencias for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
