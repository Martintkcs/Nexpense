-- ============================================================
-- Nexpense – Rendszer kategória ID-k javítása
-- A régi seed auto-generált UUID-kat hozott létre.
-- Ez a migráció törli és rögzített UUID-kkal újra beilleszti őket.
-- Az expenses.category_id FK ON DELETE SET NULL → a régi kiadásoknál null lesz,
-- de a jövőbeli kiadások már a helyes rögzített ID-kat kapják.
-- ============================================================

-- 1. Régi rendszer kategóriák törlése
--    (expenses.category_id ON DELETE SET NULL miatt a kiadások megmaradnak,
--     csak a category_id lesz null)
DELETE FROM public.categories WHERE is_system = TRUE;

-- 2. Újra beillesztés rögzített UUID-kkal (megegyeznek a constants.ts CAT_IDS-dal)
INSERT INTO public.categories (id, name, name_hu, icon, color, is_system, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'food',          'Étel & Ital',                '🍽️',  '#F97316', TRUE,  1),
  ('00000000-0000-0000-0000-000000000002', 'transport',     'Közlekedés',                 '🚌',  '#3B82F6', TRUE,  2),
  ('00000000-0000-0000-0000-000000000003', 'shopping',      'Vásárlás & Ruha',            '🛍️',  '#EC4899', TRUE,  3),
  ('00000000-0000-0000-0000-000000000004', 'entertainment', 'Szórakozás',                 '🎬',  '#8B5CF6', TRUE,  4),
  ('00000000-0000-0000-0000-000000000005', 'health',        'Egészség & Gyógyszer',       '💊',  '#10B981', TRUE,  5),
  ('00000000-0000-0000-0000-000000000006', 'housing',       'Lakás',                      '🏠',  '#6366F1', TRUE,  6),
  ('00000000-0000-0000-0000-000000000007', 'utilities',     'Rezsik & Számlák',           '⚡',  '#64748B', TRUE,  7),
  ('00000000-0000-0000-0000-000000000008', 'subscriptions', 'Előfizetések',               '🎵',  '#EF4444', TRUE,  8),
  ('00000000-0000-0000-0000-000000000009', 'education',     'Oktatás & Könyvek',          '📚',  '#0EA5E9', TRUE,  9),
  ('00000000-0000-0000-0000-000000000010', 'travel',        'Utazás & Nyaralás',          '✈️',  '#06B6D4', TRUE, 10),
  ('00000000-0000-0000-0000-000000000011', 'personal',      'Személyes gondoskodás',      '💆',  '#F472B6', TRUE, 11),
  ('00000000-0000-0000-0000-000000000012', 'gifts',         'Ajándékok',                  '🎁',  '#FB7185', TRUE, 12),
  ('00000000-0000-0000-0000-000000000013', 'savings',       'Megtakarítás',               '🏦',  '#34D399', TRUE, 13),
  ('00000000-0000-0000-0000-000000000014', 'other',         'Egyéb',                      '📦',  '#9CA3AF', TRUE, 14);
