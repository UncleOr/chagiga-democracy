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

    insert into public.parties (round_id, name, nickname, display_order, is_swing) values
      (rid, 'ישר בראשות גדי אייזנקוט',                              'ישר',           1,  false),
      (rid, 'הליכוד בראשות בנימין נתניהו',                          'הליכוד',        2,  false),
      (rid, 'ביחד בראשות נפתלי בנט ויאיר לפיד',                     'ביחד',          3,  false),
      (rid, 'הדמוקרטים בראשות יאיר גולן',                          'הדמוקרטים',     4,  false),
      (rid, 'ישראל ביתנו בראשות אביגדור ליברמן',                    'ישראל ביתנו',   5,  false),
      (rid, 'עוצמה יהודית בראשות איתמר בן גביר',                    'עוצמה יהודית',  6,  false),
      (rid, 'יהדות התורה בראשות יצחק גולדקנופף',                    'יהדות התורה',   7,  false),
      (rid, 'ש"ס בראשות אריה דרעי',                                 'ש"ס',           8,  false),
      (rid, 'חד"ש - תע"ל בראשות איימן עודה',                        'חד"ש - תע"ל',   9,  true),
      (rid, 'הציונות הדתית בראשות בצלאל סמוטריץ''',                  'הציונות הדתית', 10, true),
      (rid, 'רע"מ בראשות מנסור עבאס',                               'רע"מ',          11, true),
      (rid, 'בית ציוני (המילואימניקים) בראשות חילי טרופר ויועז הנדל','בית ציוני',    12, true),
      (rid, 'עמך ישראל בראשות עופר וינטר',                          'עמך ישראל',     13, true),
      (rid, 'בל"ד בראשות סמי אבו שחאדה',                            'בל"ד',          14, true),
      (rid, 'האחדות בראשות גלעד ארדן',                              'האחדות',        15, true),
      (rid, 'כחול לבן בראשות בני גנץ',                              'כחול לבן',      16, true);
  end if;
end $$;
