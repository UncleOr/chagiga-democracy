-- Seed data. Safe to run once after 0001_init.sql.
-- Adjust the admin emails and the party lineup to your election.

-- ── Admins (auto-granted on first Google login) ─────────────────────────────
insert into public.admin_emails (email) values
  ('or@42creative.co.il'),
  ('uncle.or@gmail.com')
on conflict (email) do nothing;

-- ── A starter round (draft) + template party lineup ─────────────────────────
-- The lineup below is a template based on a recent election; edit it in the
-- admin panel to match the current polls before opening the round.
do $$
declare rid uuid;
begin
  if not exists (select 1 from public.rounds) then
    insert into public.rounds (name, status, paybox_url, closes_at)
      values ('בחירות — סבב הרצה', 'draft', null, null)
      returning id into rid;

    insert into public.parties (round_id, name, nickname, display_order, is_swing) values
      (rid, 'הליכוד',            'הליכוד',        1,  false),
      (rid, 'יש עתיד',           'יש עתיד',        2,  false),
      (rid, 'המחנה הממלכתי',     'המחנה הממלכתי',  3,  false),
      (rid, 'הציונות הדתית',     'הציונות הדתית',  4,  false),
      (rid, 'ש"ס',               'ש"ס',           5,  false),
      (rid, 'יהדות התורה',       'יהדות התורה',    6,  false),
      (rid, 'ישראל ביתנו',       'ישראל ביתנו',    7,  false),
      (rid, 'העבודה',            'העבודה',         8,  true),
      (rid, 'מרצ',               'מרצ',            9,  true),
      (rid, 'רע"מ',              'רע"מ',          10,  true),
      (rid, 'חד"ש-תע"ל',         'חד"ש-תע"ל',     11,  true),
      (rid, 'הבית היהודי',       'הבית היהודי',   12,  true),
      (rid, 'בל"ד',              'בל"ד',          13,  true);
  end if;
end $$;
