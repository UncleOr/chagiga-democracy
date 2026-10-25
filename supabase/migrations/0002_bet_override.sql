-- Per-user personal betting window: lets an admin reopen betting for a single
-- user until a specific time, even after the round globally closed.
alter table public.profiles
  add column if not exists bet_open_until timestamptz;
