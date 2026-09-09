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

    -- Finalized 26th-Knesset lists (candidate lists closed, Sep 2026).
    insert into public.parties (round_id, name, nickname, display_order, is_swing, bloc, poll_seats) values
      (rid, 'ישר בראשות גדי איזנקוט',                'ישר',            1,  false, 'change',    21),
      (rid, 'הליכוד בראשות בנימין נתניהו',            'הליכוד',         2,  false, 'coalition', 22),
      (rid, 'ביחד בראשות נפתלי בנט',                  'ביחד',           3,  false, 'change',    15),
      (rid, 'הדמוקרטים בראשות יאיר גולן',            'הדמוקרטים',      4,  false, 'change',    10),
      (rid, 'ישראל ביתנו בראשות אביגדור ליברמן',      'ישראל ביתנו',    5,  false, 'change',    9),
      (rid, 'עוצמה יהודית בראשות איתמר בן גביר',      'עוצמה יהודית',   6,  false, 'coalition', 8),
      (rid, 'ש"ס בראשות אריה דרעי',                   'ש"ס',            7,  false, 'coalition', 9),
      (rid, 'יהדות התורה בראשות יצחק גולדקנופף',      'יהדות התורה',    8,  false, 'coalition', 7),
      (rid, 'הרשימה המשותפת בראשות יוסף ג''בארין',    'הרשימה המשותפת', 9,  false, 'arab',      8),
      (rid, 'רע"מ בראשות מנסור עבאס',                 'רע"מ',          10,  false, 'arab',      5),
      (rid, 'הציונות הדתית בראשות בצלאל סמוטריץ''',    'הציונות הדתית', 11,  true,  'coalition', 4),
      (rid, 'כחול לבן בראשות בני גנץ',                'כחול לבן',      12,  true,  'change',    3),
      (rid, 'המילואימניקים בראשות יועז הנדל',         'המילואימניקים', 13,  true,  'change',    2),
      (rid, 'עמך ישראל בראשות עופר וינטר',            'עמך ישראל',     14,  true,  'coalition', 2);
  end if;
end $$;
