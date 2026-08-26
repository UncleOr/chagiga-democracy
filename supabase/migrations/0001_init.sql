-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  חגיגה של דמוקרטיה — schema, RLS, triggers                             ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Run this in the Supabase SQL editor (or `supabase db push`).

-- ── Extensions ────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;

-- ── Admin bootstrap list ───────────────────────────────────────────────────
-- Emails here become admins automatically on first login. Edit as needed.
create table if not exists public.admin_emails (
  email text primary key
);

-- ── Profiles ───────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  is_admin boolean not null default false,
  banned boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Rounds ──────────────────────────────────────────────────────────────────
create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'draft' check (status in ('draft','open','closed','settled')),
  threshold_pct numeric not null default 4,
  base_bet numeric not null default 50,
  double_cost numeric not null default 50,
  sniper_cost numeric not null default 20,
  passfail_cost numeric not null default 30,
  gold_first_pct numeric not null default 0.75,
  gold_second_pct numeric not null default 0.25,
  sniper_first_pct numeric not null default 0.75,
  sniper_second_pct numeric not null default 0.25,
  paybox_url text,
  closes_at timestamptz,               -- auto-close time ("המועד הקובע")
  created_at timestamptz not null default now()
);

-- ── Parties (per round) ─────────────────────────────────────────────────────
create table if not exists public.parties (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds (id) on delete cascade,
  name text not null,
  nickname text not null,
  display_order int not null default 0,
  is_swing boolean not null default false,
  bloc text check (bloc in ('coalition','change','arab')),  -- political bloc (live bloc meter)
  actual_seats int,
  actual_passed boolean
);
create index if not exists parties_round_idx on public.parties (round_id, display_order);

-- ── Bids (one per user per round) ────────────────────────────────────────────
create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  nickname text not null,
  email text not null,
  is_double boolean not null default false,
  has_sniper boolean not null default false,
  has_passfail boolean not null default false,
  amount_due numeric not null default 50,
  payment_claimed boolean not null default false, -- user said "I paid"
  paid boolean not null default false,            -- admin confirmed
  paid_at timestamptz,
  frozen boolean not null default false,          -- rule 3.1.4 (1–3 seats)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (round_id, user_id)
);
create index if not exists bids_round_idx on public.bids (round_id);

create table if not exists public.bid_seats (
  bid_id uuid not null references public.bids (id) on delete cascade,
  party_id uuid not null references public.parties (id) on delete cascade,
  seats int not null default 0,
  primary key (bid_id, party_id)
);

create table if not exists public.bid_passfail (
  bid_id uuid not null references public.bids (id) on delete cascade,
  party_id uuid not null references public.parties (id) on delete cascade,
  predicted_pass boolean not null,
  primary key (bid_id, party_id)
);

-- ── Helpers ───────────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Auto-fill is_admin from bootstrap list, keep updated_at fresh.
create or replace function public.on_profile_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.admin_emails where lower(email) = lower(new.email)) then
    new.is_admin := true;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_profile_insert on public.profiles;
create trigger trg_profile_insert before insert on public.profiles
  for each row execute function public.on_profile_insert();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
drop trigger if exists trg_bids_touch on public.bids;
create trigger trg_bids_touch before update on public.bids
  for each row execute function public.touch_updated_at();

-- ── Public leaderboard view (no email / user_id exposed) ─────────────────────
create or replace view public.v_public_bids
with (security_invoker = off) as
  select b.id, b.round_id, b.nickname, b.is_double, b.has_sniper, b.has_passfail,
         b.paid, b.frozen, b.created_at
  from public.bids b;

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  Row Level Security                                                    ║
-- ╚══════════════════════════════════════════════════════════════════════╝
alter table public.profiles     enable row level security;
alter table public.rounds       enable row level security;
alter table public.parties      enable row level security;
alter table public.bids         enable row level security;
alter table public.bid_seats    enable row level security;
alter table public.bid_passfail enable row level security;
alter table public.admin_emails enable row level security;

-- profiles: see own or (admin sees all); insert own on first login; update own display_name.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert
  with check (id = auth.uid());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- rounds: everyone reads non-draft rounds; admins read/write all.
drop policy if exists rounds_select on public.rounds;
create policy rounds_select on public.rounds for select
  using (status <> 'draft' or public.is_admin());
drop policy if exists rounds_admin on public.rounds;
create policy rounds_admin on public.rounds for all
  using (public.is_admin()) with check (public.is_admin());

-- parties: readable for non-draft rounds; admins manage.
drop policy if exists parties_select on public.parties;
create policy parties_select on public.parties for select
  using (
    public.is_admin()
    or exists (select 1 from public.rounds r where r.id = round_id and r.status <> 'draft')
  );
drop policy if exists parties_admin on public.parties;
create policy parties_admin on public.parties for all
  using (public.is_admin()) with check (public.is_admin());

-- bids: owner sees own full row; admins see all. Writes happen server-side
-- (service role) so no INSERT/UPDATE policy for regular users.
drop policy if exists bids_select on public.bids;
create policy bids_select on public.bids for select
  using (user_id = auth.uid() or public.is_admin());

-- predictions are public (rule 2.6) — readable by everyone.
drop policy if exists bid_seats_select on public.bid_seats;
create policy bid_seats_select on public.bid_seats for select using (true);
drop policy if exists bid_passfail_select on public.bid_passfail;
create policy bid_passfail_select on public.bid_passfail for select using (true);

-- admin_emails: only admins can read; edited via SQL/dashboard otherwise.
drop policy if exists admin_emails_select on public.admin_emails;
create policy admin_emails_select on public.admin_emails for select
  using (public.is_admin());

-- expose the public view
grant select on public.v_public_bids to anon, authenticated;
