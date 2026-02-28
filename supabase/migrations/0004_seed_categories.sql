-- ============================================================
-- Nexpense – Rendszer kategóriák (seed adatok)
-- user_id = NULL → mindenki látja
-- ============================================================

INSERT INTO public.categories (name, name_hu, icon, color, is_system, sort_order) VALUES
  ('food',           'Étel & Ital',          '🍽️',  '#F97316', TRUE,  1),
  ('transport',      'Közlekedés',            '🚌',  '#3B82F6', TRUE,  2),
  ('shopping',       'Vásárlás & Ruha',       '🛍️',  '#EC4899', TRUE,  3),
  ('entertainment',  'Szórakozás',            '🎬',  '#8B5CF6', TRUE,  4),
  ('health',         'Egészség & Gyógyszer',  '💊',  '#10B981', TRUE,  5),
  ('housing',        'Lakás',                 '🏠',  '#6366F1', TRUE,  6),
  ('utilities',      'Rezsik & Számlák',      '⚡',  '#64748B', TRUE,  7),
  ('subscriptions',  'Előfizetések',          '🎵',  '#EF4444', TRUE,  8),
  ('education',      'Oktatás & Könyvek',     '📚',  '#0EA5E9', TRUE,  9),
  ('travel',         'Utazás & Nyaralás',     '✈️',  '#06B6D4', TRUE, 10),
  ('personal',       'Személyes gondoskodás', '💆',  '#F472B6', TRUE, 11),
  ('gifts',          'Ajándékok',             '🎁',  '#FB7185', TRUE, 12),
  ('savings',        'Megtakarítás',          '🏦',  '#34D399', TRUE, 13),
  ('other',          'Egyéb',                 '📦',  '#9CA3AF', TRUE, 14)
ON CONFLICT DO NOTHING;
