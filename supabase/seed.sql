-- Seed data. Safe to run once after 0001_init.sql.
-- Adjust the admin emails and the party lineup to your election.

-- ── Admins (auto-granted on first login) ─────────────────────────────────────
insert into public.admin_emails (email) values
  ('or@42creative.co.il'),
  ('uncle.or@gmail.com')
on conflict (email) do nothing;

-- ── A starter round (draft) + party lineup from the latest 2026 polls ────────
-- Snapshot of the party map from the July 2026 poll averages (Haaretz/Kan/N12).
-- Swing = parties hovering around the 4% threshold ("עוברת או לא"). Edit freely
-- in the admin panel to match the current polls before opening the round.
do $$
declare rid uuid;
begin
  if not exists (select 1 from public.rounds) then
    insert into public.rounds (name, status, paybox_url, closes_at)
      values ('בחירות 2026 — סבב הרצה', 'draft', null, null)
      returning id into rid;

    insert into public.parties (round_id, name, nickname, display_order, is_swing, bloc, poll_seats) values
      (rid, 'ישר בראשות גדי אייזנקוט',                              'ישר',           1,  false, 'change',    22),
      (rid, 'הליכוד בראשות בנימין נתניהו',                          'הליכוד',        2,  false, 'coalition', 22),
      (rid, 'ביחד בראשות נפתלי בנט ויאיר לפיד',                     'ביחד',          3,  false, 'change',    16),
      (rid, 'הדמוקרטים בראשות יאיר גולן',                          'הדמוקרטים',     4,  false, 'change',    10),
      (rid, 'ישראל ביתנו בראשות אביגדור ליברמן',                    'ישראל ביתנו',   5,  false, 'change',    10),
      (rid, 'עוצמה יהודית בראשות איתמר בן גביר',                    'עוצמה יהודית',  6,  false, 'coalition', 8),
      (rid, 'יהדות התורה בראשות יצחק גולדקנופף',                    'יהדות התורה',   7,  false, 'coalition', 7),
      (rid, 'ש"ס בראשות אריה דרעי',                                 'ש"ס',           8,  false, 'coalition', 9),
      (rid, 'חד"ש - תע"ל בראשות איימן עודה',                        'חד"ש - תע"ל',   9,  true,  'arab',      5),
      (rid, 'הציונות הדתית בראשות בצלאל סמוטריץ''',                  'הציונות הדתית', 10, true,  'coalition', 4),
      (rid, 'רע"מ בראשות מנסור עבאס',                               'רע"מ',          11, true,  'arab',      5),
      (rid, 'בית ציוני (המילואימניקים) בראשות חילי טרופר ויועז הנדל','בית ציוני',    12, true,  'change',    0),
      (rid, 'עמך ישראל בראשות עופר וינטר',                          'עמך ישראל',     13, true,  'coalition', 0),
      (rid, 'בל"ד בראשות סמי אבו שחאדה',                            'בל"ד',          14, true,  'arab',      0),
      (rid, 'האחדות בראשות גלעד ארדן',                              'האחדות',        15, true,  'change',    0),
      (rid, 'כחול לבן בראשות בני גנץ',                              'כחול לבן',      16, true,  'change',    0);
  end if;
end $$;
