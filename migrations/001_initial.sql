-- CLEAR Command Center — initial schema
-- Run this in the Supabase SQL Editor after creating the project.
-- Version: v1.0 (2026-04-23)

-- ─── users ─────────────────────────────────────────────────────────────────
-- Keyed to auth.users(id). `enrolled_weeks` gates the left-nav lock state.
create table if not exists public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text,
  name            text,
  cohort          text,
  enrolled_weeks  integer default 1,
  created_at      timestamptz default now()
);

alter table public.users enable row level security;

drop policy if exists "users_self_select" on public.users;
create policy "users_self_select" on public.users
  for select using (auth.uid() = id);

drop policy if exists "users_self_insert" on public.users;
create policy "users_self_insert" on public.users
  for insert with check (auth.uid() = id);

drop policy if exists "users_self_update" on public.users;
create policy "users_self_update" on public.users
  for update using (auth.uid() = id);

-- ─── command_center_data ──────────────────────────────────────────────────
-- Tab-indexed field storage. One row per (user, week, subtab, field).
-- All values are stored as text; the app parses on read.
create table if not exists public.command_center_data (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  week_slug    text not null,
  subtab_slug  text not null,
  field_key    text not null,
  value        text,
  updated_at   timestamptz default now(),
  constraint command_center_data_pk_uq unique (user_id, week_slug, subtab_slug, field_key)
);

create index if not exists command_center_data_user_idx on public.command_center_data (user_id);

alter table public.command_center_data enable row level security;

drop policy if exists "ccd_self_all" on public.command_center_data;
create policy "ccd_self_all" on public.command_center_data
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── freedom_log ──────────────────────────────────────────────────────────
-- Append-only annual log. Rows can never be deleted; only `notes` can be
-- updated after insert. Enforced via RLS + column-level update restriction.
create table if not exists public.freedom_log (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  year                integer not null,
  pv                  numeric,
  fv_adjusted         numeric,
  r_required          numeric,
  r_breakeven         numeric,
  effective_tax_rate  numeric,
  cpi_used            numeric,
  n_remaining         integer,
  strategy_summary    text,
  notes               text,
  created_at          timestamptz default now()
);

create index if not exists freedom_log_user_year_idx on public.freedom_log (user_id, year);

alter table public.freedom_log enable row level security;

-- Users may select and insert their own rows.
drop policy if exists "freedom_log_self_select" on public.freedom_log;
create policy "freedom_log_self_select" on public.freedom_log
  for select using (auth.uid() = user_id);

drop policy if exists "freedom_log_self_insert" on public.freedom_log;
create policy "freedom_log_self_insert" on public.freedom_log
  for insert with check (auth.uid() = user_id);

-- Users may update ONLY the notes column of their own rows.
-- (Supabase RLS can't restrict columns directly — we use a trigger.)
drop policy if exists "freedom_log_self_update" on public.freedom_log;
create policy "freedom_log_self_update" on public.freedom_log
  for update using (auth.uid() = user_id);

create or replace function public.freedom_log_guard()
returns trigger
language plpgsql
as $$
begin
  -- Protect all non-notes columns from updates
  if new.user_id is distinct from old.user_id
     or new.year is distinct from old.year
     or new.pv is distinct from old.pv
     or new.fv_adjusted is distinct from old.fv_adjusted
     or new.r_required is distinct from old.r_required
     or new.r_breakeven is distinct from old.r_breakeven
     or new.effective_tax_rate is distinct from old.effective_tax_rate
     or new.cpi_used is distinct from old.cpi_used
     or new.n_remaining is distinct from old.n_remaining
     or new.strategy_summary is distinct from old.strategy_summary
     or new.created_at is distinct from old.created_at
  then
    raise exception 'freedom_log is append-only; only `notes` may be updated.';
  end if;
  return new;
end;
$$;

drop trigger if exists freedom_log_guard_trg on public.freedom_log;
create trigger freedom_log_guard_trg
  before update on public.freedom_log
  for each row execute function public.freedom_log_guard();

-- No DELETE policy → deletes are blocked by default under RLS.
