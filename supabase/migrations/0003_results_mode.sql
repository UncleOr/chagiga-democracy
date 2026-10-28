-- Results display mode + "percent of vote counted" + last-updated timestamp.
-- mode: 'samples' (ממוצע מדגמים) | 'live' (אחוז מתוצאות אמת) | 'final' (תוצאות סופיות)
alter table public.rounds
  add column if not exists results_mode text not null default 'samples',
  add column if not exists results_pct numeric,
  add column if not exists results_updated_at timestamptz;
